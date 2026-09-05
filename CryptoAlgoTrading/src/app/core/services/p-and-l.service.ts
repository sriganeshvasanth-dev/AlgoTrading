import { Injectable } from '@angular/core';
import { DeltaService } from './delta.service';
import { LoggingService } from './logging.service';
import { API_CONFIG } from '../config/api.config';

export type Fill = {
  id: number;
  size: number;
  fill_type: 'normal' | 'adl' | 'liquidation' | 'settlement' | 'otc';
  side: 'buy' | 'sell';
  price: string;
  role: 'taker' | 'maker';
  commission: string;
  created_at: string;
  product_id: number;
  product_symbol: string;
  order_id: string;
  settling_asset_id: number;
  settling_asset_symbol: string;
  meta_data?: {
    commission_deto?: string;
    commission_deto_in_settling_asset?: string;
    total_commission_in_settling_asset?: string;
    total_liquidation_fee_in_settling_asset?: string;
    [key: string]: any;
  };
};

export type SymbolPnL = {
  symbol: string;
  pnl: number;
  fees: number;
  netPnL: number;
  buys: Fill[];
  sells: Fill[];
  fillCount: number;
  createdAt?: string; // ISO timestamp of the symbol's first transaction (for wallet transactions mode)
};

export type DatePnL = {
  date: string; // 'YYYY-MM-DD'
  createdAt?: string; // ISO timestamp of first fill for the date
  pnl: number;
  fees: number;
  netPnL: number;
  symbols: SymbolPnL[];
};

export type WeekPnL = {
  week: string; // 'YYYY-W##'
  startDate: string;
  endDate: string;
  pnl: number;
  fees: number;
  netPnL: number;
  dates: DatePnL[];
};

export type MonthPnL = {
  month: string; // 'YYYY-MM'
  pnl: number;
  fees: number;
  netPnL: number;
  weeks: WeekPnL[];
};

@Injectable({
  providedIn: 'root'
})
export class PAndLService {
  constructor(
    private deltaService: DeltaService,
    private logger: LoggingService
  ) {}

  /**
   * Fetch fills from Delta Exchange API for a date range with pagination support
   */
  async getFills(
    startTime?: number,
    endTime?: number,
    productIds?: number[],
    pageSize: number = 50000
  ): Promise<Fill[]> {
    try {
      const allFills: Fill[] = [];
      let afterCursor: string | undefined = undefined;
      let fetchMore = true;

      while (fetchMore) {
        const params = new URLSearchParams();

        if (startTime) params.set('start_time', (startTime * 1000000).toString());
        if (endTime) params.set('end_time', (endTime * 1000000).toString());
        if (productIds && productIds.length > 0) {
          params.set('product_ids', productIds.slice(0, 10).join(','));
        }

        params.set('page_size', pageSize.toString());

        if (afterCursor) {
          params.set('after', afterCursor);
        }

        const path = `/v2/fills${params.toString() ? '?' + params.toString() : ''}`;

        this.logger.debug('Fetching fills from:', path);
        const response = await (this.deltaService as any).authenticatedRequest('GET', path);

        const fills = response?.result || response || [];

        if (Array.isArray(fills)) {
          allFills.push(...fills);
          this.logger.debug(`Fetched ${fills.length} fills, total so far: ${allFills.length}`);

          if (fills.length > 0) {
            const meta = response?.meta;
            if (meta?.after && fills.length >= pageSize) {
              afterCursor = meta.after;
            } else {
              fetchMore = false;
            }
          } else {
            fetchMore = false;
          }
        } else {
          fetchMore = false;
        }
      }

      return allFills;
    } catch (err: any) {
      this.logger.error('Error fetching fills:', err);
      throw err;
    }
  }

