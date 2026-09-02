import { Injectable } from '@angular/core';
import { MobileDebugService } from './mobile-debug.service';
import { SettingsService } from './settings.service';
import { ConfigService } from './config.service';
import { LoggingService } from './logging.service';
import { HttpClientService } from './http-client.service';
import { API_CONFIG } from '../config/api.config';

type OrderSide = 'buy' | 'sell';

export type PlaceBracketOrderRequest = {
  symbol: string;
  side: OrderSide;
  entryPrice: number;
  prev3High: number;
  prev3Low: number;
  todayHigh?: number;  // Today's high price
  todayLow?: number;   // Today's low price
  riskAmountInr: number;
  quantity?: number;
};

export type PlaceBracketOrderResult = {
  calculations: {
    stopLossPrice: number;
    stopLossDifference: number;
    quantity: number;
    targetQuantity: number;
    targetPrice: number;
    bracketTargetPrice: number;      // NEW: Bracket target price (SL diff * 4)
    bracketTrailingAmount: number;   // NEW: Bracket trailing amount (SL diff * 1)
    effectiveRiskInr: number;
    entryPrice: number;              // Entry price for display
  };
  orders: {
    entry: any;
    target: any;
  };
};

/**
 * Official Delta Exchange EditBracketOrderRequest type
 * Based on Delta Exchange API documentation
 */
export type EditBracketOrderRequest = {
  /** Order ID for which bracket params are being updated */
  id: number;
  /** Only one of either product_id or product_symbol must be sent */
  product_id?: number;
  /** Only one of either product_id or product_symbol must be sent */
  product_symbol?: string;
  /** Stop loss limit price for bracket order */
  bracket_stop_loss_limit_price?: string;
  /** Stop loss trigger price for bracket order */
  bracket_stop_loss_price?: string;
  /** Take profit limit price for bracket order */
  bracket_take_profit_limit_price?: string;
  /** Take profit trigger price for bracket order */
  bracket_take_profit_price?: string;
  /** Trail amount of bracket order */
  bracket_trail_amount?: string;
  /** Stop order trigger method: mark_price | last_traded_price | spot_price */
  bracket_stop_trigger_method?: 'mark_price' | 'last_traded_price' | 'spot_price';
};

@Injectable({ providedIn: 'root' })
export class DeltaService {
  baseUrl = API_CONFIG.base_url;
  private readonly positionsApiHosts = [
    API_CONFIG.base_url,
    'https://api.delta.exchange'
  ];

  private apiKey = '';
  private apiSecret = '';
  private USD_TO_INR = 85;
  private configLoaded = false;

  constructor(
    private debug: MobileDebugService,
    private settings: SettingsService,
    private configService: ConfigService,
    private logger: LoggingService,
    private httpClient: HttpClientService
  ) {
    this.logger.info('DeltaService: Initializing');
    this.loadConfig();
  }

  private async loadConfig(): Promise<void> {
    try {
      this.logger.debug('DeltaService: Checking for custom settings in localStorage');

      // First, try to load from localStorage (user settings)
      const customSettings = this.settings.loadSettings();

      if (customSettings) {
        this.logger.debug('DeltaService: Using custom settings from localStorage');
        this.apiKey = customSettings.apiKey;
        this.apiSecret = customSettings.apiSecret;
        this.baseUrl = customSettings.baseUrl;
        this.USD_TO_INR = customSettings.usdToInr;
        this.httpClient.setCredentials(this.apiKey, this.apiSecret);
        this.configLoaded = true;

        this.logger.debug('DeltaService: Custom config applied', {
          baseUrl: this.baseUrl,
          hasApiKey: !!this.apiKey,
          hasApiSecret: !!this.apiSecret,
          usdToInr: this.USD_TO_INR
        });
        return;
      }

      // Fallback to config.json
      this.logger.debug('DeltaService: No custom settings, loading from /assets/config.json');
      const response = await fetch('/assets/config.json');

      if (!response.ok) {
        throw new Error(`Config fetch failed: ${response.status} ${response.statusText}`);
      }

      const config = await response.json();
      this.logger.debug('DeltaService: Config loaded from file');

      this.apiKey = config.delta.apiKey;
      this.apiSecret = config.delta.apiSecret;
      this.baseUrl = config.delta.baseUrl;
      this.USD_TO_INR = config.delta.usdToInr;
      this.httpClient.setCredentials(this.apiKey, this.apiSecret);
      this.configLoaded = true;

      this.logger.debug('DeltaService: Default config applied', {
        baseUrl: this.baseUrl,
        hasApiKey: !!this.apiKey,
        hasApiSecret: !!this.apiSecret,
        usdToInr: this.USD_TO_INR
      });
    } catch (error) {
      this.logger.error('DeltaService: Failed to load config', error);
      this.configLoaded = true;
    }
  }

  /**
   * Reload configuration (useful after settings change)
   */
  async reloadConfig(): Promise<void> {
    this.logger.debug('DeltaService: Reloading configuration');
    this.configLoaded = false;
    await this.loadConfig();
  }

  private async ensureConfigLoaded(): Promise<void> {
    if (!this.configLoaded) {
      await this.loadConfig();
    }
  }

  async getAllProducts(): Promise<any[]> {
    await this.ensureConfigLoaded();
    try {
      this.debug.log('DeltaService: Fetching all products');
      const url = new URL(`${this.baseUrl}/v2/products`);
      url.searchParams.set('contract_types', 'perpetual_futures');
      url.searchParams.set('state', 'live');

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Products fetch failed: ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      const products = json?.result ?? json?.data ?? json;
      this.debug.log(`DeltaService: Fetched ${products.length} products`);
      return products;
    } catch (error) {
      this.debug.error('DeltaService: Failed to fetch products', error);
      throw error;
    }
  }

  async getTicker(symbol: string): Promise<any> {
    await this.ensureConfigLoaded();
    try {
      const url = new URL(`${this.baseUrl}/v2/tickers/${symbol}`);
      const res = await fetch(url.toString());
      if (!res.ok) return null;
      const json = await res.json();
      return json?.result ?? json;
    } catch (error) {
      this.debug.error(`DeltaService: Failed to fetch ticker for ${symbol}`, error);
      return null;
    }
  }

