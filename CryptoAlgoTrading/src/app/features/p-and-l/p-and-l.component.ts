import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PAndLService, MonthPnL, WeekPnL, DatePnL } from '../../core/services/p-and-l.service';
import { LoggingService } from '../../core/services/logging.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

type TreeNode = {
  id: string;
  label: string;
  pnl: number;
  fees: number;
  netPnL: number;
  type: 'month' | 'week' | 'date' | 'symbol';
  expanded: boolean;
  children: TreeNode[];
  data?: any;
};

@Component({
  selector: 'app-p-and-l',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './p-and-l.component.html',
  styleUrls: ['./p-and-l.component.css']
})
export class PAndLComponent implements OnInit, OnDestroy {
  // Date range controls
  startDate: string = this.getDefaultStartDate();
  endDate: string = this.getDefaultEndDate();

  // Data source selection
  dataSource: 'fills' | 'transactions' = 'fills'; // Toggle between fills-based and transactions-based P&L

  // Transaction type filter (only for wallet transactions)
  selectedTransactionTypes: string[] = []; // Empty = all types
  transactionTypeOptions = [
    { value: 'cashflow', label: 'Cashflow - Generic cash credit or debit' },
    { value: 'deposit', label: 'Deposit - Funds deposited into the wallet' },
    { value: 'withdrawal', label: 'Withdrawal - Funds withdrawn from the wallet' },
    { value: 'commission', label: 'Commission - Trading commission charged on a fill' },
    { value: 'conversion', label: 'Conversion - Currency or asset conversion entry' },
    { value: 'funding', label: 'Funding - Perpetual funding payment exchanged between long and short' },
    { value: 'settlement', label: 'Settlement - Wallet entry generated at contract settlement' },
    { value: 'liquidation_fee', label: 'Liquidation Fee - Fee charged when a position is liquidated' },
    { value: 'spot_trade', label: 'Spot Trade - Wallet entry from a spot trade' },
    { value: 'withdrawal_cancellation', label: 'Withdrawal Cancellation - Reversal of a previously requested withdrawal' },
    { value: 'referral_bonus', label: 'Referral Bonus - Bonus credited from the referral program' },
    { value: 'sub_account_transfer', label: 'Sub Account Transfer - Transfer between a main account and a subaccount' },
    { value: 'commission_rebate', label: 'Commission Rebate - Rebate paid back on previously charged commission' },
    { value: 'promo_credit', label: 'Promo Credit - Promotional credit added to the wallet' },
    { value: 'trading_credits', label: 'Trading Credits - Trading credits granted to the user' },
    { value: 'trading_credits_forfeited', label: 'Trading Credits Forfeited - Trading credits forfeited (e.g. on expiry)' },
    { value: 'trading_credits_paid', label: 'Trading Credits Paid - Trading credits applied toward trading fees' },
    { value: 'trading_fee_credits_paid_liquidation_fee', label: 'Trading Fee Credits Paid Liquidation Fee - Trading credits applied toward a liquidation fee' },
    { value: 'trading_credits_reverted', label: 'Trading Credits Reverted - Reversal of previously applied trading credits' },
    { value: 'interest_credit', label: 'Interest Credit - Interest credited on the wallet balance' },
    { value: 'external_deposit', label: 'External Deposit - Deposit from an external/off-exchange source' },
    { value: 'credit_line', label: 'Credit Line - Credit line adjustment on the wallet' },
    { value: 'trading_competition', label: 'Trading Competition - Wallet entry related to a trading competition' },
    { value: 'fund_deposit', label: 'Fund Deposit - Deposit into a managed fund' },
    { value: 'fund_withdrawal', label: 'Fund Withdrawal - Withdrawal from a managed fund' },
    { value: 'fund_wallet_deposit', label: 'Fund Wallet Deposit - Deposit into the fund wallet' },
    { value: 'fund_wallet_withdrawal', label: 'Fund Wallet Withdrawal - Withdrawal from the fund wallet' },
    { value: 'fund_reward', label: 'Fund Reward - Reward credited from a managed fund' },
    { value: 'trade_farming_reward', label: 'Trade Farming Reward - Reward credited from the trade farming program' },
    { value: 'revert', label: 'Revert - Reversal of a prior wallet transaction' },
    { value: 'raf_bonus', label: 'RAF Bonus - Refer-a-friend bonus credited to the wallet' },
    { value: 'fill_appropriation', label: 'Fill Appropriation - Adjustment from appropriation of a fill' },
    { value: 'incident_compensation', label: 'Incident Compensation - Compensation credited due to an incident' }
  ];