  /**
   * Fetch wallet transactions from Delta Exchange API for P&L calculation
   * Uses server-side filtering for efficient data retrieval
   */
  async getWalletTransactions(
    startTime?: number,
    endTime?: number,
    pageSize: number = 50000,
    assetIds?: number[],
    transactionTypes?: string[]
  ): Promise<any[]> {
    try {
      const allTransactions: any[] = [];
      let beforeCursor: string | undefined = undefined;
      let fetchMore = true;

      while (fetchMore) {
        const params = new URLSearchParams();

        if (startTime) params.set('start_time', (startTime * 1000000).toString());
        if (endTime) params.set('end_time', (endTime * 1000000).toString());
        if (assetIds && assetIds.length > 0) {
          params.set('asset_ids', assetIds.join(','));
        }
        if (transactionTypes && transactionTypes.length > 0) {
          params.set('transaction_types', transactionTypes.join(','));
        }

        params.set('page_size', pageSize.toString());

        if (beforeCursor) {
          params.set('before', beforeCursor);
        }

        const path = `/v2/wallet/transactions${params.toString() ? '?' + params.toString() : ''}`;

        this.logger.debug('Fetching wallet transactions from:', path);
        const response = await (this.deltaService as any).authenticatedRequest('GET', path);

        const transactions = response?.result || response || [];

        if (Array.isArray(transactions)) {
          allTransactions.push(...transactions);
          this.logger.debug(`Fetched ${transactions.length} transactions, total so far: ${allTransactions.length}`);

          if (transactions.length > 0) {
            const meta = response?.meta;
            if (meta?.before && transactions.length >= pageSize) {
              beforeCursor = meta.before;
            } else {
              fetchMore = false;
            }
          } else {
            fetchMore = false;
          }
        } else {
          fetchMore = false;
        }
      }

      return allTransactions;
    } catch (err: any) {
      this.logger.error('Error fetching wallet transactions:', err);
      throw err;
    }
  }

  /**
   * Calculate P&L using FIFO (First In First Out) matching of buy/sell pairs
   * P&L = (sell_price - buy_price) × quantity (without deducting fees)
   * Fees are tracked separately and deducted from final P&L display
   */
  private calculateFillPnLWithFIFO(fills: Fill[], symbol: string): { pnl: number; fees: number } {
    const symbolFills = fills.filter(f => f.product_symbol === symbol);
    const buys = symbolFills.filter(f => f.side === 'buy').sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const sells = symbolFills.filter(f => f.side === 'sell').sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let totalPnL = 0;
    let totalFees = 0;
    let buyIndex = 0;
    let buyQuantityRemaining = buys.length > 0 ? buys[0].size : 0;

    this.logger.debug(`[FIFO] Symbol: ${symbol}, Buys: ${buys.length}, Sells: ${sells.length}`);

    for (const sell of sells) {
      let sellQuantityRemaining = sell.size;
      const sellPrice = parseFloat(sell.price);

      const sellFees = parseFloat(sell.commission || '0') + 
                       parseFloat(sell.meta_data?.total_liquidation_fee_in_settling_asset || '0');
      totalFees += sellFees;

      this.logger.debug(`Sell: ${sell.size} @ ${sellPrice}, Fees: ${sellFees}`);

      while (sellQuantityRemaining > 0 && buyIndex < buys.length) {
        const buy = buys[buyIndex];
        const buyPrice = parseFloat(buy.price);

        const buyFees = parseFloat(buy.commission || '0') + 
                        parseFloat(buy.meta_data?.total_liquidation_fee_in_settling_asset || '0');

        const matchedQuantity = Math.min(buyQuantityRemaining, sellQuantityRemaining);

        const pairPnL = (sellPrice - buyPrice) * matchedQuantity;
        totalPnL += pairPnL;

        const proportionalBuyFees = (buyFees * matchedQuantity) / buy.size;
        totalFees += proportionalBuyFees;

        this.logger.debug(`Match: ${matchedQuantity} @ Buy ${buyPrice} -> Sell ${sellPrice}, PnL: ${pairPnL}, Buy Fees: ${proportionalBuyFees}`);

        buyQuantityRemaining -= matchedQuantity;
        sellQuantityRemaining -= matchedQuantity;

        if (buyQuantityRemaining === 0) {
          buyIndex++;
          if (buyIndex < buys.length) {
            buyQuantityRemaining = buys[buyIndex].size;
          }
        }
      }
    }

    this.logger.debug(`Final - PnL: ${totalPnL}, Total Fees: ${totalFees}`);
    return { pnl: totalPnL, fees: totalFees };
  }

