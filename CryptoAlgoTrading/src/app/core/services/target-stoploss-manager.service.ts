import { Injectable } from '@angular/core';
import { DeltaService } from './delta.service';
import { LoggingService } from './logging.service';
import { ConfigService } from './config.service';

export interface TargetStopLossResult {
  success: boolean;
  symbol: string;
  productId: number;
  quantity: number;
  bracketOrderResult?: any;
  halfQuantityTargetResult?: any;
  error?: string;
  message?: string;
}

export interface PositionWithOrders {
  position: any;
  existingOrders: any[];
  hasExistingTargetOrSL: boolean;
}

/**
 * Target & Stop Loss Manager Service
 * Handles comprehensive target and stop loss placement with the following logic:
 * 1. Get all open positions from /v2/positions
 * 2. For each position, check if target/SL orders already exist via /v2/orders?product_ids=X&state=pending
 * 3. If no existing orders (total_count = 0), place bracket order for stop loss + take profit
 * 4. Then place a limit order for half quantity as additional target
 */
@Injectable({
  providedIn: 'root'
})
export class TargetStopLossManagerService {
  constructor(
    private deltaService: DeltaService,
    private logger: LoggingService,
    private configService: ConfigService
  ) {}

  /**
   * Main orchestration method - Place targets and stop losses for all open positions
   */
  async placeTargetsAndStopLossForAllPositions(): Promise<TargetStopLossResult[]> {
    try {
      this.logger.info('Starting target & stop loss placement for all positions');

      // Step 1: Get all open positions
      const positions = await this.deltaService.getPositions();
      this.logger.debug(`Retrieved ${positions.length} open positions`);

      if (positions.length === 0) {
        this.logger.info('No open positions found');
        return [];
      }

      // Step 2: For each position, check existing orders and place targets/SL if needed
      const results: TargetStopLossResult[] = [];

      for (const position of positions) {
        try {
          const result = await this.placeTargetAndStopLossForPosition(position);
          results.push(result);
        } catch (error: any) {
          this.logger.error(`Error processing position ${position.symbol}:`, error);
          results.push({
            success: false,
            symbol: position.symbol || `Product ${position.product_id}`,
            productId: position.product_id,
            quantity: position.size,
            error: error.message || String(error)
          });
        }
      }

      this.logger.info(`Target & stop loss placement completed. Results: ${results.length}`, results);
      return results;
    } catch (error: any) {
      this.logger.error('Error in placeTargetsAndStopLossForAllPositions:', error);
      throw error;
    }
  }

