import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeltaService } from '../../core/services/delta.service';
import { ConfigService } from '../../core/services/config.service';
import { TaskSchedulerService } from '../../core/services/task-scheduler.service';
import { TaskExecutorService } from '../../core/services/task-executor.service';
import { TargetStopLossManagerService } from '../../core/services/target-stoploss-manager.service';
import { LoggingService } from '../../core/services/logging.service';
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
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './positions.component.html',
})
export class PositionsComponent implements OnInit, OnDestroy {
  positions: Position[] = [];
  loading = false;
  error: string | null = null;

  // Trailing SL feature state
  trailingSLLoading = false;
  trailingSLResults: TrailingSLResult[] = [];
  showTrailingSLResults = false;
  updatingPositions: Set<string> = new Set(); // Track which positions are being updated

  // Placing targets state
  placingTargetsLoading = false;

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
      const data = await this.deltaService.getPositions();
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


  async placeTargetsAndStopLoss(): Promise<void> {
    if (!this.isScheduledExecution) {
      // Ask for confirmation only if not from scheduler
      const confirmed = confirm(
        `Place bracket orders for ${this.positions.length} position(s)? This will create stop loss and take profit orders. Don't ask this confirmation, execution via scheduler, it will accept all automatically & proceed the executions`
      );

      if (!confirmed) return;
    }

    this.placingTargetsLoading = true;
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
      const failCount = results.filter(r => !r.success).length;

      // Record the scheduled execution result
      if (this.isScheduledExecution) {
        this.logger.info('Recording scheduled task results');
        this.taskScheduler.recordTaskResults('place-target-stopLoss', {
          summary: `Placed target & stop loss for ${successCount}/${results.length} positions`,
          total: results.length,
          succeeded: successCount,
          failed: failCount,
          results: results
        });
      }

      // Show results to user
      this.logger.info(`Target & stop loss placement completed:`, results);
      this.error = `Placed target & stop loss for ${successCount}/${results.length} positions`;

      // Update UI with results
      this.cd.markForCheck();
    } catch (err: any) {
      this.error = err?.message || 'Failed to place target & stop loss orders';
      this.logger.error('Error in placeTargetsAndStopLoss:', err);
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

  getRowClass(pos: Position): string {
    if (this.updatingPositions.has(pos.symbol)) {
      return 'updating';
    }
    return pos.pnl > 0 ? 'profit' : pos.pnl < 0 ? 'loss' : '';
  }

  isUpdating(symbol: string): boolean {
    return this.updatingPositions.has(symbol);
  }
}