  async getAllTickers(): Promise<any[]> {
    await this.ensureConfigLoaded();
    try {
      this.debug.log('DeltaService: Fetching all tickers');
      const url = new URL(`${this.baseUrl}/v2/tickers`);
      url.searchParams.set('contract_types', 'perpetual_futures');

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Tickers fetch failed: ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      const tickers = json?.result ?? json?.data ?? json;
      this.debug.log(`DeltaService: Fetched ${tickers.length} tickers`);
      return Array.isArray(tickers) ? tickers : [];
    } catch (error) {
      this.debug.error('DeltaService: Failed to fetch tickers', error);
      throw error;
    }
  }

  async getCandles(symbol: string, resolution: string | number, fromSec: number, toSec: number): Promise<any[]> {
    const url = new URL(`${this.baseUrl}/v2/history/candles`);
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('resolution', String(resolution));
    url.searchParams.set('start', String(Math.floor(fromSec)));
    url.searchParams.set('end', String(Math.floor(toSec)));

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        console.warn(`❌ Candles API error for ${symbol}: HTTP ${res.status} ${res.statusText}`);
        return [];
      }
      const json = await res.json();
      const candles = json?.result ?? json?.data ?? json?.candles ?? json;
      // Ensure we always return an array
      return Array.isArray(candles) ? candles : [];
    } catch (err) {
      console.error(`❌ Candles fetch error for ${symbol}:`, err);
      return [];
    }
  }

  /**
   * Delegate to HttpClientService for authenticated requests
   * @deprecated Use HttpClientService directly
   */
  private async authenticatedRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any,
    host: string = this.baseUrl
  ): Promise<any> {
    await this.ensureConfigLoaded();
    return this.httpClient.request(method, path, body, host);
  }

  async getPositions(): Promise<any[]> {
    await this.ensureConfigLoaded();
    this.debug.log('DeltaService: Fetching positions');
    const path = '/v2/positions/margined';

    try {
      for (const host of this.positionsApiHosts) {
        try {
          this.debug.log(`DeltaService: Trying host ${host}`);
          const positionsData = await this.authenticatedRequest('GET', path, undefined, host);
          this.debug.log('DeltaService: Raw positions response', positionsData);

          const positions = positionsData?.result ?? positionsData?.positions ?? positionsData;
          this.debug.log('DeltaService: Extracted positions array', { 
            isArray: Array.isArray(positions), 
            length: positions?.length,
            positions 
          });

          // Return even if empty array
          if (Array.isArray(positions)) {
            if (positions.length === 0) {
              this.debug.log('DeltaService: No positions found');
              return [];
            }

            // Enrich positions with mark price and PnL
            this.debug.log(`DeltaService: Enriching ${positions.length} positions`);
            const enrichedPositions = await Promise.all(positions.map(async (p) => {
              const sizeValue = parseFloat(p.size || 0);
              const symbol = p.product_symbol || p.symbol;

              this.debug.log(`DeltaService: Processing position ${symbol}`, { size: sizeValue, raw: p });

              const ticker = symbol ? await this.getTicker(symbol) : null;
              const markPrice = ticker?.mark_price ?? ticker?.close ?? ticker?.last_price ?? 0;
              const entryPrice = parseFloat(p.entry_price || p.average_entry_price || 0);

              let pnl = 0;
              let pnlPercentage = 0;
              if (markPrice > 0 && entryPrice > 0 && sizeValue !== 0) {
                pnl = (markPrice - entryPrice) * sizeValue;
                pnlPercentage = ((markPrice - entryPrice) / entryPrice) * 100;
              }

              return {
                ...p,
                symbol: symbol || `Product ${p.product_id}`,
                size: sizeValue,
                entry_price: entryPrice,
                mark_price: parseFloat(markPrice),
                pnl,
                pnl_percentage: pnlPercentage,
                leverage: p.leverage || 1,
                margin: parseFloat(p.margin || p.allocated_margin || 0),
                liquidation_price: parseFloat(p.liquidation_price || 0)
              };
            }));

            this.debug.log(`DeltaService: Returning ${enrichedPositions.length} enriched positions`, enrichedPositions);
            return enrichedPositions;
          }
        } catch (err: any) {
          this.debug.error(`DeltaService: Error from host ${host}`, err);
          const message = String(err?.message || '');
          if (message.includes('bad_schema')) {
            return await this.getAllPositionsWithProducts();
          }
        }
      }

      this.debug.log('DeltaService: All hosts failed or returned non-array, trying fallback');
      return await this.getAllPositionsWithProducts();
    } catch (error) {
      this.debug.error('DeltaService: getPositions error', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  private async getAllPositionsWithProducts(): Promise<any[]> {
    try {
      const products = await this.getAllProducts();
      const allPositions: any[] = [];

      for (const product of products) {
        try {
          const productId = product.id || product.product_id;
          if (!productId) continue;

          const pathWithQuery = `/v2/positions?product_id=${productId}`;
          const positionsData = await this.authenticatedRequest('GET', pathWithQuery, undefined, this.positionsApiHosts[0]);
          const positions = positionsData?.positions ?? positionsData;
          const posArray = Array.isArray(positions) ? positions : [positions];

          for (const p of posArray) {
            if (!p || typeof p !== 'object') continue;

            const size = p.size ?? p.position_size ?? p.user_position?.size ?? 0;
            const sizeNum = parseFloat(size);

            if (Math.abs(sizeNum) > 0) {
              const ticker = await this.getTicker(product.symbol);
              const markPrice = ticker?.mark_price ?? ticker?.close ?? ticker?.last_price ?? 0;
              const entryPrice = parseFloat(p.entry_price || p.average_entry_price || p.buy_price || 0);

              let pnl = 0;
              let pnlPercentage = 0;
              if (markPrice > 0 && entryPrice > 0) {
                pnl = (markPrice - entryPrice) * sizeNum;
                pnlPercentage = ((markPrice - entryPrice) / entryPrice) * 100;
              }

              allPositions.push({
                ...p,
                symbol: product.symbol || p.product_symbol || p.symbol || `Product ${productId}`,
                size: sizeNum,
                entry_price: entryPrice,
                mark_price: parseFloat(markPrice),
                pnl,
                pnl_percentage: pnlPercentage,
                liquidation_price: parseFloat(p.liquidation_price || p.bankruptcy_price || 0),
                leverage: parseFloat(p.leverage || p.user_leverage || ticker?.leverage || 0),
                margin: parseFloat(p.margin || p.position_margin || (entryPrice * Math.abs(sizeNum)) / (p.leverage || 1) || 0),
                product_id: productId
              });
            }
          }
        } catch {
          // continue
        }
      }

      return allPositions;
    } catch {
      return [];
    }
  }

  private round(value: number, digits: number = 4): number {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }

  async getProductBySymbol(symbol: string): Promise<any | null> {
    const all = await this.getAllProducts();
    const key = symbol.trim().toUpperCase();
    const match = (all || []).find((p: any) => String(p?.symbol || '').toUpperCase() === key);
    return match ?? null;
  }

  /**
   * Get product ID from symbol using ticker data
   */
  async getProductIdBySymbol(symbol: string): Promise<number | null> {
    try {
      const ticker = await this.getTicker(symbol);
      if (ticker && ticker.product_id) {
        return ticker.product_id;
      }
      return null;
    } catch (err) {
      this.debug.log(`⚠️ Error getting product ID for ${symbol}: ${err}`);
      return null;
    }
  }

  async createOrder(payload: any): Promise<any> {
    return this.authenticatedRequest('POST', '/v2/orders', payload, this.baseUrl);
  }

  async createBracketOrder(payload: any): Promise<any> {
    return this.authenticatedRequest('POST', '/v2/orders/bracket', payload, this.baseUrl);
  }

  /**
   * Get pending orders for a specific product using query parameters
   * API: GET /v2/orders?product_ids={productId}&state=pending
   * This is more efficient than getOrders() as it filters server-side
   * 
   * @param productId - The product ID to check for pending orders
   * @returns Array of pending orders, or empty array if none exist
   */
  async getPendingOrdersForProduct(productId: number): Promise<any[]> {
    try {
      const path = `/v2/orders?product_ids=${productId}&state=pending`;
      this.debug.log(`Fetching pending orders for product ${productId}: ${path}`);

      const response = await this.authenticatedRequest('GET', path, undefined, this.baseUrl);

      this.debug.log(`getPendingOrdersForProduct response:`, { response });

      // Handle different response formats
      const orders = Array.isArray(response) ? response : (response?.result || response?.data || []);
      const totalCount = response?.meta?.total_count;

      this.debug.log(
        `getPendingOrdersForProduct returned ${orders?.length || 0} orders, total_count=${totalCount} for product ${productId}`
      );

      return orders || [];
    } catch (error: any) {
      this.debug.error(`getPendingOrdersForProduct error for product ${productId}:`, error);
      return [];
    }
  }

  async getOrders(productId?: number): Promise<any[]> {
    try {
      // Fetch all orders without any query parameters
      // Filter by states and product_id in memory
      let path = '/v2/orders';

      this.debug.log(`Fetching all orders with path: ${path}`);
      const result = await this.authenticatedRequest('GET', path, undefined, this.baseUrl);

      // Handle different response formats
      let orders = Array.isArray(result) ? result : (result?.orders || result?.result || []);
      this.debug.log(`getOrders returned ${orders.length} total orders`);

      // Filter by state in memory (pending or open)
      orders = orders.filter((o: any) => o.state === 'pending' || o.state === 'open');
      this.debug.log(`Filtered to ${orders.length} orders with state=pending,open`);

      // Filter by product_id in memory if provided
      if (productId) {
        orders = orders.filter((o: any) => o.product_id === productId);
        this.debug.log(`Filtered to ${orders.length} orders for product_id ${productId}`);
      }

      return orders;
    } catch (error: any) {
      this.debug.error('getOrders error:', error);
      return [];
    }
  }

  async getBracketOrder(orderId: number): Promise<any> {
    try {
      const result = await this.authenticatedRequest('GET', `/v2/orders/bracket/${orderId}`, undefined, this.baseUrl);
      this.debug.log(`getBracketOrder for ${orderId}:`, result);
      return result;
    } catch (error: any) {
      this.debug.error('getBracketOrder error:', error);
      return null;
    }
  }

  /**
   * Cancel all open stop orders
   * Uses DELETE /v2/orders/all with payload
   */
  async cancelPendingOrders(): Promise<number> {
    try {
      const payload = {
        contract_types: 'perpetual_futures',
        cancel_limit_orders: false,
        cancel_stop_orders: true,
        cancel_reduce_only_orders: false
      };

      this.debug.log('Cancelling all open stop orders with payload:', payload);
      const result = await this.authenticatedRequest('DELETE', '/v2/orders/all', payload, this.baseUrl);

      this.debug.log(`Orders cancelled successfully:`, result);
      return 1; // Return 1 to indicate the cancellation request was successful
    } catch (error: any) {
      this.debug.error('cancelPendingOrders error:', error);
      return 0;
    }
  }

  /**
   * Check if pending orders exist for a given product
   */
  async hasPendingOrdersForProduct(productId: number): Promise<boolean> {
    try {
      const path = `/v2/orders?product_ids=${productId}&state=pending`;
      this.debug.log(`Checking pending orders for product ${productId}`);
      const result = await this.authenticatedRequest('GET', path, undefined, this.baseUrl);

      // Handle different response formats
      const response = result?.result || result;
      const totalCount = result?.meta?.total_count || (Array.isArray(response) ? response.length : 0);

      this.debug.log(`Product ${productId} has ${totalCount} pending orders`);
      return totalCount > 0;
    } catch (error: any) {
      this.debug.error('hasPendingOrdersForProduct error:', error);
      return false; // Assume no pending orders on error
    }
  }

  /**
   * Place bracket order for a position with stop loss and take profit
   * Uses POST /v2/orders/bracket
   */
  async placeBracketOrderForPosition(input: {
    productId: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    triggerMethod?: string;
  }): Promise<any> {
    try {
      const payload = {
        product_id: input.productId,
        stop_loss_order: {
          order_type: 'market_order',
          stop_price: String(this.round(input.stopLossPrice, 4))
        },
        take_profit_order: {
          order_type: 'market_order',
          stop_price: String(this.round(input.takeProfitPrice, 4))
        },
        bracket_stop_trigger_method: input.triggerMethod || 'mark_price'
      };

      this.debug.log('Placing bracket order with payload:', payload);
      const result = await this.authenticatedRequest('POST', '/v2/orders/bracket', payload, this.baseUrl);

      this.debug.log(`Bracket order placed successfully:`, result);
      return result;
    } catch (error: any) {
      this.debug.error('placeBracketOrderForPosition error:', error);
      throw error;
    }
  }

  /**
   * Calculate stop loss and take profit prices for an open position
   * Uses entry price and a risk percentage to calculate SL and TP
   */
  /**
   * Calculate stop loss and take profit prices for an open position
   * Uses 3-day high/low as reference with 0.4% adjustment
   * Stop Loss Difference = Entry Price - (Prev3Low * 0.996) for buy
   * Stop Loss Difference = (Prev3High * 1.004) - Entry Price for sell
   * Target = Entry + (StopLossDifference * 4) for buy
   * Target = Entry - (StopLossDifference * 4) for sell
   */
  calculatePositionStopLossAndTarget(input: {
    entryPrice: number;
    prev3High: number;
    prev3Low: number;
    side: 'buy' | 'sell';
  }): { stopLossPrice: number; takeProfitPrice: number; stopLossDifference: number } {
    const entryPrice = input.entryPrice;
    const config = this.configService.getConfig();
    const bufferMultiplier = 1 + (config.bufferPercentage / 100);
    const targetMultiplier = config.targetMultiplier;

    if (input.side === 'buy') {
      // Buy: SL based on Prev3Low * (1 - buffer%)
      const stopLossPrice = this.round(input.prev3Low / bufferMultiplier, 4);
      const stopLossDifference = this.round(entryPrice - stopLossPrice, 4);
      const takeProfitPrice = this.round(entryPrice + (stopLossDifference * targetMultiplier), 4);

      return { stopLossPrice, takeProfitPrice, stopLossDifference };
    } else {
      // Sell: SL based on Prev3High * (1 + buffer%)
      const stopLossPrice = this.round(input.prev3High * bufferMultiplier, 4);
      const stopLossDifference = this.round(stopLossPrice - entryPrice, 4);
      const takeProfitPrice = this.round(entryPrice - (stopLossDifference * targetMultiplier), 4);

      return { stopLossPrice, takeProfitPrice, stopLossDifference };
    }
  }

  /**
   * Updates a stop-loss order for a filled position
   * Uses PUT /v2/order with the exact payload format from Delta Exchange web UI
   */
  async updateStopLossOrder(stopLossLegOrder: any, newStopLossPrice: number, productId: number, positionSize: number, symbol?: string): Promise<any> {
    this.debug.log('📤 Updating stop loss order with web UI format:', {
      stopLossOrderId: stopLossLegOrder.id,
      oldStopPrice: stopLossLegOrder.stop_price,
      newStopLossPrice,
      productId,
      symbol
    });

    try {
      // Use the EXACT payload format discovered from Delta Exchange web UI debugging
      const payload = {
        id: stopLossLegOrder.id,
        product_id: productId,
        order_source: "positions_TP_SL_edit_order",  // Critical field from web UI
        order_type: "market_order",
        stop_price: String(newStopLossPrice)
      };

      this.debug.log('Request payload (from web UI format):', payload);

      // Use singular /v2/order endpoint
      const result = await this.authenticatedRequest('PUT', '/v2/order', payload, this.baseUrl);
      this.debug.log('✅ Stop loss order updated successfully:', result);
      return result;

    } catch (error: any) {
      this.debug.error('❌ Failed to update stop loss order:', error?.message);
      this.debug.error('Error details:', error);
      throw new Error(`Failed to update stop loss: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Updates bracket order parameters using official Delta Exchange API format
   * Uses PUT /v2/orders/bracket endpoint
   * Official docs: https://docs.delta.exchange/?shell#edit-bracket-order
   */
  async updateBracketStopLoss(orderId: number, newStopLossPrice: number, productId: number, productSymbol: string): Promise<any> {
    // Official Delta Exchange API payload format
    const payload: EditBracketOrderRequest = {
      id: orderId,                                                     // Order ID (parent or leg)
      product_id: productId,                                           // Product ID
      product_symbol: productSymbol,                                   // Product symbol (e.g., "BTCUSD")
      bracket_stop_loss_price: String(newStopLossPrice),              // New stop loss trigger price
      bracket_stop_trigger_method: 'mark_price'                        // Trigger method
      // Note: bracket_stop_loss_limit_price is optional - omit it per user's requirement
    };

    this.debug.log('📤 Updating bracket via PUT /v2/orders/bracket (official format):', {
      orderId,
      newStopLossPrice,
      productId,
      productSymbol,
      payload
    });

    try {
      const result = await this.authenticatedRequest('PUT', '/v2/orders/bracket', payload, this.baseUrl);
      this.debug.log('✅ Bracket stop loss updated successfully:', result);
      return result;
    } catch (error: any) {
      this.debug.error('❌ Failed to update bracket stop loss:', error?.message);
      throw new Error(`Failed to update bracket: ${error?.message || 'Unknown error'}`);
    }
  }

  async updateTrailingStopLoss(position: any): Promise<{ success: boolean; message: string; symbol: string }> {
    try {
      const symbol = position.symbol || position.product_symbol;
      if (!symbol) {
        return { success: false, message: 'No symbol found', symbol: 'Unknown' };
      }

      // Step 1: Get product_id from ticker endpoint
      this.debug.log(`🔍 Step 1: Getting product_id for ${symbol} from ticker endpoint`);
      const ticker = await this.getTicker(symbol);
      if (!ticker || !ticker.product_id) {
        return { success: false, message: 'Could not get product_id from ticker', symbol };
      }

      const productId = ticker.product_id;
      this.debug.log(`✅ Got product_id ${productId} for ${symbol}`);

      // Step 2: Query stop_market orders for this product_id
      // GET /v2/orders?product_ids={{product_id}}&state=pending&order_types=stop_market
      this.debug.log(`🔍 Step 2: Fetching stop_market orders for product_id ${productId}`);
      const path = `/v2/orders?product_ids=${productId}&state=pending&order_types=stop_market`;
      const result = await this.authenticatedRequest('GET', path, undefined, this.baseUrl);

      const orders = Array.isArray(result) ? result : (result?.orders || result?.result || []);
      this.debug.log(`Found ${orders.length} stop_market orders for ${symbol}`);

      if (orders.length === 0) {
        return { 
          success: false, 
          message: `No active stop loss orders found for ${symbol}`, 
          symbol 
        };
      }

      // Step 3: Match the stop loss order by side
      const positionSize = parseFloat(position.size || 0);
      const isBuyPosition = positionSize > 0;
      const stopLossSide = isBuyPosition ? 'sell' : 'buy';  // SL is opposite side

      this.debug.log(`Position: size=${positionSize}, isBuy=${isBuyPosition}, looking for SL side=${stopLossSide}`);

      // Find stop loss order matching the side
      const stopLossOrder = orders.find((o: any) => o.side === stopLossSide);

      if (!stopLossOrder) {
        return { 
          success: false, 
          message: `No stop loss order found with side=${stopLossSide}`, 
          symbol 
        };
      }

      this.debug.log(`✅ Found stop loss order:`, {
        id: stopLossOrder.id,
        product_id: stopLossOrder.product_id,
        product_symbol: stopLossOrder.product_symbol,
        size: stopLossOrder.size,
        stop_price: stopLossOrder.stop_price
      });

      // Step 4: Calculate new stop loss based on N-day high/low using config
      const config = this.configService.getConfig();
      const now = Date.now();
      const toSec = Math.floor(now / 1000);
      const fromDailySec = toSec - 60 * 60 * 24 * (config.daysHighLow + 1);
      const daily = await this.getCandles(symbol, '1d', fromDailySec, toSec);

      const dailyArr = (Array.isArray(daily) ? daily : (daily as any)?.candles ?? []) as any[];
      if (!dailyArr || dailyArr.length < 2) {
        return { success: false, message: 'Insufficient candle data', symbol };
      }

      dailyArr.sort((a: any, b: any) => {
        const aTime = Array.isArray(a) ? a[0] : (a.time ?? a.t ?? 0);
        const bTime = Array.isArray(b) ? b[0] : (b.time ?? b.t ?? 0);
        return aTime - bTime;
      });

      const prevNDaily = dailyArr.slice(-(config.daysHighLow + 1), -1);
      if (prevNDaily.length < config.daysHighLow) {
        return { success: false, message: `Insufficient ${config.daysHighLow}-day data`, symbol };
      }

      const prev3High = Math.max(...prevNDaily.map((c: any) => parseFloat(Array.isArray(c) ? c[2] : (c.high ?? c.h ?? 0))));
      const prev3Low = Math.min(...prevNDaily.map((c: any) => parseFloat(Array.isArray(c) ? c[3] : (c.low ?? c.l ?? 0))));

      if (prev3High <= 0 || prev3Low <= 0 || prev3Low >= prev3High) {
        return { success: false, message: `Invalid ${config.daysHighLow}-day high/low data`, symbol };
      }

      this.debug.log(`${config.daysHighLow}-day data: High=${prev3High}, Low=${prev3Low}`);

      // Calculate new stop loss using config buffer percentage
      const bufferMultiplier = 1 + (config.bufferPercentage / 100);
      let newStopLoss: number;
      if (isBuyPosition) {
        newStopLoss = this.round(Math.max(prev3Low / bufferMultiplier, parseFloat(stopLossOrder.stop_price)), 2);
      } else {
        newStopLoss = this.round(Math.min(prev3High * bufferMultiplier, parseFloat(stopLossOrder.stop_price)), 2);
      }

      const currentStopLoss = parseFloat(stopLossOrder.stop_price);
      this.debug.log(`Current SL: ${currentStopLoss}, New SL: ${newStopLoss}`);

      if (newStopLoss === currentStopLoss) {
        return { success: true, message: `No update needed (SL: ${currentStopLoss})`, symbol };
      }

      // Step 5: Update the stop loss order using PUT /v2/orders
      const updatePayload = {
        id: stopLossOrder.id,
        product_id: stopLossOrder.product_id,
        product_symbol: stopLossOrder.product_symbol || symbol,
        size: stopLossOrder.size,
        stop_price: String(newStopLoss)
      };

      this.debug.log(`📤 Updating stop loss order:`, updatePayload);

      await this.authenticatedRequest('PUT', '/v2/orders', updatePayload, this.baseUrl);

      this.debug.log(`✅ Stop loss updated successfully from ${currentStopLoss} to ${newStopLoss}`);

      return { 
        success: true, 
        message: `Updated SL from ${currentStopLoss} to ${newStopLoss}`, 
        symbol 
      };

    } catch (error: any) {
      const symbol = position.symbol || position.product_symbol || 'Unknown';
      return { 
        success: false, 
        message: error?.message || 'Unknown error', 
        symbol 
      };
    }
  }

  async placeBracketOrder(input: PlaceBracketOrderRequest): Promise<PlaceBracketOrderResult> {
    const product = await this.getProductBySymbol(input.symbol);
    if (!product) {
      throw new Error(`Product not found for symbol ${input.symbol}`);
    }

    const productId = product.id || product.product_id;
    const side: OrderSide = input.side;
    const exitSide: OrderSide = side === 'buy' ? 'sell' : 'buy';

    // Check if product is quoted in USD (requires INR conversion for risk calculation)
    const quotingAsset = product.quoting_asset?.symbol || product.settling_asset?.symbol || '';
    const isUsdQuoted = quotingAsset.toUpperCase() === 'USDT' || quotingAsset.toUpperCase() === 'USD';

    // Convert prices to INR if needed for risk calculation
    const priceMultiplier = isUsdQuoted ? this.USD_TO_INR : 1;
    const entryPriceInr = input.entryPrice * priceMultiplier;
    const prev3HighInr = input.prev3High * priceMultiplier;
    const prev3LowInr = input.prev3Low * priceMultiplier;

    // Get buffer percentage from config for consistent SL calculation
    const config = this.configService.getConfig();
    const bufferPercentage = config?.bufferPercentage || 0.4;
    const targetMultiplier = config?.targetMultiplier || 4;  // Get from config
    const bufferMultiplier = 1 + (bufferPercentage / 100);

    // Stop loss: Based on 3-day low/high with buffer (NOT from entry price)
    // Buy: SL = Prev3Low * (1 - buffer%)  [3-day low with buffer reduction]
    // Sell: SL = Prev3High * (1 + buffer%) [3-day high with buffer increase]
    const stopLossPrice = side === 'buy'
      ? this.round(input.prev3Low * (1 - (bufferPercentage / 100)), 4)
      : this.round(input.prev3High * (1 + (bufferPercentage / 100)), 4);

    const stopLossPriceInr = stopLossPrice * priceMultiplier;

    const stopLossDifference = this.round(Math.abs(entryPriceInr - stopLossPriceInr), 4);
    const stopLossDifferenceUsd = this.round(Math.abs(input.entryPrice - stopLossPrice), 4);

    if (stopLossDifference <= 0) {
      throw new Error('Invalid stop-loss difference. Cannot calculate quantity.');
    }

    const minRisk = 2500;
    const maxRisk = 3000;

    // Use contract_value as the lot size (minimum tradeable quantity)
    const lotSize = product.contract_value || 0.001;

    const roundToLotSize = (qty: number): number => {
      return Math.round(qty / lotSize) * lotSize;
    };

    // Calculate quantities based on risk in INR
    const rawMinQty = minRisk / stopLossDifference;
    const rawMaxQty = maxRisk / stopLossDifference;

    const minQtyForRisk = Math.max(lotSize, roundToLotSize(rawMinQty));
    const maxQtyForRisk = Math.max(lotSize, roundToLotSize(rawMaxQty));

    if (minQtyForRisk > maxQtyForRisk) {
      throw new Error('Cannot find a valid quantity in the ₹2500–₹3000 risk range for this setup.');
    }

    let quantity: number;

    if (input.quantity && input.quantity > 0) {
      quantity = roundToLotSize(input.quantity);
    } else {
      // Allow any risk amount - don't clamp to min/max
      const preferredQty = input.riskAmountInr / stopLossDifference;
      quantity = roundToLotSize(preferredQty);
    }

    if (quantity <= 0) {
      throw new Error('Calculated quantity is invalid.');
    }

    const effectiveRiskInr = this.round(quantity * stopLossDifference, 2);

    // Remove strict validation - allow any risk amount
    // (UI will warn user if outside recommended range)

    // Half-position target price (× 1 SL difference)
    const targetPrice = side === 'buy'
      ? this.round(input.entryPrice + stopLossDifferenceUsd, 2)
      : this.round(input.entryPrice - stopLossDifferenceUsd, 2);

    // Target quantity: exactly half of main quantity, rounded to lot size
    // Ensure it doesn't exceed half of quantity even after rounding
    const rawTargetQty = quantity / 2;
    const targetQuantity = Math.min(roundToLotSize(rawTargetQty), rawTargetQty);

    // Bracket target price (× targetMultiplier SL difference from config)
    const bracketTargetPrice = side === 'buy'
      ? this.round(input.entryPrice + (stopLossDifferenceUsd * targetMultiplier), 2)
      : this.round(input.entryPrice - (stopLossDifferenceUsd * targetMultiplier), 2);

    // Log risk calculations for verification (AFTER variables are declared)
    this.debug.log(`Risk calculation for ${input.symbol} (${side}):`, {
      configuredRiskInr: input.riskAmountInr,
      stopLossDifferenceInr: this.round(stopLossDifference, 2),
      stopLossDifferenceUsd: stopLossDifferenceUsd,
      calculatedQuantity: quantity,
      effectiveRiskInr: effectiveRiskInr,
      entryPrice: input.entryPrice,
      stopLossPrice: stopLossPrice,
      targetPrice: targetPrice,
      bracketTargetPrice: bracketTargetPrice,
      bufferPercentageApplied: bufferPercentage,
      targetMultiplierApplied: targetMultiplier,
      halfTargetMultiplier: 1
    });

    // Calculate bracket trailing amount (stop loss difference * 1)
    const bracketTrailAmount = this.round(stopLossDifferenceUsd * 1, 2);

    // Calculate limit prices (slightly more conservative than stop prices)
    const stopLossLimitPrice = side === 'buy'
      ? this.round(stopLossPrice * 0.995, 2)  // 0.5% below stop for buys
      : this.round(stopLossPrice * 1.005, 2); // 0.5% above stop for sells

    const takeProfitLimitPrice = side === 'buy'
      ? this.round(bracketTargetPrice * 0.995, 2)  // Slightly below target for buys
      : this.round(bracketTargetPrice * 1.005, 2); // Slightly above target for sells

    this.debug.log('📊 Bracket order calculations:', {
      stopLossPrice,
      stopLossLimitPrice,
      stopLossDifferenceUsd,
      targetPrice: targetPrice,
      bracketTargetPrice: bracketTargetPrice,
      takeProfitLimitPrice: takeProfitLimitPrice,
      bracketTrailAmount: bracketTrailAmount
    });

    // Convert quantity to number of contracts for Delta API
    // Delta API expects integer contracts: size = quantity / contract_value
    const sizeInContracts = Math.round(quantity / lotSize);
    const targetSizeInContracts = Math.round(targetQuantity / lotSize);

    this.debug.log('📤 Step 1: Creating bracket order definition:', {
      product_id: productId,
      product_symbol: input.symbol,
      stopLossPrice,
      stopLossLimitPrice,
      bracketTargetPrice,
      takeProfitLimitPrice
    });

    // Create market entry order WITH bracket orders in a single request
    // Using the correct Delta Exchange format
    const entryPayload = {
      product_id: productId,
      size: sizeInContracts,
      side: side,
      order_type: 'market_order',
      bracket_stop_trigger_method: 'last_traded_price',
      bracket_stop_loss_price: String(stopLossPrice),       // Stop loss price
      trail_amount: String(bracketTrailAmount),             // Trailing amount (SL diff × 1)
      bracket_take_profit_price: String(bracketTargetPrice) // Take profit price
    };

    // Separate half-position target order (not part of bracket)
    const targetPayload = {
      product_id: productId,
      order_type: 'limit_order',
      side: exitSide,
      size: targetSizeInContracts,  // Integer number of contracts
      reduce_only: true,
      limit_price: targetPrice,
      time_in_force: 'gtc'
    };

    this.debug.log('📤 Creating market order with brackets:', entryPayload);
    this.debug.log('📤 Creating half-position target order:', targetPayload);

    const entryOrder = await this.createOrder(entryPayload);
    const targetOrder = await this.createOrder(targetPayload);

    return {
      calculations: {
        stopLossPrice,
        stopLossDifference,
        quantity: Number(quantity),
        targetQuantity: Number(targetQuantity),
        targetPrice,
        bracketTargetPrice,          // Bracket target price (SL diff * 4)
        bracketTrailingAmount: bracketTrailAmount, // Trailing amount (SL diff * 1)
        effectiveRiskInr,
        entryPrice: input.entryPrice  // Entry price for display (from input)
      },
      orders: {
        entry: entryOrder,
        target: targetOrder
      }
    };
  }

  /**
   * Place a LIMIT order with bracket parameters (trailing stop and take profit) using /v2/orders
   * Builds payload according to user's required format and posts to createOrder
   */
  async placeLimitBracketOrder(input: PlaceBracketOrderRequest): Promise<PlaceBracketOrderResult> {
    const product = await this.getProductBySymbol(input.symbol);
    if (!product) {
      throw new Error(`Product not found for symbol ${input.symbol}`);
    }

    const productId = product.id || product.product_id;
    const side: OrderSide = input.side;
    const config = this.configService.getConfig();
    const bufferMultiplier = 1 + (config.bufferPercentage / 100);
    const targetMultiplier = config.targetMultiplier;

    // Check if product is quoted in USD (requires INR conversion for risk calculation)
    const quotingAsset = product.quoting_asset?.symbol || product.settling_asset?.symbol || '';
    const isUsdQuoted = quotingAsset.toUpperCase() === 'USDT' || quotingAsset.toUpperCase() === 'USD';
    const priceMultiplier = isUsdQuoted ? this.USD_TO_INR : 1;

    // Entry price: Use max/min of previous N-day and today's prices (SIDE-SPECIFIC)
    // Buy: Max(PrevNHigh, TodayHigh) * (1 + buffer%)
    // Sell: Min(PrevNLow, TodayLow) * (1 - buffer%)
    const todayHigh = input.todayHigh || input.prev3High;
    const todayLow = input.todayLow || input.prev3Low;

    const effectiveHighPrice = side === 'buy' ? Math.max(input.prev3High, todayHigh) : input.prev3High;
    const effectiveLowPrice = side === 'sell' ? Math.min(input.prev3Low, todayLow) : input.prev3Low;

    const entryPrice = side === 'buy'
      ? this.round(effectiveHighPrice * bufferMultiplier, 4)
      : this.round(effectiveLowPrice / bufferMultiplier, 4);

    // Stop Loss: Based on the 3-day low/high with buffer, NOT from entry price
    // Buy: SL = Min(Prev3Low, TodayLow) * (1 - buffer%)
    // Sell: SL = Max(Prev3High, TodayHigh) * (1 + buffer%)
    const allHighPrice = Math.max(input.prev3High, todayHigh);
    const allLowPrice = Math.min(input.prev3Low, todayLow);

    const stopLossPrice = side === 'buy'
      ? this.round(allLowPrice * (1 - (config.bufferPercentage / 100)), 4)  // 3-day low with buffer reduction
      : this.round(allHighPrice * (1 + (config.bufferPercentage / 100)), 4);  // 3-day high with buffer increase

    // Log entry price calculation
    this.debug.log(`[${input.symbol}] Entry price calculation:`, {
      side,
      prev3High: input.prev3High,
      todayHigh,
      prev3Low: input.prev3Low,
      todayLow,
      effectiveHighPrice,
      effectiveLowPrice,
      entryPrice,
      stopLossPrice,
      allHighPrice,
      allLowPrice
    });

    const stopLossPriceInr = stopLossPrice * priceMultiplier;
    const entryPriceInr = entryPrice * priceMultiplier;

    const stopLossDifferenceInr = this.round(Math.abs(entryPriceInr - stopLossPriceInr), 4);
    const stopLossDifferenceUsd = this.round(Math.abs(entryPrice - stopLossPrice), 4);

    if (stopLossDifferenceInr <= 0) {
      throw new Error('Invalid stop loss difference');
    }

    const riskAmountInr = input.riskAmountInr || config.riskAmountInr;

    // Use contract_value as lot size
    const lotSize = product.contract_value || 0.001;
    const roundToLotSize = (qty: number): number => Math.max(lotSize, Math.round(qty / lotSize) * lotSize);

    // ==========================================
    // PLACE LIMIT ORDER: Quantity Calculation
    // ==========================================
    // Formula: Quantity = Risk Amount / Stop Loss Price Difference
    //
    // Example:
    // - Entry Price: 103 (Prev 3 High * 1.003)
    // - Stop Loss: 99.7 (Prev 3 Low * 0.997)
    // - SL Difference: 103 - 99.7 = 3.3
    // - Risk Amount: ₹2500 (configured)
    // - Quantity = 2500 / 3.3 = 757.576 units
    //
    // Both BUY and SELL orders use the SAME SL difference for quantity.
    // This ensures identical quantities for both sides.

    // Quantity formula: Risk Amount (INR) / Stop Loss Difference (INR)
    const rawQty = riskAmountInr / stopLossDifferenceInr;
    const quantity = roundToLotSize(rawQty);

    // Target quantity: exactly half of main quantity, rounded to lot size
    // Ensure it doesn't exceed half of quantity even after rounding
    const rawTargetQty = quantity / 2;
    const targetQuantity = Math.min(roundToLotSize(rawTargetQty), rawTargetQty);

    // Log risk calculations for verification
    const effectiveRiskInr = this.round(quantity * stopLossDifferenceInr, 2);
    this.debug.log(`Limit order quantity calculation for ${input.symbol} (${side}):`, {
      configuredRiskInr: riskAmountInr,
      stopLossDifferenceInr: this.round(stopLossDifferenceInr, 2),
      stopLossDifferenceUsd: stopLossDifferenceUsd,
      calculatedQuantity: quantity,
      effectiveRiskInr: effectiveRiskInr,
      targetQuantity: targetQuantity,
      entryPrice: entryPrice,
      stopLossPrice: stopLossPrice,
      bufferPercentage: config.bufferPercentage
    });

    // Target: targetMultiplier x the risk distance away from entry
    const bracketTargetPrice = side === 'buy'
      ? this.round(entryPrice + (stopLossDifferenceUsd * targetMultiplier), 4)
      : this.round(entryPrice - (stopLossDifferenceUsd * targetMultiplier), 4);

    // Size in contracts
    const sizeInContracts = Math.round(quantity / lotSize);
    const targetSizeInContracts = Math.round(targetQuantity / lotSize);

    // Stop price: 0.5% away from entry price
    // Buy: stop_price = entry_price / bufferMultiplier (0.5% below entry)
    // Sell: stop_price = entry_price * bufferMultiplier (0.5% above entry)
    // Uses the same buffer percentage from config as entry/SL calculations
    const stopPrice = side === 'buy'
      ? this.round(entryPrice / bufferMultiplier, 4)
      : this.round(entryPrice * bufferMultiplier, 4);

    const payload = {
      product_id: productId,
      size: String(sizeInContracts),
      side: side,
      order_type: 'limit_order',
      limit_price: String(entryPrice),
      stop_order_type: 'stop_loss_order',
      stop_price: String(stopPrice),
      client_order_id: `${input.symbol}_${side}_${sizeInContracts}`
    };

    this.debug.log('Placing limit bracket order payload:', payload);

    const entryOrder = await this.createOrder(payload);

    return {
      calculations: {
        stopLossPrice,
        stopLossDifference: stopLossDifferenceInr,
        quantity,
        targetQuantity: Math.min(roundToLotSize(quantity / 2), quantity / 2),
        targetPrice: bracketTargetPrice,
        bracketTargetPrice,
        bracketTrailingAmount: stopLossDifferenceUsd,
        effectiveRiskInr: effectiveRiskInr,
        entryPrice: entryPrice
      },
      orders: {
        entry: entryOrder,
        target: null
      }
    };
  }

  /**
   * Check if half-position target order has been executed (full or partial fill)
   * Returns: { hasBeenExecuted: boolean, filledSize: number, totalSize: number, orderStatus: 'open'|'partially_filled'|'filled' }
   */
  async checkTargetOrderExecution(symbol: string, targetOrderId?: number): Promise<{
    hasBeenExecuted: boolean;
    filledSize: number;
    totalSize: number;
    orderStatus: 'open' | 'partially_filled' | 'filled';
    unfilled_size: number;
  } | null> {
    try {
      if (!targetOrderId) {
        this.debug.log(`⚠️ No target order ID provided for ${symbol}`);
        return null;
      }

      // Get order details from API
      const path = `/v2/orders/${targetOrderId}`;
      const orderData = await this.authenticatedRequest('GET', path, undefined, this.baseUrl);

      if (!orderData) {
        this.debug.log(`⚠️ Could not fetch order details for target order ${targetOrderId}`);
        return null;
      }

      const totalSize = parseFloat(orderData.size || 0);
      const unfilledSize = parseFloat(orderData.unfilled_size || 0);
      const filledSize = totalSize - unfilledSize;

      let orderStatus: 'open' | 'partially_filled' | 'filled' = 'open';
      if (filledSize === totalSize) {
        orderStatus = 'filled';
      } else if (filledSize > 0) {
        orderStatus = 'partially_filled';
      }

      const hasBeenExecuted = filledSize > 0;

      this.debug.log(`✅ Target order ${targetOrderId} status:`, {
        totalSize,
        filledSize,
        unfilled_size: unfilledSize,
        orderStatus,
        hasBeenExecuted,
        state: orderData.state
      });

      return {
        hasBeenExecuted,
        filledSize,
        totalSize,
        orderStatus,
        unfilled_size: unfilledSize
      };
    } catch (err: any) {
      this.debug.log(`❌ Error checking target order execution: ${err?.message}`);
      return null;
    }
  }

  /**
   * Find half-position target order for a position
   * Returns order_id if found, null otherwise
   */
  async findTargetOrderForPosition(productId: number, symbol: string): Promise<number | null> {
    try {
      // Get all pending limit orders for this product
      const path = `/v2/orders?product_ids=${productId}&state=pending&order_types=limit`;
      const result = await this.authenticatedRequest('GET', path, undefined, this.baseUrl);

      const orders = Array.isArray(result) ? result : (result?.orders || result?.result || []);

      // Filter for reduce_only limit orders (these are the target orders)
      const targetOrders = orders.filter((o: any) => o.reduce_only === true);

      if (targetOrders.length > 0) {
        // Return the first target order found (should be only one)
        this.debug.log(`✅ Found ${targetOrders.length} target order(s) for ${symbol}`, {
          id: targetOrders[0].id,
          size: targetOrders[0].size,
          unfilled_size: targetOrders[0].unfilled_size,
          limit_price: targetOrders[0].limit_price
        });
        return targetOrders[0].id;
      }

      this.debug.log(`⚠️ No target order found for ${symbol} (product_id: ${productId})`);
      return null;
    } catch (err: any) {
      this.debug.log(`❌ Error finding target order: ${err?.message}`);
      return null;
    }
  }

  /**
   * Move stop loss to entry price (when target has been executed)
   */
  async moveSLToEntryPrice(position: any): Promise<{ success: boolean; message: string; symbol: string }> {
    try {
      const symbol = position.symbol || position.product_symbol;
      const entryPrice = parseFloat(position.entry_price || position.avg_price || 0);

      if (!symbol || entryPrice <= 0) {
        return { success: false, message: 'Invalid position data', symbol: symbol || 'Unknown' };
      }

      this.debug.log(`🔄 Moving SL to entry price for ${symbol}: Entry=${entryPrice}`);

      // Step 1: Get product_id from ticker
      const ticker = await this.getTicker(symbol);
      if (!ticker || !ticker.product_id) {
        return { success: false, message: 'Could not get product_id from ticker', symbol };
      }

      const productId = ticker.product_id;

      // Step 2: Find the stop loss order
      const path = `/v2/orders?product_ids=${productId}&state=pending&order_types=stop_market`;
      const result = await this.authenticatedRequest('GET', path, undefined, this.baseUrl);

      const orders = Array.isArray(result) ? result : (result?.orders || result?.result || []);

      if (orders.length === 0) {
        return {
          success: false,
          message: `No stop loss orders found for ${symbol}`,
          symbol
        };
      }

      // Find stop loss order by side
      const positionSize = parseFloat(position.size || 0);
      const isBuyPosition = positionSize > 0;
      const stopLossSide = isBuyPosition ? 'sell' : 'buy';

      const stopLossOrder = orders.find((o: any) => o.side === stopLossSide);

      if (!stopLossOrder) {
        return {
          success: false,
          message: `No stop loss order found with side=${stopLossSide}`,
          symbol
        };
      }

      // Step 3: Update the stop loss order with new price = entry price
      const currentStopPrice = parseFloat(stopLossOrder.stop_price || 0);

      // Only update if entry price is better than current stop loss
      let shouldUpdate = false;
      if (isBuyPosition && entryPrice > currentStopPrice) {
        // For buy positions, new SL should be higher (lock in profit)
        shouldUpdate = true;
      } else if (!isBuyPosition && entryPrice < currentStopPrice) {
        // For sell positions, new SL should be lower (lock in profit)
        shouldUpdate = true;
      }

      if (!shouldUpdate) {
        return {
          success: false,
          message: `Entry price ${entryPrice} is not better than current SL ${currentStopPrice}`,
          symbol
        };
      }

      // Update the stop loss order
      const updateResult = await this.updateStopLossOrder(
        stopLossOrder,
        entryPrice,
        productId,
        Math.abs(positionSize),
        symbol
      );

      return {
        success: true,
        message: `✅ SL moved to entry price: ${entryPrice}. Old SL: ${currentStopPrice}`,
        symbol
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to move SL to entry price',
        symbol: position.symbol || 'Unknown'
      };
    }
  }
}