  /**
   * Place target and stop loss for a single position
   * Flow:
   * 1. Check if pending orders already exist for this product
   * 2. If no pending orders, place bracket order (stop loss + take profit)
   * 3. Then place half-quantity limit order as additional target
   */
  private async placeTargetAndStopLossForPosition(position: any): Promise<TargetStopLossResult> {
    const productId = position.product_id;
    const symbol = position.symbol || position.product_symbol || `Product ${productId}`;

    this.logger.info(`=== START PLACEMENT for ${symbol} ===`, {
      productId,
      side: position.side,
      size: position.size,
      entryPrice: position.entry_price || position.average_entry_price,
      markPrice: position.mark_price,
      liquidationPrice: position.liquidation_price
    });

    try {
      // Step 1: Check if target/stop loss orders already exist for this product
      const existingOrders = await this.checkExistingOrders(productId, symbol);
      const hasExistingOrders = existingOrders && existingOrders.length > 0;

      this.logger.debug(`Existing orders for ${symbol}:`, {
        count: existingOrders?.length || 0,
        hasExisting: hasExistingOrders,
        details: existingOrders
      });

      // Step 2: If orders already exist, skip this position
      if (hasExistingOrders) {
        this.logger.info(`Skipping ${symbol} - Target/SL orders already exist (${existingOrders.length} pending)`);
        return {
          success: false,
          symbol,
          productId,
          quantity: position.size,
          message: `Skipped - ${existingOrders.length} pending order(s) already exist`
        };
      }

      this.logger.info(`Proceeding with placement for ${symbol} - No existing orders found`);

      // Step 3: Fetch candle data to get prev3High and prev3Low (with timeout)
      const config = this.configService.getConfig() as any;
      const daysHighLow = config?.daysHighLow || 3;

      let prev3High = 0;
      let prev3Low = Infinity;
      let candlesFetched = false;

      try {
        // Get N+1 day candles so we can filter out current day and still have N previous complete days
        const now = Math.floor(Date.now() / 1000);
        const dayInSeconds = 86400;
        // Fetch extra day to ensure we have enough previous complete days after filtering
        const fromSec = now - ((daysHighLow + 1) * dayInSeconds);

        // Add timeout to prevent hanging on mobile
        const candles = await Promise.race([
          this.deltaService.getCandles(symbol, '1d', fromSec, now),
          new Promise<any[]>((_, reject) => 
            setTimeout(() => reject(new Error('Candle fetch timeout')), 10000) // 10 second timeout
          )
        ]);

        if (candles && candles.length > 0) {
          // Extract prev3High and prev3Low from PREVIOUS days only (exclude current day)
          // We need to identify and skip today's candle, then take the next N candles
          const candleDownloadTime = Math.floor(Date.now() / 1000);
          const dayInSecs = 86400;
          const currentDayStart = Math.floor(candleDownloadTime / dayInSecs) * dayInSecs;

          this.logger.debug(`[CANDLE FILTER] ${symbol}:`, {
            totalFetched: candles.length,
            currentDayStart,
            candleTimestamps: candles.map((c: any) => ({ time: c.time || c[0], high: c.high || c[2], low: c.low || c[3] }))
          });

          // Filter candles to exclude today's incomplete candle and take only previous N complete days
          let previousDayCandles = candles.filter((candle: any) => {
            const candleTime = candle.time || candle[0] || 0;
            return candleTime < currentDayStart; // Only previous days, not today
          });

          // Slice to get exactly daysHighLow previous candles (newest to oldest)
          if (previousDayCandles.length > daysHighLow) {
            previousDayCandles = previousDayCandles.slice(0, daysHighLow);
          }

          this.logger.debug(`[CANDLE FILTERED] ${symbol}:`, {
            afterFiltering: previousDayCandles.length,
            timestamps: previousDayCandles.map((c: any) => c.time || c[0])
          });

          // Extract high/low from filtered candles
          for (const candle of previousDayCandles) {
            const high = parseFloat(candle.high || candle[2] || 0);
            const low = parseFloat(candle.low || candle[3] || 0);
            prev3High = Math.max(prev3High, high);
            prev3Low = Math.min(prev3Low, low);
          }

          if (prev3High > 0 && prev3Low < Infinity) {
            candlesFetched = true;
            this.logger.debug(`Fetched candle data for ${symbol}:`, {
              daysHighLow,
              prev3High,
              prev3Low,
              totalCandleCount: candles.length,
              previousDayCandleCount: previousDayCandles.length,
              currentDayStart,
              candleTimestamps: candles.map((c: any) => c.time || c[0])
            });
          }
        }
      } catch (error: any) {
        this.logger.warn(`Failed to fetch candles for ${symbol}, using fallback:`, error?.message);
      }

      // Fallback: Use position's high/low if available
      if (!candlesFetched) {
        const positionHigh = parseFloat(position.high_price || position.entry_price || 0);
        const positionLow = parseFloat(position.low_price || position.entry_price || 0);

        if (positionHigh > 0 && positionLow > 0) {
          prev3High = positionHigh;
          prev3Low = positionLow;
          this.logger.warn(`Using position's high/low as fallback for ${symbol}:`, { prev3High, prev3Low });
        } else {
          // Last resort: Use entry price +/- 2% as estimate
          const entryPrice = parseFloat(position.entry_price || position.average_entry_price || 0);
          prev3High = entryPrice * 1.02;
          prev3Low = entryPrice * 0.98;
          this.logger.warn(`Using entry price estimate for ${symbol}:`, { prev3High, prev3Low, entryPrice });
        }
      }

      if (prev3High === 0 || prev3Low === Infinity || prev3High <= prev3Low) {
        this.logger.error(`[PRICE ERROR] Invalid price data for ${symbol}:`, { prev3High, prev3Low });
        throw new Error(`Invalid price data for ${symbol}`);
      }

      this.logger.info(`[CANDLE DATA] ${symbol}:`, {
        prev3High,
        prev3Low,
        source: candlesFetched ? 'candles' : 'fallback'
      });

      // Step 4: Calculate stop loss and take profit prices with candle data
      const slAndTarget = this.calculateStopLossAndTarget(position, prev3High, prev3Low);

      // Step 5: Place bracket order (stop loss + take profit)
      // Determine position side from position.side field OR from size (negative = short)
      let positionSide = position.side;
      if (!positionSide) {
        // If side is not explicitly set, determine from size
        const size = parseFloat(position.size || 0);
        positionSide = size < 0 ? 'sell' : 'buy';
        this.logger.debug(`[SIDE DETECTION] ${symbol}: side not set, determined from size=${size} → ${positionSide}`);
      }

      // The calculation already returns correct prices for BOTH sides:
      // BUY: stopLossPrice (lower) → stop_loss_order, takeProfitPrice (higher) → take_profit_order
      // SELL: stopLossPrice (higher) → stop_loss_order, takeProfitPrice (lower) → take_profit_order  
      // NO SWAP NEEDED - send calculated values directly!
      const bracketSL = slAndTarget.stopLossPrice;
      const bracketTP = slAndTarget.takeProfitPrice;

      // Validation: Ensure prices don't cross (which causes immediate_execution error)
      const markPrice = parseFloat(position.mark_price || position.entry_price || 0);

      this.logger.info(`[BRACKET ORDER] ${symbol} (${positionSide}):`, {
        calculated: {
          stopLossPrice: slAndTarget.stopLossPrice,
          takeProfitPrice: slAndTarget.takeProfitPrice
        },
        sending: {
          stop_loss_order_stop_price: bracketSL,
          take_profit_order_stop_price: bracketTP
        },
        current: {
          markPrice,
          entryPrice: parseFloat(position.entry_price || position.average_entry_price || 0)
        },
        noSwap: true
      });

      if (positionSide === 'buy') {
        // BUY: stopLossPrice (lower) and takeProfitPrice (higher)
        // SL < TP for BUY
        if (bracketTP <= bracketSL) {
          this.logger.error(`[BRACKET ERROR] BUY: TP (${bracketTP}) must be > SL (${bracketSL})`);
          throw new Error(`Invalid BUY bracket prices: TP (${bracketTP}) must be > SL (${bracketSL})`);
        }
        // For BUY, current price must be BETWEEN SL and TP
        if (markPrice <= bracketSL || markPrice >= bracketTP) {
          this.logger.error(`[BRACKET ERROR] BUY: Current price (${markPrice}) outside SL-TP range [${bracketSL}, ${bracketTP}]`);
          throw new Error(`Current price (${markPrice}) is outside valid range. SL: ${bracketSL}, TP: ${bracketTP}. Order would execute immediately.`);
        }
      } else if (positionSide === 'sell') {
        // SELL: stopLossPrice (higher) and takeProfitPrice (lower)
        // SL > TP for SELL
        if (bracketSL <= bracketTP) {
          this.logger.error(`[BRACKET ERROR] SELL: SL (${bracketSL}) must be > TP (${bracketTP})`);
          throw new Error(`Invalid SELL bracket prices: SL (${bracketSL}) must be > TP (${bracketTP})`);
        }
        // For SELL, current price must be BETWEEN TP (lower) and SL (higher)
        if (markPrice <= bracketTP || markPrice >= bracketSL) {
          this.logger.error(`[BRACKET ERROR] SELL: Current price (${markPrice}) outside TP-SL range [${bracketTP}, ${bracketSL}]`);
          throw new Error(`Current price (${markPrice}) is outside valid range. TP: ${bracketTP}, SL: ${bracketSL}. Order would execute immediately.`);
        }
      }

      const bracketOrderResult = await this.placeBracketOrder(
        productId,
        bracketSL,
        bracketTP,
        position.side
      );

      this.logger.info(`Bracket order placed for ${symbol}:`, bracketOrderResult);

      // Step 6: Place half-quantity limit order at half-target price (Entry ± SL_Diff × 1)
      const halfQuantityResult = await this.placeHalfQuantityTarget(
        position,
        slAndTarget.halfTargetPrice
      );

      this.logger.info(`Half-quantity target placed for ${symbol}:`, halfQuantityResult);

      return {
        success: true,
        symbol,
        productId,
        quantity: position.size,
        bracketOrderResult,
        halfQuantityTargetResult: halfQuantityResult,
        message: 'Target & stop loss successfully placed'
      };
    } catch (error: any) {
      this.logger.error(`Error placing target/SL for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Check if there are existing bracket orders for a product
   * Uses DeltaService.getBracketOrdersForProduct() to fetch bracket orders
   * This method filters for bracket_order === true AND stop_order_type === 'stop_loss_order'
   * 
   * CRITICAL: When bracket orders exist, we MUST SKIP placement to avoid duplication
   */
  private async checkExistingOrders(productId: number, symbol?: string): Promise<any[]> {
    try {
      this.logger.debug(`Checking existing bracket orders for product_id: ${productId}, symbol: ${symbol || 'N/A'}`);

      // Use getBracketOrdersForProduct to check for actual bracket orders only
      // This filters for: bracket_order === true AND stop_order_type === 'stop_loss_order'
      const bracketOrders = await this.deltaService.getBracketOrdersForProduct(productId, symbol);

      this.logger.debug(`Got response from getBracketOrdersForProduct for product ${productId}:`, {
        ordersCount: bracketOrders?.length || 0
      });

      const orderCount = bracketOrders?.length || 0;

      this.logger.info(
        `Product ${productId}: Found ${orderCount} bracket order(s)`
      );

      // CRITICAL DECISION: If ANY bracket orders exist, we must skip placement
      // This prevents duplicate orders and "bracket_order_exists" errors
      if (orderCount > 0) {
        this.logger.warn(
          `⚠️ SKIPPING Product ${productId} - Has ${orderCount} EXISTING bracket order(s) - Will NOT place duplicate orders`
        );
        return bracketOrders;
      } else {
        this.logger.info(
          `✅ OK to place: Product ${productId} has NO bracket orders - Safe to place new orders`
        );
        return [];
      }
    } catch (error: any) {
      this.logger.error(
        `CRITICAL ERROR checking existing bracket orders for product ${productId}: ${error?.message}`,
        error
      );
      // On error, return empty array (assume no orders) - this is safe default
      this.logger.warn(`Proceeding with placement despite error checking orders for ${productId}`);
      return [];
    }
  }

  /**
   * Calculate stop loss and take profit prices based on position and configuration
   * 
   * Logic:
   * - Stop Loss calculated from 3-day low/high with buffer percentage (NOT from entry price)
   * FOR BUY:
   *   SL = Prev3Low × (1 - buffer%)
   *   SL_Diff = Entry - SL
   *   Target = Entry + (SL_Diff × 1)         [half-position]
   *   Bracket Target = Entry + (SL_Diff × 4) [full position]
   *
   * FOR SELL:
   *   SL = Prev3High × (1 + buffer%)
   *   SL_Diff = SL - Entry
   *   Target = Entry - (SL_Diff × 1)         [half-position]
   *   Bracket Target = Entry - (SL_Diff × 4) [full position]
   */
  private calculateStopLossAndTarget(
    position: any,
    prev3High: number,
    prev3Low: number
  ): {
    stopLossPrice: number;
    takeProfitPrice: number;
    halfTargetPrice: number;
  } {
    try {
      const config = this.configService.getConfig() as any;
      const bufferPercentage = config?.bufferPercentage || 0.4;
      const targetMultiplier = config?.targetMultiplier || 4;

      const entryPrice = parseFloat(position.entry_price || position.average_entry_price || 0);
      // Determine side from explicit field or from size (negative = short)
      let side = position.side;
      if (!side) {
        const size = parseFloat(position.size || 0);
        side = size < 0 ? 'sell' : 'buy';
      }
      const symbol = position.symbol || position.product_symbol || `Product ${position.product_id}`;

      this.logger.info(`[CALC INPUT] ${symbol} (${side}):`, {
        entryPrice,
        prev3High,
        prev3Low,
        bufferPercentage,
        targetMultiplier,
        markPrice: position.mark_price,
        size: position.size,
        determinedSide: side
      });

      // Stop Loss calculation: from 3-day low/high with buffer (NOT from entry price)
      let stopLossPrice: number;
      let stopLossDifferenceUsd: number;
      let takeProfitPrice: number;
      let halfTargetPrice: number;

      if (side === 'buy') {
        // Buy: SL = Prev3Low × (1 - buffer%)
        stopLossPrice = prev3Low * (1 - (bufferPercentage / 100));
        stopLossDifferenceUsd = entryPrice - stopLossPrice;
        // Half-position target: Entry + (SL_Diff × 1)
        halfTargetPrice = entryPrice + stopLossDifferenceUsd;
        // Full bracket target: Entry + (SL_Diff × targetMultiplier)
        takeProfitPrice = entryPrice + (stopLossDifferenceUsd * targetMultiplier);

        this.logger.info(`[CALC BUY] ${symbol}:`, {
          formula_sl: `${prev3Low} * (1 - ${bufferPercentage}/100)`,
          stopLossPrice,
          stopLossDifferenceUsd,
          halfTargetPrice,
          takeProfitPrice
        });
      } else {
        // Sell: SL = Prev3High × (1 + buffer%)
        stopLossPrice = prev3High * (1 + (bufferPercentage / 100));
        stopLossDifferenceUsd = stopLossPrice - entryPrice;
        // Half-position target: Entry - (SL_Diff × 1)
        halfTargetPrice = entryPrice - stopLossDifferenceUsd;
        // Full bracket target: Entry - (SL_Diff × targetMultiplier)
        takeProfitPrice = entryPrice - (stopLossDifferenceUsd * targetMultiplier);

        this.logger.info(`[CALC SELL] ${symbol}:`, {
          formula_sl: `${prev3High} * (1 + ${bufferPercentage}/100)`,
          stopLossPrice,
          stopLossDifferenceUsd,
          halfTargetPrice,
          takeProfitPrice
        });
      }

      const finalResult = {
        stopLossPrice: Math.round(stopLossPrice * 10000) / 10000, // Round to 4 decimals
        takeProfitPrice: Math.round(takeProfitPrice * 10000) / 10000,
        halfTargetPrice: Math.round(halfTargetPrice * 10000) / 10000
      };

      this.logger.info(`[CALC RESULT] ${symbol}:`, {
        stopLossPrice: finalResult.stopLossPrice,
        takeProfitPrice: finalResult.takeProfitPrice,
        halfTargetPrice: finalResult.halfTargetPrice,
        validation: {
          slValid: finalResult.stopLossPrice > 0,
          tpValid: finalResult.takeProfitPrice > 0,
          hlValid: finalResult.halfTargetPrice > 0,
          tpGreaterThanSl: side === 'buy' ? finalResult.takeProfitPrice > finalResult.stopLossPrice : finalResult.stopLossPrice > finalResult.takeProfitPrice
        }
      });

      return finalResult;
    } catch (error: any) {
      this.logger.error('Error calculating stop loss and target:', error);
      throw error;
    }
  }

  /**
   * Place bracket order with stop loss and take profit
   * CRITICAL FIX: For SELL positions, the SL and TP prices are semantically swapped:
   * 
   * For BUY positions:
   *   - stopLossPrice (calculated) = lower price (loss) → goes to stop_loss_order
   *   - takeProfitPrice (calculated) = higher price (gain) → goes to take_profit_order
   *   Example: Buy at $100, SL=$95, Target=$120
   *     stop_loss_order.stop_price = $95 ✓
   *     take_profit_order.stop_price = $120 ✓
   *
   * For SELL positions:
   *   - stopLossPrice (calculated) = higher price (loss above entry) → but must go to TAKE_PROFIT position (stop loss semantically)
   *   - takeProfitPrice (calculated) = lower price (gain below entry) → but must go to STOP_LOSS position (take profit semantically)
   *   Example: Sell at $100, SL=$105, Target=$95
   *     stop_loss_order.stop_price = $105 (the calculated SL price, which is the loss condition)
   *     take_profit_order.stop_price = $95 (the calculated TP price, which is the profit condition)
   *
   * API: POST /v2/orders/bracket
   */
  private async placeBracketOrder(
    productId: number,
    stopLossPrice: number,
    takeProfitPrice: number,
    side?: string
  ): Promise<any> {
    try {
      // For SELL position: stopLossPrice is calculated as HIGHER, takeProfitPrice as LOWER
      // But we still send them correctly: higher price to stop_loss_order, lower price to take_profit_order
      // The API knows how to interpret them based on the actual position

      this.logger.debug(`Placing bracket order for product ${productId}`, {
        side,
        stopLossPrice,
        takeProfitPrice
      });

      return await this.deltaService.placeBracketOrderForPosition({
        productId,
        stopLossPrice,
        takeProfitPrice,
        triggerMethod: 'mark_price'
      });
    } catch (error: any) {
      this.logger.error(`Error placing bracket order for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Place a limit order for half the position quantity at the target price
   * This provides an additional take-profit target at half quantity
   */
  private async placeHalfQuantityTarget(
    position: any,
    targetPrice: number
  ): Promise<any> {
    try {
      const productId = position.product_id;
      const symbol = position.symbol || position.product_symbol;
      const quantity = parseFloat(position.size || 0);
      const absQuantity = Math.abs(quantity); // Use absolute value for half calculation
      const halfQuantity = Math.floor(absQuantity / 2);

      // Determine position side (same logic as in placeTargetAndStopLossForPosition)
      let positionSide = position.side;
      if (!positionSide) {
        // If side is not explicitly set, determine from size
        positionSide = quantity < 0 ? 'sell' : 'buy';
        this.logger.debug(`[HALF-QTY SIDE DETECTION] ${symbol}: side not set, determined from size=${quantity} → ${positionSide}`);
      }

      this.logger.debug(`[HALF-QTY START] ${symbol}:`, {
        productId,
        positionQuantity: quantity,
        positionSide,
        absQuantity,
        halfQuantity,
        targetPrice,
        orderSide: positionSide === 'buy' ? 'sell' : 'buy'
      });

      // Don't place if quantity is too small
      if (halfQuantity < 1) {
        this.logger.warn(`[HALF-QTY SKIP] Half quantity (${halfQuantity}) is less than 1, skipping half-quantity target for ${symbol}`);
        return null;
      }

      // Determine the order side (opposite to position side)
      const orderSide = positionSide === 'buy' ? 'sell' : 'buy';
      const roundedPrice = Math.round(targetPrice * 100) / 100; // 2 decimals for price

      this.logger.info(`[HALF-QTY PLACING] ${symbol}: ${orderSide} ${halfQuantity} @ ${roundedPrice}`, {
        productId,
        quantity: halfQuantity,
        targetPrice: roundedPrice,
        orderType: 'limit',
        side: orderSide
      });

      // Place limit order for half quantity at target price
      const payload = {
        product_id: productId,
        order_type: 'limit_order',
        side: orderSide,
        size: String(halfQuantity),
        limit_price: String(roundedPrice)
      };

      this.logger.debug('[HALF-QTY PAYLOAD]:', payload);

      const result = await this.deltaService['authenticatedRequest'](
        'POST',
        '/v2/orders',
        payload,
        this.deltaService['baseUrl']
      );

      this.logger.info(`[HALF-QTY SUCCESS] Half-quantity target order placed for ${symbol}:`, {
        orderId: result?.id || result?.order_id,
        symbol,
        side: orderSide,
        quantity: halfQuantity,
        price: roundedPrice,
        fullResult: result
      });
      return result;
    } catch (error: any) {
      // Log detailed error information before silently returning
      this.logger.error('[HALF-QTY ERROR] Error placing half-quantity target order:', {
        productId: position.product_id,
        symbol: position.symbol || position.product_symbol,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorResponse: error?.response || error,
        targetPrice
      });
      // Don't throw - this is a secondary order, continue even if it fails
      // But still return the error so caller can see it happened
      return { 
        success: false, 
        error: error.message, 
        errorDetails: error.response || error 
      };
    }
  }

  /**
   * Check if any orders exist for a specific product (helper method)
   */
  async anyPendingOrdersExist(productId: number): Promise<boolean> {
    try {
      const orders = await this.checkExistingOrders(productId);
      return orders && orders.length > 0;
    } catch (error) {
      this.logger.warn(`Error checking pending orders for product ${productId}`, error);
      return false;
    }
  }
}