  // Data and UI state
  loading = false;
  error: string | null = null;
  hierarchyData: TreeNode[] = [];
  expandedNodes = new Set<string>();

  // Debug info for troubleshooting
  debugInfo: {
    dataSource: string;
    settlementAsset?: string;
    transactionCount?: number;
    message?: string;
  } = { dataSource: 'fills' };

  // Summary
  totalPnL = 0;
  totalFees = 0;
  totalNetPnL = 0;

  // Currency conversion
  USD_TO_INR = 85; // 1 USD = 85 INR

  private destroy$ = new Subject<void>();

  constructor(
    private pAndLService: PAndLService,
    private logger: LoggingService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPnLData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get default start date (30 days ago)
   */
  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get default end date (today)
   */
  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Load P&L data for the selected date range
   */
  async loadPnLData(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.hierarchyData = [];
    this.debugInfo = { dataSource: this.dataSource };
    this.cd.markForCheck();

    try {
      this.logger.info(`Loading P&L data from ${this.startDate} to ${this.endDate}`);

      const startDate = new Date(this.startDate + 'T00:00:00Z');
      const endDate = new Date(this.endDate + 'T23:59:59Z');

      // Get P&L data from selected source
      let months: any[];
      if (this.dataSource === 'transactions') {
        this.logger.info('[P&L] Loading P&L from wallet transactions');
        const filterInfo = this.selectedTransactionTypes.length > 0 
          ? `filtered to: ${this.selectedTransactionTypes.join(', ')}` 
          : 'all types included';
        this.debugInfo.message = `📊 Calculated from wallet transactions (${filterInfo})`;
        months = await this.pAndLService.getPnLFromWalletTransactions(
          startDate, 
          endDate,
          undefined,
          this.selectedTransactionTypes.length > 0 ? this.selectedTransactionTypes : undefined
        );
      } else {
        this.logger.info('[P&L] Loading P&L from fills');
        this.debugInfo.message = 'Calculated from all fills using FIFO matching';
        months = await this.pAndLService.getPnLForDateRange(startDate, endDate);
      }

      // Convert USD to INR
      const convertedMonths = this.convertCurrency(months);

      // Build tree nodes
      this.hierarchyData = this.buildTreeFromMonths(convertedMonths);

      // Calculate totals (already converted)
      const totals = this.pAndLService.calculateTotals(convertedMonths);
      this.totalPnL = totals.totalPnL;
      this.totalFees = totals.totalFees;
      this.totalNetPnL = totals.totalNetPnL;

      this.logger.debug('P&L data loaded:', {
        source: this.dataSource,
        months: convertedMonths.length,
        totalPnL: this.totalPnL,
        totalFees: this.totalFees,
        totalNetPnL: this.totalNetPnL
      });
    } catch (err: any) {
      this.error = err?.message || 'Failed to load P&L data';
      this.logger.error('Error loading P&L data:', err);
    } finally {
      this.loading = false;
      this.cd.markForCheck();
    }
  }

  /**
   * Toggle between fills-based and transactions-based P&L
   */
  toggleDataSource(source: 'fills' | 'transactions'): void {
    if (this.dataSource !== source) {
      this.logger.info(`Switching P&L source from ${this.dataSource} to ${source}`);
      this.dataSource = source;
      this.loadPnLData();
    }
  }

  /**
   * Convert all currency values from USD to INR recursively
   */
  private convertCurrency(months: MonthPnL[]): MonthPnL[] {
    return months.map(month => ({
      ...month,
      pnl: month.pnl * this.USD_TO_INR,
      fees: month.fees * this.USD_TO_INR,
      netPnL: month.netPnL * this.USD_TO_INR,
      weeks: month.weeks.map((week: WeekPnL) => ({
        ...week,
        pnl: week.pnl * this.USD_TO_INR,
        fees: week.fees * this.USD_TO_INR,
        netPnL: week.netPnL * this.USD_TO_INR,
        dates: week.dates.map((date: DatePnL) => ({
          ...date,
          pnl: date.pnl * this.USD_TO_INR,
          fees: date.fees * this.USD_TO_INR,
          netPnL: date.netPnL * this.USD_TO_INR,
          symbols: date.symbols.map((symbol: any) => ({
            ...symbol,
            pnl: symbol.pnl * this.USD_TO_INR,
            fees: symbol.fees * this.USD_TO_INR,
            netPnL: symbol.netPnL * this.USD_TO_INR
          }))
        }))
      }))
    }));
  }

  /**
   * Build tree nodes from hierarchical month data
   */
  private buildTreeFromMonths(months: MonthPnL[]): TreeNode[] {
    return months.map((month, idx) => ({
      id: `month-${idx}`,
      label: `Month: ${month.month}`,
      pnl: month.pnl,
      fees: month.fees,
      netPnL: month.netPnL,
      type: 'month',
      expanded: false,
      data: month,
      children: this.buildTreeFromWeeks(month.weeks, `month-${idx}`)
    }));
  }

  /**
   * Build tree nodes from week data
   */
  private buildTreeFromWeeks(weeks: WeekPnL[], parentId: string): TreeNode[] {
    return weeks.map((week, idx) => ({
      id: `${parentId}-week-${idx}`,
      label: `Week: ${week.week} (${week.startDate} to ${week.endDate})`,
      pnl: week.pnl,
      fees: week.fees,
      netPnL: week.netPnL,
      type: 'week',
      expanded: false,
      data: week,
      children: this.buildTreeFromDates(week.dates, `${parentId}-week-${idx}`)
    }));
  }

  /**
   * Build tree nodes from date data
   */
  private buildTreeFromDates(dates: DatePnL[], parentId: string): TreeNode[] {
    return dates.map((date, idx) => ({
      id: `${parentId}-date-${idx}`,
      label: `Date: ${date.date}`,
      pnl: date.pnl,
      fees: date.fees,
      netPnL: date.netPnL,
      type: 'date',
      expanded: false,
      data: date,
      children: this.buildTreeFromSymbols(date.symbols, `${parentId}-date-${idx}`)
    }));
  }

  /**
   * Build tree nodes from symbol data
   */
  private buildTreeFromSymbols(symbols: any[], parentId: string): TreeNode[] {
    return symbols.map((symbol, idx) => ({
      id: `${parentId}-symbol-${idx}`,
      label: `Symbol: ${symbol.symbol}`,
      pnl: symbol.pnl,
      fees: symbol.fees,
      netPnL: symbol.netPnL,
      type: 'symbol',
      expanded: false,
      data: symbol,
      children: [] // Symbols are leaf nodes
    }));
  }

  /**
   * Toggle expansion of a node
   */
  toggleExpanded(node: TreeNode): void {
    node.expanded = !node.expanded;
    if (node.expanded) {
      this.expandedNodes.add(node.id);
    } else {
      this.expandedNodes.delete(node.id);
    }
    this.cd.markForCheck();
  }

  /**
   * Check if a node is expanded
   */
  isExpanded(node: TreeNode): boolean {
    return node.expanded;
  }

  /**
   * Check if a node has children
   */
  hasChildren(node: TreeNode): boolean {
    return node.children && node.children.length > 0;
  }

  /**
   * Get icon for node type
   */
  getNodeIcon(node: TreeNode): string {
    switch (node.type) {
      case 'month': return '📅';
      case 'week': return '📆';
      case 'date': return '📍';
      case 'symbol': return '💱';
      default: return '📊';
    }
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  }

  /**
   * Get CSS class for P&L value (profit or loss)
   */
  getPnLClass(pnl: number): string {
    if (pnl > 0) return 'profit';
    if (pnl < 0) return 'loss';
    return '';
  }

  /**
   * Refresh data
   */
  refreshData(): void {
    this.loadPnLData();
  }

  /**
   * Set date range to last 7 days
   */
  setLast7Days(): void {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    this.startDate = start.toISOString().split('T')[0];
    this.endDate = end.toISOString().split('T')[0];
    this.loadPnLData();
  }

  /**
   * Set date range to last 30 days
   */
  setLast30Days(): void {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    this.startDate = start.toISOString().split('T')[0];
    this.endDate = end.toISOString().split('T')[0];
    this.loadPnLData();
  }

  /**
   * Set date range to current month
   */
  setCurrentMonth(): void {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = start.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
    this.loadPnLData();
  }
}