  /**
   * Group fills by symbol and calculate P&L for each using FIFO matching
   */
  private groupBySymbol(fills: Fill[]): SymbolPnL[] {
    const symbolMap = new Map<string, SymbolPnL>();

    for (const fill of fills) {
      if (!symbolMap.has(fill.product_symbol)) {
        symbolMap.set(fill.product_symbol, {
          symbol: fill.product_symbol,
          pnl: 0,
          fees: 0,
          netPnL: 0,
          buys: [],
          sells: [],
          fillCount: 0
        });
      }

      const symbolData = symbolMap.get(fill.product_symbol)!;
      if (fill.side === 'buy') {
        symbolData.buys.push(fill);
      } else {
        symbolData.sells.push(fill);
      }
      symbolData.fillCount++;
    }

    for (const [symbol, data] of symbolMap) {
      const symbolFills = fills.filter(f => f.product_symbol === symbol);
      const { pnl, fees } = this.calculateFillPnLWithFIFO(symbolFills, symbol);
      data.pnl = pnl;
      data.fees = fees;
      data.netPnL = pnl - fees;
    }

    return Array.from(symbolMap.values());
  }

  /**
   * Group fills by date
   */
  private groupByDate(fills: Fill[]): DatePnL[] {
    const dateMap = new Map<string, Fill[]>();

    for (const fill of fills) {
      const date = new Date(fill.created_at).toISOString().split('T')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, []);
      }
      dateMap.get(date)!.push(fill);
    }

    const datePnLs: DatePnL[] = [];
    for (const [date, dateFills] of dateMap) {
      const symbols = this.groupBySymbol(dateFills);
      const pnl = symbols.reduce((sum, s) => sum + s.pnl, 0);
      const fees = symbols.reduce((sum, s) => sum + s.fees, 0);

      datePnLs.push({
        date,
        createdAt: dateFills.length > 0 ? dateFills[0].created_at : undefined, // Store first fill's timestamp
        pnl,
        fees,
        netPnL: pnl - fees,
        symbols
      });
    }

    return datePnLs.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get week number from date string (YYYY-MM-DD)
   */
  private getWeekNumber(dateStr: string): { week: string; startDate: string; endDate: string } {
    const date = new Date(dateStr + 'T00:00:00Z');
    const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const diff = date.getTime() - startOfYear.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const weekNum = Math.floor(diff / oneWeek) + 1;

    const year = date.getUTCFullYear();
    const week = String(weekNum).padStart(2, '0');

    const weekStart = new Date(startOfYear);
    weekStart.setUTCDate(weekStart.getUTCDate() + (weekNum - 1) * 7 - weekStart.getUTCDay() + 1);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    const startDate = weekStart.toISOString().split('T')[0];
    const endDate = weekEnd.toISOString().split('T')[0];

    return {
      week: `${year}-W${week}`,
      startDate,
      endDate
    };
  }

  /**
   * Group fills by week
   */
  private groupByWeek(datePnLs: DatePnL[]): WeekPnL[] {
    const weekMap = new Map<string, { pnl: number; fees: number; dates: DatePnL[] }>();

    for (const datePnL of datePnLs) {
      const { week, startDate, endDate } = this.getWeekNumber(datePnL.date);

      if (!weekMap.has(week)) {
        weekMap.set(week, { pnl: 0, fees: 0, dates: [] });
      }

      const weekData = weekMap.get(week)!;
      weekData.dates.push(datePnL);
      weekData.pnl += datePnL.pnl;
      weekData.fees += datePnL.fees;
    }

    const weekPnLs: WeekPnL[] = [];
    for (const [week, data] of weekMap) {
      const weekInfo = this.getWeekNumber(data.dates[0].date);

      weekPnLs.push({
        week,
        startDate: weekInfo.startDate,
        endDate: weekInfo.endDate,
        pnl: data.pnl,
        fees: data.fees,
        netPnL: data.pnl - data.fees,
        dates: data.dates.sort((a, b) => a.date.localeCompare(b.date))
      });
    }

    return weekPnLs.sort((a, b) => a.week.localeCompare(b.week));
  }

  /**
   * Group fills by month
   */
  private groupByMonth(datePnLs: DatePnL[]): MonthPnL[] {
    const monthMap = new Map<string, { pnl: number; fees: number; datePnLs: DatePnL[] }>();

    for (const datePnL of datePnLs) {
      const month = datePnL.date.substring(0, 7);

      if (!monthMap.has(month)) {
        monthMap.set(month, { pnl: 0, fees: 0, datePnLs: [] });
      }

      const monthData = monthMap.get(month)!;
      monthData.datePnLs.push(datePnL);
      monthData.pnl += datePnL.pnl;
      monthData.fees += datePnL.fees;
    }

    const monthPnLs: MonthPnL[] = [];
    for (const [month, data] of monthMap) {
      const weekPnLs = this.groupByWeek(data.datePnLs);

      monthPnLs.push({
        month,
        pnl: data.pnl,
        fees: data.fees,
        netPnL: data.pnl - data.fees,
        weeks: weekPnLs
      });
    }

    return monthPnLs.sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Organize fills hierarchically by month > week > date > symbol
   */
  async organizeHierarchically(fills: Fill[]): Promise<MonthPnL[]> {
    const datePnLs = this.groupByDate(fills);
    const monthPnLs = this.groupByMonth(datePnLs);
    return monthPnLs;
  }

  /**
   * Get P&L data for a specific date range
   */
  async getPnLForDateRange(
    startDate: Date,
    endDate: Date,
    productIds?: number[]
  ): Promise<MonthPnL[]> {
    try {
      const startTime = startDate.getTime() / 1000;
      const endTime = endDate.getTime() / 1000;

      const fills = await this.getFills(startTime, endTime, productIds);

      const organized = await this.organizeHierarchically(fills);

      return organized;
    } catch (err: any) {
      this.logger.error('Error getting P&L for date range:', err);
      throw err;
    }
  }

  /**
   * Calculate total P&L and fees for all hierarchical data
   */
  calculateTotals(months: MonthPnL[]): { totalPnL: number; totalFees: number; totalNetPnL: number } {
    const totalPnL = months.reduce((sum, m) => sum + m.pnl, 0);
    const totalFees = months.reduce((sum, m) => sum + m.fees, 0);

    return {
      totalPnL,
      totalFees,
      totalNetPnL: totalPnL - totalFees
    };
  }

  /**
   * Calculate P&L from wallet transactions
   * Groups transactions by date, week, month and symbol/asset
   * Supports filtering by transaction type
   */
  async getPnLFromWalletTransactions(
    startDate: Date,
    endDate: Date,
    assetIds?: number[],
    transactionTypes?: string[]
  ): Promise<MonthPnL[]> {
    try {
      const startTime = startDate.getTime() / 1000;
      const endTime = endDate.getTime() / 1000;

      this.logger.info(`[Wallet P&L] Fetching wallet transactions from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Fetch wallet transactions with server-side filtering
      const transactions = await this.getWalletTransactions(startTime, endTime, 50000, assetIds, transactionTypes);

      this.logger.debug(`[Wallet P&L] Fetched ${transactions.length} transactions`);
      if (transactionTypes && transactionTypes.length > 0) {
        this.logger.info(`[Wallet P&L] Filtered transaction types: ${transactionTypes.join(', ')}`);
      }

      if (transactions.length === 0) {
        this.logger.warn('[Wallet P&L] No transactions found for date range');
        return [];
      }

      // Group transactions by date
      const dateMap = new Map<string, any[]>();
      for (const txn of transactions) {
        const date = new Date(txn.created_at).toISOString().split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, []);
        }
        dateMap.get(date)!.push(txn);
      }

      // Convert to DatePnL format
      const datePnLs: DatePnL[] = [];
      for (const [date, dateTxns] of dateMap) {
        // Group transactions by product_symbol for this date
        const symbolMap = new Map<string, number>();
        const txnCount = new Map<string, number>();

        for (const txn of dateTxns) {
          // Use product_symbol from meta_data (the actual trading pair like XAUTUSD, ETCUSD)
          // Fall back to asset_symbol if product_symbol is not available
          const symbol = txn.meta_data?.product_symbol || txn.asset_symbol || 'UNKNOWN';
          const amount = parseFloat(txn.amount || '0');
          symbolMap.set(symbol, (symbolMap.get(symbol) || 0) + amount);
          txnCount.set(symbol, (txnCount.get(symbol) || 0) + 1);
        }

        // Convert to SymbolPnL format
        const symbols: SymbolPnL[] = [];
        for (const [symbol, pnl] of symbolMap) {
          // Try to extract entry/exit prices and quantity from metadata
          const symbolTxns = dateTxns.filter(txn => 
            (txn.meta_data?.product_symbol || txn.asset_symbol || 'UNKNOWN') === symbol
          );

          // Build synthetic fills from transaction metadata to support entry/exit calculations
          const buys: any[] = [];
          let totalBuyQty = 0;
          let totalBuyCost = 0;
          let symbolCreatedAt = ''; // Store individual symbol's timestamp

          for (const txn of symbolTxns) {
            if (txn.meta_data?.entry_price && txn.meta_data?.position_size) {
              buys.push({
                id: txn.id || 0,
                price: String(txn.meta_data.entry_price),
                size: Math.abs(parseFloat(txn.meta_data.position_size || '0')),
                side: 'buy',
                created_at: txn.created_at,
                product_symbol: symbol
              });
              totalBuyQty += Math.abs(parseFloat(txn.meta_data.position_size || '0'));
              totalBuyCost += (parseFloat(txn.meta_data.entry_price) * Math.abs(parseFloat(txn.meta_data.position_size || '0')));
              if (!symbolCreatedAt) symbolCreatedAt = txn.created_at; // Use first transaction's timestamp
            }
          }

          const sells: any[] = [];
          for (const txn of symbolTxns) {
            if (txn.meta_data?.exit_price) {
              sells.push({
                id: txn.id || 0,
                price: String(txn.meta_data.exit_price),
                size: Math.abs(parseFloat(txn.meta_data.position_size || '0')),
                side: 'sell',
                created_at: txn.created_at,
                product_symbol: symbol
              });
              if (!symbolCreatedAt) symbolCreatedAt = txn.created_at; // Use first transaction's timestamp
            }
          }

          symbols.push({
            symbol,
            pnl,
            fees: 0,
            netPnL: pnl,
            buys,
            sells,
            fillCount: txnCount.get(symbol) || 0,
            createdAt: symbolCreatedAt // Add timestamp to SymbolPnL for individual symbol tracking
          });
        }

        const totalPnL = symbols.reduce((sum, s) => sum + s.pnl, 0);

        // Get the first transaction timestamp for this date
        let createdAt: string | undefined;
        if (dateTxns.length > 0) {
          createdAt = dateTxns[0].created_at;
        }

        datePnLs.push({
          date,
          createdAt,
          pnl: totalPnL,
          fees: 0,
          netPnL: totalPnL,
          symbols
        });
      }

      // Sort dates
      datePnLs.sort((a, b) => a.date.localeCompare(b.date));

      // Group by week
      const weekMap = new Map<string, { pnl: number; fees: number; dates: DatePnL[] }>();
      for (const datePnL of datePnLs) {
        const { week, startDate, endDate } = this.getWeekNumber(datePnL.date);

        if (!weekMap.has(week)) {
          weekMap.set(week, { pnl: 0, fees: 0, dates: [] });
        }

        const weekData = weekMap.get(week)!;
        weekData.dates.push(datePnL);
        weekData.pnl += datePnL.pnl;
        weekData.fees += datePnL.fees;
      }

      // Convert to WeekPnL
      const weeks: WeekPnL[] = [];
      for (const [week, data] of weekMap) {
        const weekInfo = this.getWeekNumber(data.dates[0].date);

        weeks.push({
          week,
          startDate: weekInfo.startDate,
          endDate: weekInfo.endDate,
          pnl: data.pnl,
          fees: data.fees,
          netPnL: data.pnl - data.fees,
          dates: data.dates.sort((a, b) => a.date.localeCompare(b.date))
        });
      }

      // Group by month
      const monthMap = new Map<string, { pnl: number; fees: number; weeks: WeekPnL[] }>();
      for (const week of weeks) {
        const month = week.startDate.substring(0, 7);

        if (!monthMap.has(month)) {
          monthMap.set(month, { pnl: 0, fees: 0, weeks: [] });
        }

        const monthData = monthMap.get(month)!;
        monthData.weeks.push(week);
        monthData.pnl += week.pnl;
        monthData.fees += week.fees;
      }

      // Convert to MonthPnL
      const months: MonthPnL[] = [];
      for (const [month, data] of monthMap) {
        months.push({
          month,
          pnl: data.pnl,
          fees: data.fees,
          netPnL: data.pnl - data.fees,
          weeks: data.weeks.sort((a, b) => a.week.localeCompare(b.week))
        });
      }

      this.logger.info(`[Wallet P&L] Organized into ${months.length} months, total P&L: ${months.reduce((sum, m) => sum + m.pnl, 0)}`);
      return months;
    } catch (err: any) {
      this.logger.error('[Wallet P&L] Error calculating P&L from wallet transactions:', err);
      throw err;
    }
  }
}
