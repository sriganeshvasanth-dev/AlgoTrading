// Positions component - displays open positions and allows position management
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeltaService } from '../../core/services/delta.service';
import { ConfigService } from '../../core/services/config.service';
import { TaskSchedulerService } from '../../core/services/task-scheduler.service';
import { TaskExecutorService } from '../../core/services/task-executor.service';
import { TargetStopLossManagerService, TargetStopLossResult } from '../../core/services/target-stoploss-manager.service';
import { LoggingService } from '../../core/services/logging.service';
import { PlacementResultsSummaryComponent } from './placement-results-summary.component.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

type Position = {
  symbol: string;
  size: number;
  entry_price: number;
  mark_price: number;
  pnl: number;
  pnl_percentage: number;
  liquidation_price?: number;
  leverage?: number;
  margin?: number;
  [key: string]: any;
};

type TrailingSLResult = {
  symbol: string;
  success: boolean;
  message: string;
  orderId?: string;
};

type AppConfig = {
  schedulerEnabled: boolean;
  taskSchedules: {
    placeTargetStopLoss: any;
    updateTrailingStopLoss: any;
  };
  [key: string]: any;
};

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [CommonModule, FormsModule, PlacementResultsSummaryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.css']
})
export class PositionsComponent implements OnInit, OnDestroy {
  positions: Position[] = [];
  loading = false;
  error: string | null = null;
  statusMessage: string | null = null; // For informational messages (not errors)

  // Trailing SL feature state
  trailingSLLoading = false;
  trailingSLResults: TrailingSLResult[] = [];
  showTrailingSLResults = false;
  updatingPositions: Set<string> = new Set(); // Track which positions are being updated

  // Placing targets state
  placingTargetsLoading = false;
  placementResults: TargetStopLossResult[] = [];
  showPlacementResults = false;

  // Move SL to Entry state
  moveSlToEntryResults: any[] = [];
  showMoveSlToEntryResults = false;

  // Scheduler state
  private schedulerInterval: any = null;
  isScheduledExecution = false; // Flag to indicate if execution is from scheduler
  private destroy$ = new Subject<void>();

  constructor(
    private deltaService: DeltaService,
    private cd: ChangeDetectorRef,
    private configService: ConfigService,
    private taskScheduler: TaskSchedulerService,
    private taskExecutorService: TaskExecutorService,
    private targetStopLossManager: TargetStopLossManagerService,
    private logger: LoggingService
  ) {}

  ngOnInit(): void {
    // Do NOT auto-load positions on page init
    // User must explicitly click "Refresh Positions" button to load
    // This prevents unwanted automatic execution of workflows
    this.setupTaskScheduler();
  }

  ngOnDestroy(): void {
    // Clean up timers when component is destroyed
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup task scheduler with Place Target & StopLoss and Update Trailing SL tasks
   */
  private setupTaskScheduler(): void {
    const config = this.configService.getConfig();

    console.log('📋 Setting up task scheduler - schedulerEnabled:', config.schedulerEnabled, 'with task configs:', config.taskSchedules);
    console.log('📋 [Positions] Initial updateTrailingStopLoss config:', {
      enabled: config.taskSchedules.updateTrailingStopLoss.enabled,
      dailyTime: config.taskSchedules.updateTrailingStopLoss.dailyTime,
      scheduleType: config.taskSchedules.updateTrailingStopLoss.scheduleType
    });

    // Register tasks regardless of schedulerEnabled flag
    // Individual task.enabled flags will control if they run
    // Register Place Target & StopLoss task (every 2 hours)
    const placeTargetExecutor = async () => {
      console.log('[PlaceTargetSL] Starting task execution');
      // Mark this as scheduled execution (no confirmation needed)
      this.isScheduledExecution = true;
      await this.placeTargetsAndStopLoss();
    };

    // Register with scheduler AND with TaskExecutorService so Dashboard can find it
    this.taskScheduler.registerTask(
      'place-target-stopLoss',
      'Place Target & StopLoss',
      placeTargetExecutor,
      config.taskSchedules.placeTargetStopLoss
    );
    console.log('✅ [Positions] Registered place-target-stopLoss task with REAL executor (replacing stub)');

    // Register the real executor with TaskExecutorService so Dashboard can find it
    this.taskExecutorService.registerPlaceTargetStopLossExecutor(placeTargetExecutor);
    console.log('✅ [Positions] Registered real executor in TaskExecutorService for place-target-stopLoss');

    // Register Update Trailing StopLoss task
    // Create the real executor that will be called
    const updateTrailingExecutor = async () => {
      console.log('[UpdateTrailingSL] Starting task execution');
      // Mark this as scheduled execution
      this.isScheduledExecution = true;
      await this.updateAllTrailingStopLoss();
    };

    // Register the task with real executor (replaces Dashboard stub)
    console.log('✅ [Positions] Registering update-trailing-stopLoss task with REAL executor (replacing stub)');
    this.taskScheduler.registerTask(
      'update-trailing-stopLoss',
      'Update Trailing StopLoss',
      updateTrailingExecutor,
      config.taskSchedules.updateTrailingStopLoss
    );

    // Register the real executor with TaskExecutorService so Dashboard can find it
    this.taskExecutorService.registerUpdateTrailingStopLossExecutor(updateTrailingExecutor);
    console.log('✅ [Positions] Registered real executor in TaskExecutorService for update-trailing-stopLoss');

    console.log('✅ [Positions] Real executors registered for both place-target-stopLoss and update-trailing-stopLoss', {
      placeTargetEnabled: config.taskSchedules.placeTargetStopLoss.enabled,
      updateTrailingEnabled: config.taskSchedules.updateTrailingStopLoss.enabled
    });

    // Subscribe to config changes and update task configurations
    this.configService.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe((updatedConfig: AppConfig) => {
        console.log('📋 [Positions] Config update received:');
        console.log('  - placeTargetStopLoss:', updatedConfig.taskSchedules.placeTargetStopLoss);
        console.log('  - updateTrailingStopLoss:', updatedConfig.taskSchedules.updateTrailingStopLoss);

        this.taskScheduler.updateTaskConfig('place-target-stopLoss', updatedConfig.taskSchedules.placeTargetStopLoss);
        console.log('✅ [Positions] Called updateTaskConfig for place-target-stopLoss');

        this.taskScheduler.updateTaskConfig('update-trailing-stopLoss', updatedConfig.taskSchedules.updateTrailingStopLoss);
        console.log('✅ [Positions] Called updateTaskConfig for update-trailing-stopLoss with:', {
          enabled: updatedConfig.taskSchedules.updateTrailingStopLoss.enabled,
          dailyTime: updatedConfig.taskSchedules.updateTrailingStopLoss.dailyTime
        });
      });
  }

  /**
   * Set up the daily scheduler to trigger trailing SL updates at 12:05 AM (for backward compatibility)

   /**
    * Load positions with a promise wrapper
    */
   private loadPositionsPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loading = true;
      this.error = null;
      this.cd.markForCheck();

      this.deltaService.getPositions().then(
        (data: any[]) => {
          this.positions = data || [];
          this.loading = false;
          this.error = null;
          this.cd.markForCheck();
          resolve();
        },
        (err: any) => {
          this.loading = false;
          this.cd.markForCheck();
          reject(err);
        }
      );
    });
  }

  async loadPositions(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.cd.markForCheck();

    try {
      // Use getPositionsRefresh() to bypass cache for manual refresh
      const data = await this.deltaService.getPositionsRefresh();
      this.positions = data || [];
      this.error = null;
    } catch (err: any) {
      this.error = err?.message || 'Failed to load positions';
      console.error('❌ Error loading positions:', err);
    } finally {
      this.loading = false;
      this.cd.markForCheck();
    }
  }

  getTotalPnl(): number {
    return this.positions.reduce((sum: number, pos: Position) => sum + pos.pnl, 0);
  }

  /**
   * Get USD to INR conversion rate from config
   */
  private getUsdToInrRate(): number {
    const config = this.configService.getConfig();
    return config.usdToInr || 85; // Default to 85 if not set
  }

  /**
   * Convert USD value to INR
   */
  convertToInr(usdValue: number): number {
    return usdValue * this.getUsdToInrRate();
  }

  /**
   * Get total PnL in INR (converted from USD)
   */
  getTotalPnlInInr(): number {
    const totalPnlInUsd = this.getTotalPnl();
    return this.convertToInr(totalPnlInUsd);
  }


  async placeTargetsAndStopLoss(): Promise<void> {
    if (!this.isScheduledExecution) {
      // Ask for confirmation only if not from scheduler
      const confirmed = confirm(
        `Place bracket orders for ${this.positions.length} position(s)? This will create stop loss and take profit orders. Don't ask this confirmation, execution via scheduler, it will accept all automatically & proceed the executions`
      );

      if (!confirmed) return;
    }

    this.placingTargetsLoading = true;
    this.showPlacementResults = false;
    this.placementResults = [];
    this.error = null;
    this.cd.markForCheck();

    this.logger.info(`Starting target & stop loss placement for ${this.positions.length} positions`);

    try {
      // Use the new TargetStopLossManagerService which handles:
      // 1. Getting open positions (via getPositions)
      // 2. Checking existing orders for each product
      // 3. Placing bracket orders (stop loss + take profit)
      // 4. Placing half-quantity limit orders as additional targets
      const results = await this.targetStopLossManager.placeTargetsAndStopLossForAllPositions();

      const successCount = results.filter(r => r.success).length;
      const skippedCount = results.filter(r => !r.success && r.message?.includes('Skipped')).length;
      const actualFailCount = results.filter(r => !r.success && !r.message?.includes('Skipped')).length;

      // Store results for display in summary component (popup)
      this.placementResults = results;

      // Only show popup if this was manual execution (not from scheduler)
      this.showPlacementResults = !this.isScheduledExecution;

      // Record the scheduled execution result
      if (this.isScheduledExecution) {
        this.logger.info('Recording scheduled task results');
        this.taskScheduler.recordTaskResults('place-target-stopLoss', {
          summary: `Placed target & stop loss for ${successCount}/${results.length} positions (${skippedCount} skipped, ${actualFailCount} failed)`,
          total: results.length,
          succeeded: successCount,
          skipped: skippedCount,
          failed: actualFailCount,
          results: results
        });
      }

      // Show summary to user with detailed breakdown
      this.logger.info(`Target & stop loss placement completed:`, results);

      // Build comprehensive status message (always show this in header, not popup)
      let statusMsg = '';
      if (successCount > 0) {
        statusMsg += `✅ Successfully placed orders for ${successCount} position(s)`;
      }
      if (skippedCount > 0) {
        statusMsg += `${statusMsg ? ' | ' : ''}⏭️ Skipped ${skippedCount} position(s) with existing orders`;
      }
      if (actualFailCount > 0) {
        statusMsg += `${statusMsg ? ' | ' : ''}❌ Failed to place orders for ${actualFailCount} position(s)`;
      }

      this.statusMessage = statusMsg || 'No positions were processed';

      // Update UI with results
      this.cd.markForCheck();
    } catch (err: any) {
      this.error = err?.message || 'Failed to place target & stop loss orders';
      this.statusMessage = null;
      this.logger.error('Error in placeTargetsAndStopLoss:', err);
      this.placementResults = [];
      this.showPlacementResults = false;
    } finally {
      this.placingTargetsLoading = false;
      this.isScheduledExecution = false;
      this.cd.markForCheck();
    }
  }

  async updateAllTrailingStopLoss(): Promise<void> {
    if (!this.isScheduledExecution) {
      // Ask for confirmation only if not from scheduler
      const confirmed = confirm(
        `Update trailing stop loss for ${this.positions.length} position(s)? This will attempt to update your stop loss orders.`
      );

      if (!confirmed) return;
    }

    this.trailingSLLoading = true;
    this.trailingSLResults = [];
    this.showTrailingSLResults = false;
    this.error = null;
    this.cd.markForCheck();

    console.log('[UpdateTrailingSL] Starting update for', this.positions.length, 'positions');

    try {
      // No positions case - still need to record result for scheduler
      if (this.positions.length === 0) {
        console.log('[UpdateTrailingSL] ⚠️  No positions to update');

        if (this.isScheduledExecution) {
          this.taskScheduler.recordTaskResults('update-trailing-stopLoss', {
            summary: 'No positions to update',
            total: 0,
            succeeded: 0,
            failed: 0,
            results: [{ symbol: 'N/A', success: true, message: 'No positions available' }]
          });
        }

        this.trailingSLResults = [{ symbol: 'N/A', success: true, message: 'No positions to update' }];
        this.showTrailingSLResults = true;
        this.cd.markForCheck();
        return;
      }

      const results: Array<{ symbol: string; success: boolean; message: string; orderId?: string }> = [];

      for (const position of this.positions) {
        await this.updateSingleTrailingSL(position);

        // Collect result from the execution
        const result = this.trailingSLResults[this.trailingSLResults.length - 1];
        if (result) {
          results.push(result);
        }
      }

      // Record the scheduled execution result
      if (this.isScheduledExecution) {
        console.log('[UpdateTrailingSL] Recording scheduled task results');
        this.taskScheduler.recordTaskResults('update-trailing-stopLoss', {
          summary: `Updated trailing SL for ${results.filter(r => r.success).length}/${results.length} positions`,
          total: results.length,
          succeeded: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results: results
        });
      }

      this.showTrailingSLResults = true;
      console.log('📊 [UpdateTrailingSL] Final results:', this.trailingSLResults);
    } catch (err: any) {
      this.error = err?.message || 'Failed to update trailing stop loss';
      console.error('❌ Error in updateAllTrailingStopLoss:', err);

      if (this.isScheduledExecution) {
        this.taskScheduler.recordTaskResults('update-trailing-stopLoss', {
          summary: 'Error during trailing SL update',
          error: err?.message,
          results: [{ symbol: 'ERROR', success: false, message: err?.message || 'Unknown error' }]
        });
      }
    } finally {
      this.trailingSLLoading = false;
      this.isScheduledExecution = false;
      this.cd.markForCheck();
    }
  }

  async updateSingleTrailingSL(pos: Position): Promise<void> {
    try {
      this.updatingPositions.add(pos.symbol);
      this.cd.markForCheck();

      console.log(`[UpdateTrailingSL] Updating ${pos.symbol}...`);

      const result = await this.deltaService.updateTrailingStopLoss(pos);

      this.trailingSLResults.push({
        symbol: pos.symbol,
        success: result?.success !== false,
        message: result?.message || 'Stop loss updated'
      });

      console.log(`✅ [UpdateTrailingSL] ${pos.symbol} completed:`, result);
    } catch (err: any) {
      this.trailingSLResults.push({
        symbol: pos.symbol,
        success: false,
        message: err?.message || 'Failed to update stop loss'
      });
      console.error(`❌ [UpdateTrailingSL] ${pos.symbol} failed:`, err);
    } finally {
      this.updatingPositions.delete(pos.symbol);
      this.cd.markForCheck();
    }
  }

  closeTrailingSLResults(): void {
    this.showTrailingSLResults = false;
    this.trailingSLResults = [];
    this.cd.markForCheck();
  }

  closeMoveSlToEntryResults(): void {
    this.showMoveSlToEntryResults = false;
    this.moveSlToEntryResults = [];
    this.cd.markForCheck();
  }

  getRowClass(pos: Position): string {
    if (this.updatingPositions.has(pos.symbol)) {
      return 'updating';
    }
    return pos.pnl > 0 ? 'profit' : pos.pnl < 0 ? 'loss' : '';
  }

  isUpdating(symbol: string): boolean {
    return this.updatingPositions.has(symbol);
  }

  /**
   * Calculate summary stats from placement results
   */
  getPlacementSummary(): { success: number; skipped: number; failed: number } {
    return {
      success: this.placementResults.filter(r => r.success).length,
      skipped: this.placementResults.filter(r => !r.success && r.message?.includes('Skipped')).length,
      failed: this.placementResults.filter(r => !r.success && !r.message?.includes('Skipped')).length
    };
  }

  /**
   * Close the placement results summary
   */
  closePlacementResults(): void {
    this.showPlacementResults = false;
    this.cd.markForCheck();
  }

  /**
   * Move stop loss to entry price for positions without standalone limit orders
   * Fetches all pending standalone limit orders ONCE, then checks each position against that list
   * For positions without limit orders, updates their stop loss to entry price using bufferMultiplier
   * This is more efficient than checking each symbol individually
   */
  async moveStopLossToEntry(): Promise<void> {
    const startTime = performance.now();
    this.loading = true;
    this.error = '';
    this.statusMessage = 'Checking positions and updating stop loss...';
    this.cd.markForCheck();

    try {
      // Fetch all open positions, pending standalone limit orders, and pending stop market orders in parallel
      const [allPositions, standaloneOrders, stopMarketOrders] = await Promise.all([
        this.deltaService.getPositions(),
        this.deltaService.getAllPendingStandaloneLimitOrders(),
        this.deltaService.getAllPendingStopMarketOrders()
      ]);

      console.log('[MoveSlToEntry] Fetched ' + allPositions.length + ' positions, ' + standaloneOrders.length + ' standalone limit orders, and ' + stopMarketOrders.length + ' stop market orders');

      if (!allPositions || allPositions.length === 0) {
        this.statusMessage = 'No open positions found';
        console.log('[MoveSlToEntry] No open positions found');
        return;
      }

      const positionsWithoutLimitOrders: any[] = [];
      const positionsWithLimitOrders: any[] = [];

      // Check each position for standalone limit orders using the pre-fetched list
      for (const position of allPositions) {
        const symbol = position.product_symbol || position.symbol;
        const hasLimit = this.deltaService.hasStandaloneLimitOrderBySymbol(symbol, standaloneOrders);

        if (hasLimit) {
          positionsWithLimitOrders.push(position);
        } else {
          positionsWithoutLimitOrders.push(position);
        }
      }

      // Update stop loss for positions without limit orders
      if (positionsWithoutLimitOrders.length > 0) {
        const updateResults: any[] = [];
        for (const position of positionsWithoutLimitOrders) {
          const result = await this.updateStopLossToEntry(position, stopMarketOrders);
          updateResults.push(result);
        }

        // Store results for display
        this.moveSlToEntryResults = updateResults;
        this.showMoveSlToEntryResults = true;

      } else {
        console.log('[MoveSlToEntry] All positions have standalone limit orders! OK');
      }

      console.log('[MoveSlToEntry] ===========================================');

      const endTime = performance.now();
      const successCount = positionsWithoutLimitOrders.filter(p => p).length;
      this.statusMessage = 'Updated stop loss for ' + successCount + ' positions (checked ' + allPositions.length + ' positions in ' + Math.round(endTime - startTime) + 'ms)';
      console.log('[MoveSlToEntry] Completed in ' + Math.round(endTime - startTime) + 'ms');

    } catch (err: any) {
      this.error = err?.message || 'Failed to check positions';
      console.error('[MoveSlToEntry] Error:', err);
    } finally {
      this.loading = false;
      this.cd.markForCheck();
    }
  }

  /**
   * Update stop loss to entry price for a single position
   * Buy StopLoss price = Math.Max(Entry Price (1 + bufferMultiplier%), prev3Low(1 - bufferMultiplier%))
   * Sell StopLoss price = Math.Min(Entry Price (1 - bufferMultiplier%), prev3High(1 + bufferMultiplier%))
   */
  private async updateStopLossToEntry(position: any, stopMarketOrders: any[]): Promise<any> {
    const symbol = position.product_symbol || position.symbol;

    try {
      console.log('[MoveSlToEntry] Updating stop loss for ' + symbol);

      // Determine position side
      const positionSize = parseFloat(position.size || 0);
      const isBuyPosition = positionSize > 0;
      const positionType = isBuyPosition ? 'BUY' : 'SELL';

      // Get entry price and buffer configuration
      const entryPrice = parseFloat(position.entry_price || 0);
      const bufferPercentage = this.configService.getConfigValue('bufferPercentage');
      const bufferMultiplier = 1 + (bufferPercentage / 100);

      // Fetch 3-day candle data to get prev3High and prev3Low
      const now = Date.now();
      const toSec = Math.floor(now / 1000);
      const fromSec = toSec - 60 * 60 * 24 * 4; // Get 4 days of data to ensure we have 3 days

      const candleData = await this.deltaService.getCandles(symbol, '1d', fromSec, toSec);

      const candleArr = (Array.isArray(candleData) ? candleData : (candleData as any)?.candles ?? []) as any[];
      if (!candleArr || candleArr.length < 2) {
        console.log('[MoveSlToEntry] Insufficient candle data, using entry price only');
        // Fallback to entry price only if candle data is insufficient
        let slPrice: number;
        const bufferDecimal = bufferPercentage / 100;
        if (isBuyPosition) {
          slPrice = Math.round(entryPrice * (1 + bufferDecimal) * 100) / 100;
        } else {
          slPrice = Math.round(entryPrice * (1 - bufferDecimal) * 100) / 100;
        }

        console.log('[MoveSlToEntry] ' + symbol + ' (' + positionType + '): Entry=' + entryPrice + ', New SL=' + slPrice + ' (no candle data)');

        return await this.deltaService.updateStopLossToEntryPrice(position, slPrice, stopMarketOrders);
      }

      // Sort candles by time and get the previous 3 days (excluding current day)
      candleArr.sort((a: any, b: any) => {
        const aTime = Array.isArray(a) ? a[0] : (a.time ?? a.t ?? 0);
        const bTime = Array.isArray(b) ? b[0] : (b.time ?? b.t ?? 0);
        return aTime - bTime;
      });

      // Get previous 3 days (exclude the latest/current candle)
      const prev3Candles = candleArr.length > 3 ? candleArr.slice(-4, -1) : candleArr.slice(0, -1);

      if (prev3Candles.length === 0) {
        console.log('[MoveSlToEntry] Insufficient historical candle data');
        let slPrice: number;
        const bufferDecimal = bufferPercentage / 100;
        if (isBuyPosition) {
          slPrice = Math.round(entryPrice * (1 + bufferDecimal) * 100) / 100;
        } else {
          slPrice = Math.round(entryPrice * (1 - bufferDecimal) * 100) / 100;
        }
        return await this.deltaService.updateStopLossToEntryPrice(position, slPrice, stopMarketOrders);
      }

      // Extract high and low from candles
      const prev3High = Math.max(...prev3Candles.map((c: any) => parseFloat(Array.isArray(c) ? c[2] : (c.high ?? c.h ?? 0))));
      const prev3Low = Math.min(...prev3Candles.map((c: any) => parseFloat(Array.isArray(c) ? c[3] : (c.low ?? c.l ?? 0))));

      console.log('[MoveSlToEntry] ' + symbol + ' - Candle data: High=' + prev3High + ', Low=' + prev3Low);

      // Calculate stop loss using the new formula
      let slPrice: number;
      if (isBuyPosition) {
        // Buy StopLoss price = Math.Max(Entry Price (1 + bufferMultiplier%), prev3Low(1 - bufferMultiplier%))
        const bufferDecimal = bufferPercentage / 100;
        const slFromEntry = entryPrice * (1 + bufferDecimal);
        const slFromLow = prev3Low * (1 - bufferDecimal);
        slPrice = Math.max(slFromEntry, slFromLow);
        console.log('[MoveSlToEntry] ' + symbol + ' (BUY): Entry=' + entryPrice + ', SL from Entry=' + slFromEntry + ', SL from Low=' + slFromLow);
      } else {
        // Sell StopLoss price = Math.Min(Entry Price (1 - bufferMultiplier%), prev3High(1 + bufferMultiplier%))
        const bufferDecimal = bufferPercentage / 100;
        const slFromEntry = entryPrice * (1 - bufferDecimal);
        const slFromHigh = prev3High * (1 + bufferDecimal);
        slPrice = Math.min(slFromEntry, slFromHigh);
        console.log('[MoveSlToEntry] ' + symbol + ' (SELL): Entry=' + entryPrice + ', SL from Entry=' + slFromEntry + ', SL from High=' + slFromHigh);
      }

      // Round to 2 decimal places to avoid floating-point precision issues
      slPrice = Math.round(slPrice * 100) / 100;
      console.log('[MoveSlToEntry] ' + symbol + ' (' + positionType + '): Final SL=' + slPrice);

      // Call service to update the stop loss order
      const result = await this.deltaService.updateStopLossToEntryPrice(position, slPrice, stopMarketOrders);

      return {
        success: result?.success !== false,
        symbol: symbol,
        message: result?.message || 'Stop loss updated successfully',
        oldPrice: result?.oldPrice,
        newPrice: slPrice
      };

    } catch (err: any) {
      console.error('[MoveSlToEntry] Error updating ' + symbol + ':', err);
      return {
        success: false,
        symbol: symbol,
        message: err?.message || 'Failed to update stop loss'
      };
    }
  }
}
