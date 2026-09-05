import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeltaService, PlaceBracketOrderResult } from '../../core/services/delta.service';
import { ConfigService } from '../../core/services/config.service';
import { TaskSchedulerService } from '../../core/services/task-scheduler.service';
import { TaskExecutorService } from '../../core/services/task-executor.service';
import { TargetStopLossManagerService } from '../../core/services/target-stoploss-manager.service';
import { LoggingService } from '../../core/services/logging.service';
import { TaskStatusComponent } from '../task-status/task-status.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

type Crossed = {
  symbol: string;
  crossedType: 'HIGH' | 'LOW';
  price: number;
  prev3High: number;
  prev3Low: number;
  quotingAsset?: string; // To identify USD-quoted products
  contractValue?: number; // Lot size for quantity calculation
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskStatusComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',

})
export class DashboardComponent implements OnInit, OnDestroy {
  items: Crossed[] = [];
  loading = false;
  progress = 0;
  total = 0;
  minPrice = 5;

  showOrderModal = false;
  placingOrder = false;
  orderError: string | null = null;
  orderSuccess: string | null = null;
  selectedItem: Crossed | null = null;

  orderForm: {
    side: 'buy' | 'sell';
    riskAmountInr: number;
    quantity: number | null;
    useManualQuantity: boolean;
  } = {
    side: 'buy',
    riskAmountInr: 2500,
    quantity: null,
    useManualQuantity: false
  };

  // Limit order modal properties
  showLimitOrderModal = false;
  limitOrderCandidates: Crossed[] = [];
  limitOrderSelections: Map<string, { side: 'buy' | 'sell'; riskAmountInr: number }> = new Map();
  limitOrderCandlesTodayMap: { [symbol: string]: { todayHigh: number; todayLow: number } } = {};
  limitOrderSelectedOrders: Set<string> = new Set(); // Track selected orders by "symbol:crossedType" key
  loadingLimitOrderCandidates = false;
  limitOrderError: string | null = null;
  limitOrderSuccess: string | null = null;
  isScheduledExecution = false; // Flag to indicate if execution is from scheduler
  appInitialized = false; // Flag to prevent task execution during app initialization

  // Cleanup target orders properties
  cleaningUpOrders = false;
  cleanupError: string | null = null;
  cleanupSuccess: string | null = null;
  cleanupResults: { cancelled: number; total: number; details: any[] } | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private svc: DeltaService,
    private cdr: ChangeDetectorRef,
    private configService: ConfigService,
    private taskScheduler: TaskSchedulerService,
    private taskExecutorService: TaskExecutorService,
    private targetStopLossManager: TargetStopLossManagerService,
    private logger: LoggingService
  ) {}

  ngOnInit(): void {
    // Load config values
    const config = this.configService.getConfig();
    this.minPrice = config.minimumPrice;
    this.orderForm.riskAmountInr = config.riskAmountInr;

    // CRITICAL: Add delay before setting up task scheduler
    // This prevents app hang when scheduler tries to execute tasks on app startup
    // Wait 1 second for app initialization to fully complete
    setTimeout(() => {
      this.setupTaskScheduler();
      // Mark app as initialized after scheduler setup
      this.appInitialized = true;
    }, 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup task scheduler for Place Limit Order and Update Trailing StopLoss tasks
   * CRITICAL: Wrapped in try-catch to prevent app hang if task registration fails
   */
  private setupTaskScheduler(): void {
    try {
      const config = this.configService.getConfig();

      console.log('📋 Setting up task scheduler - schedulerEnabled:', config.schedulerEnabled, 'with task configs:', config.taskSchedules);

      // Register tasks regardless of schedulerEnabled flag
    // Individual task.enabled flags will control if they run

    const placeOrderConfig = config.taskSchedules.placeLimitOrder;
    console.log('📋 [Dashboard] Registering Place Limit Order task with config:', {
      enabled: placeOrderConfig.enabled,
      scheduleType: placeOrderConfig.scheduleType,
      dailyTime: placeOrderConfig.dailyTime,
      retryOnFailure: placeOrderConfig.retryOnFailure,
      maxRetries: placeOrderConfig.maxRetries
    });

    // Register Place Limit Order task (daily at 12:05 AM)
    this.taskScheduler.registerTask(
      'place-limit-order',
      'Place Limit Order',
      async () => {
        console.log('🚀 [PlaceLimitOrder] Starting task execution');
        console.log('[PlaceLimitOrder] Current candidates count:', this.limitOrderCandidates.length);

        try {
          // Mark this as scheduled execution (no confirmation needed)
          this.isScheduledExecution = true;

          // If no candidates are loaded, try to load them first
          if (this.limitOrderCandidates.length === 0) {
            console.log('📊 [PlaceLimitOrder] No candidates loaded, attempting to load...');
            await this.loadLimitOrderCandidates();
            console.log('[PlaceLimitOrder] After loading, candidates count:', this.limitOrderCandidates.length);
          }

          // Execute limit orders for all candidates
          if (this.limitOrderCandidates.length > 0) {
            console.log('📊 [PlaceLimitOrder] Executing orders for', this.limitOrderCandidates.length, 'candidates');
            const startTime = performance.now();

            // Add 60-second timeout to prevent hanging on mobile
            await Promise.race([
              this.placeLimitOrdersAll(),
              new Promise<void>((_, reject) => 
                setTimeout(() => reject(new Error('Limit order placement timeout - exceeded 60 seconds')), 60000)
              )
            ]);

            const endTime = performance.now();
            console.log('✅ [PlaceLimitOrder] Orders executed successfully in', Math.round(endTime - startTime), 'ms');
          } else {
            console.warn('⚠️  [PlaceLimitOrder] No candidates available after load attempt');
            console.log('[PlaceLimitOrder] Possible causes:');

            console.log('  1. Market scanner has not been run');
            console.log('  2. No symbols meet the scanning criteria');
            console.log('  3. Network error while loading');
          }
        } catch (error) {
          console.error('❌ [PlaceLimitOrder] Task execution failed:', error);
          throw error; // Re-throw so scheduler can log it as error
        }
      },
      config.taskSchedules.placeLimitOrder
    );

    console.log('✅ [Dashboard] Registered place-limit-order task');

    // IMPORTANT: Register REAL tasks for place-target-stopLoss and update-trailing-stopLoss
    // These use TargetStopLossManagerService directly, so they work immediately
    // without needing PositionsComponent to be loaded first

    // Register Place Target & StopLoss task with REAL executor
    const placeTargetSlConfig = config.taskSchedules.placeTargetStopLoss;
    console.log('📋 [Dashboard] Registering REAL executor task for place-target-stopLoss:', {
      enabled: placeTargetSlConfig.enabled,
      scheduleType: placeTargetSlConfig.scheduleType,
      dailyTime: placeTargetSlConfig.dailyTime
    });

    const placeTargetExecutor = async () => {
      console.log('[Dashboard] place-target-stopLoss executor called - calling TargetStopLossManagerService');
      try {
        // Call the real service directly with 60-second timeout to prevent hanging on mobile
        const results = await Promise.race([
          this.targetStopLossManager.placeTargetsAndStopLossForAllPositions(),
          new Promise<any[]>((_, reject) => 
            setTimeout(() => reject(new Error('Job execution timeout - exceeded 60 seconds')), 60000)
          )
        ]);

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        // Record the scheduled execution result
        this.logger.info('Recording scheduled task results');
        this.taskScheduler.recordTaskResults('place-target-stopLoss', {
          summary: `Placed target & stop loss for ${successCount}/${results.length} positions`,
          total: results.length,
          succeeded: successCount,
          failed: failCount,
          results: results
        });

        this.logger.info('✅ place-target-stopLoss execution completed:', results);
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to place target & stop loss orders';
        this.logger.error('❌ Error in place-target-stopLoss:', err);
        this.taskScheduler.recordTaskResults('place-target-stopLoss', {
          summary: 'Error placing target & stop loss',
          error: errorMsg,
          results: [{ symbol: 'N/A', success: false, message: errorMsg }]
        });
      }
    };

    this.taskScheduler.registerTask(
      'place-target-stopLoss',
      'Place Target & StopLoss',
      placeTargetExecutor,
      placeTargetSlConfig
    );

    // Also register with TaskExecutorService so if PositionsComponent loads, it can replace this
    this.taskExecutorService.registerPlaceTargetStopLossExecutor(placeTargetExecutor);
    console.log('✅ [Dashboard] Registered REAL executor task for place-target-stopLoss');

    // Register Update Trailing StopLoss task with REAL executor
    const trailingSlConfig = config.taskSchedules.updateTrailingStopLoss;
    console.log('📋 [Dashboard] Registering REAL executor task for update-trailing-stopLoss:', {
      enabled: trailingSlConfig.enabled,
      scheduleType: trailingSlConfig.scheduleType,
      dailyTime: trailingSlConfig.dailyTime,
      retryOnFailure: trailingSlConfig.retryOnFailure,
      maxRetries: trailingSlConfig.maxRetries
    });

    const updateTrailingExecutor = async () => {
      console.log('[Dashboard] update-trailing-stopLoss executor called - loading positions from DeltaService');
      try {
        // Load the positions from DeltaService
        const positions = await this.svc.getPositions();

        if (!positions || positions.length === 0) {
          console.log('[Dashboard] No positions to update');
          this.taskScheduler.recordTaskResults('update-trailing-stopLoss', {
            summary: 'No positions to update',
            total: 0,
            succeeded: 0,
            failed: 0,
            results: [{ symbol: 'N/A', success: true, message: 'No positions available' }]
          });
          return;
        }

        console.log('[Dashboard] Updating trailing stop loss for ' + positions.length + ' positions');
        const results: Array<{ symbol: string; success: boolean; message: string }> = [];

        // Update each position's trailing stop loss
        for (const position of positions) {
          try {
            console.log(`[UpdateTrailingSL] Updating ${position.symbol}...`);
            const result = await this.svc.updateTrailingStopLoss(position);

            results.push({
              symbol: position.symbol,
              success: result?.success !== false,
              message: result?.message || 'Stop loss updated'
            });

            console.log(`✅ [UpdateTrailingSL] ${position.symbol} completed:`, result);
          } catch (err: any) {
            results.push({
              symbol: position.symbol,
              success: false,
              message: err?.message || 'Failed to update stop loss'
            });
            console.error(`❌ [UpdateTrailingSL] ${position.symbol} failed:`, err);
          }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        // Record the scheduled execution result
        this.logger.info('Recording scheduled task results for updateTrailingStopLoss');
        this.taskScheduler.recordTaskResults('update-trailing-stopLoss', {
          summary: `Updated trailing SL for ${successCount}/${results.length} positions`,
          total: results.length,
          succeeded: successCount,
          failed: failCount,
          results: results
        });

        this.logger.info('✅ update-trailing-stopLoss execution completed:', results);
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to update trailing stop loss';
        this.logger.error('❌ Error in update-trailing-stopLoss:', err);
        this.taskScheduler.recordTaskResults('update-trailing-stopLoss', {
          summary: 'Error updating trailing stop loss',
          error: errorMsg,
          results: [{ symbol: 'N/A', success: false, message: errorMsg }]
        });
      }
    };

    this.taskScheduler.registerTask(
      'update-trailing-stopLoss',
      'Update Trailing StopLoss',
      updateTrailingExecutor,
      trailingSlConfig
    );

    // Also register with TaskExecutorService so if PositionsComponent loads, it can replace this
    this.taskExecutorService.registerUpdateTrailingStopLossExecutor(updateTrailingExecutor);
    console.log('✅ [Dashboard] Registered REAL executor task for update-trailing-stopLoss');

    // Subscribe to config changes and update task configurations
    // CRITICAL: We need to handle both startup (first emission) and config changes (subsequent emissions)
    // For startup: register tasks but don't start them yet (handled below)
    // For config changes: update task configs asynchronously to avoid blocking UI
    let isFirstEmission = true;

    this.configService.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedConfig => {
        console.log('📋 [Dashboard] Config subscription fired, isFirstEmission:', isFirstEmission);

        // CRITICAL: Only update task configs for tasks that need changes
        // Wrap in setTimeout to prevent UI blocking when multiple tasks restart
        if (isFirstEmission) {
          isFirstEmission = false;
          console.log('⏱️ [Dashboard] First config emission - deferring task initialization by 1 second');

          // Defer startup task initialization
          setTimeout(() => {
            try {
              console.log('📋 [Dashboard] First-time config update - starting enabled tasks');

              const updatedOrderConfig = updatedConfig.taskSchedules.placeLimitOrder;
              this.taskScheduler.updateTaskConfig('place-limit-order', updatedOrderConfig);

              const updatedTrailingSlConfig = updatedConfig.taskSchedules.updateTrailingStopLoss;
              this.taskScheduler.updateTaskConfig('update-trailing-stopLoss', updatedTrailingSlConfig);

              const updatedTargetSlConfig = updatedConfig.taskSchedules.placeTargetStopLoss;
              this.taskScheduler.updateTaskConfig('place-target-stopLoss', updatedTargetSlConfig);

              // After config updates, start enabled tasks
              setTimeout(() => {
                try {
                  console.log('🚀 [Dashboard] Starting enabled tasks after config update');

                  if (updatedOrderConfig.enabled) {
                    console.log('🚀 [Dashboard] Starting place-limit-order');
                    this.taskScheduler.startTask('place-limit-order');
                  }

                  if (updatedTargetSlConfig.enabled) {
                    console.log('🚀 [Dashboard] Starting place-target-stopLoss');
                    this.taskScheduler.startTask('place-target-stopLoss');
                  }

                  if (updatedTrailingSlConfig.enabled) {
                    console.log('🚀 [Dashboard] Starting update-trailing-stopLoss');
                    this.taskScheduler.startTask('update-trailing-stopLoss');
                  }
                } catch (err) {
                  console.error('❌ [Dashboard] Error starting tasks:', err);
                  this.logger.error('Error starting tasks:', err);
                }
              }, 500); // Stagger starts by 500ms
            } catch (error) {
              console.error('❌ [Dashboard] Error in first-time config update:', error);
              this.logger.error('Error in first-time config update:', error);
            }
          }, 1000);
        } else {
          // On subsequent emissions (user saves new times), defer config updates
          console.log('📋 [Dashboard] Config change detected - deferring task update by 100ms');

          setTimeout(() => {
            try {
              const updatedOrderConfig = updatedConfig.taskSchedules.placeLimitOrder;
              console.log('📋 [Dashboard] Updating Place Limit Order task config');
              this.taskScheduler.updateTaskConfig('place-limit-order', updatedOrderConfig);

              const updatedTrailingSlConfig = updatedConfig.taskSchedules.updateTrailingStopLoss;
              console.log('📋 [Dashboard] Updating Update Trailing StopLoss task config');
              this.taskScheduler.updateTaskConfig('update-trailing-stopLoss', updatedTrailingSlConfig);

              const updatedTargetSlConfig = updatedConfig.taskSchedules.placeTargetStopLoss;
              console.log('📋 [Dashboard] Updating Place Target StopLoss task config');
              this.taskScheduler.updateTaskConfig('place-target-stopLoss', updatedTargetSlConfig);
            } catch (error) {
              console.error('❌ [Dashboard] Error updating task configs:', error);
              this.logger.error('Error updating task configs:', error);
            }
          }, 100); // Small delay to not block UI
        }
      });
    } catch (error) {
      console.error('❌ [Dashboard] Error during task scheduler setup:', error);
      this.logger.error('Task scheduler setup failed:', error);
      // Continue app execution even if scheduler setup fails
    }
  }

  get filteredItems(): Crossed[] {
    return this.items.filter(item => item.price > this.minPrice);
  }

  getHighCount(): number {
    return this.filteredItems.filter(item => item.crossedType === 'HIGH').length;
  }

  getLowCount(): number {
    return this.filteredItems.filter(item => item.crossedType === 'LOW').length;
  }

  onPriceFilterChange(): void {
    this.cdr.markForCheck();
  }

	async scan() {
		this.items = [];
		this.loading = true;
		this.progress = 0;

		try {
			console.log('🔍 Step 1: Fetching all perpetual futures tickers...');

			// Step 1: Get all tickers for perpetual futures
			const allTickers = await this.svc.getAllTickers();
			console.log(`✅ Fetched ${allTickers.length} tickers`);

			// Step 2: Filter top N symbols by turnover_usd (volume), using config value
			const config = this.configService.getConfig();
			const topVolumeCount = config.topVolumeSymbols;
			console.log(`📊 Step 2: Filtering top ${topVolumeCount} by turnover_usd...`);
			const sortedByVolume = allTickers
				.filter((t: any) => {
					const turnover = parseFloat(t?.turnover_usd || t?.turnover || '0');
					return turnover > 0;
				})
				.sort((a: any, b: any) => {
					const turnoverA = parseFloat(a?.turnover_usd || a?.turnover || '0');
					const turnoverB = parseFloat(b?.turnover_usd || b?.turnover || '0');
					return turnoverB - turnoverA; // Descending order
				})
				.slice(0, topVolumeCount); // Take top N

			console.log(`✅ Top 80 symbols by volume:`, sortedByVolume.map((t: any) => t.symbol).join(', '));

			// Step 3: Get active positions and exclude symbols with open positions
			console.log('🚫 Step 3: Excluding symbols with open positions...');
			const activePositions = await this.svc.getPositions().catch(() => []);
			const activeSymbols = new Set(
				(Array.isArray(activePositions) ? activePositions : [])
					.map((p: any) => String(p?.symbol || '').toUpperCase())
					.filter((s: string) => !!s)
			);

			const filtered = sortedByVolume.filter((t: any) => {
				const symbol = String(t?.symbol || '').toUpperCase();
				return symbol && !activeSymbols.has(symbol);
			});

			console.log(`✅ Filtered to ${filtered.length} symbols (excluding open positions)`);
			console.log('Excluded symbols:', Array.from(activeSymbols).join(', '));

			this.total = filtered.length;

			// Step 4 & 5: Get 3-day high/low and check for breakouts
			console.log('📈 Step 4-5: Checking for 3-day high/low breakouts...');

			const concurrency = 6;
			const queue = filtered.slice();
			const workers: Promise<void>[] = [];

			const worker = async () => {
				while (queue.length) {
					const ticker = queue.shift();
					if (!ticker) break;
					try {
						await this.checkSymbolBreakout(ticker);
					} catch (err) {
						console.error(`Error checking ${ticker?.symbol}:`, err);
					}
					this.progress++;
					this.cdr.markForCheck();
				}
			};

			for (let i = 0; i < concurrency; i++) workers.push(worker());
			await Promise.all(workers);

			console.log(`✅ Scan complete! Found ${this.items.length} breakouts`);

		} catch (error) {
			console.error('❌ Scanner error:', error);
		} finally {
			this.loading = false;
			this.cdr.markForCheck();
		}
	}

	/**
	 * Load limit order candidates: top 80 symbols by turnover, excluding open positions
	 * This is independent of scanner signals - all 80 symbols are available for limit orders
	 */
	async loadLimitOrderCandidates(): Promise<void> {
		this.loadingLimitOrderCandidates = true;
		this.limitOrderError = null;
		this.limitOrderCandidates = [];
		this.limitOrderSelections.clear();
		this.limitOrderSelectedOrders.clear();
		this.cdr.markForCheck();

		try {
			const config = this.configService.getConfig();
			const topVolumeCount = config.topVolumeSymbols;
			console.log(`🔍 Loading limit order candidates: Fetching top ${topVolumeCount} symbols by volume...`);

			// Step 1: Get all perpetual futures tickers
			const allTickers = await this.svc.getAllTickers();
			console.log(`✅ Fetched ${allTickers.length} tickers`);
			if (allTickers.length === 0) {
				throw new Error('No tickers available from API');
			}

			// Step 2: Filter top N symbols by turnover_usd
			const sortedByVolume = allTickers
				.filter((t: any) => {
					const turnover = parseFloat(t?.turnover_usd || t?.turnover || '0');
					return turnover > 0;
				})
				.sort((a: any, b: any) => {
					const turnoverA = parseFloat(a?.turnover_usd || a?.turnover || '0');
					const turnoverB = parseFloat(b?.turnover_usd || b?.turnover || '0');
					return turnoverB - turnoverA;
				})
				.slice(0, topVolumeCount);

			console.log(`✅ Top ${topVolumeCount} symbols by volume:`, sortedByVolume.map((t: any) => t.symbol));
			console.log(`Top ${topVolumeCount} sample data:`, sortedByVolume.slice(0, 3).map((t: any) => ({
				symbol: t.symbol,
				turnover: t.turnover_usd || t.turnover,
				price: t.last_traded_price || t.last_price,
				allPriceFields: { last_price: t.last_price, last_traded_price: t.last_traded_price, mark_price: t.mark_price, spot_price: t.spot_price }
			})));

			// Step 3: Exclude symbols with open positions
			const activePositions = await this.svc.getPositions().catch((err) => {
				console.warn('⚠️ Could not fetch positions:', err);
				return [];
			});
			const activeSymbols = new Set(
				(Array.isArray(activePositions) ? activePositions : [])
					.map((p: any) => String(p?.symbol || '').toUpperCase())
					.filter((s: string) => !!s)
			);

			console.log(`📊 Active positions: ${activeSymbols.size} symbols`, Array.from(activeSymbols));

			const filtered = sortedByVolume.filter((t: any) => {
				const symbol = String(t?.symbol || '').toUpperCase();
				return symbol && !activeSymbols.has(symbol);
			});

			console.log(`✅ Filtered to ${filtered.length} symbols (excluding open positions)`);

			// Step 4: Load candle data for N-day high/low for each symbol
			const concurrency = 6;
			console.log(`⏳ Step 4: Loading candle data for ${filtered.length} symbols using ${concurrency} concurrent workers...`);
			const queue = filtered.slice();
			const workers: Promise<void>[] = [];
			let processedCount = 0;
			let callCount = 0;

			const worker = async () => {
				while (queue.length) {
					const ticker = queue.shift();
					if (!ticker) break;
					callCount++;
					console.log(`📞 Calling loadLimitOrderCandidateCandles (call #${callCount}) with symbol: ${ticker?.symbol}`);
					try {
						await this.loadLimitOrderCandidateCandles(ticker);
						processedCount++;
						this.progress = processedCount;
						this.cdr.markForCheck();
					} catch (err) {
						console.error(`Error loading candles for ${ticker?.symbol}:`, err);
						// Don't fail entire load if one symbol fails - continue processing
					}
				}
			};

			for (let i = 0; i < concurrency; i++) workers.push(worker());
			await Promise.all(workers);

			console.log(`✅ Successfully loaded ${this.limitOrderCandidates.length} candidates with candle data (called loadLimitOrderCandidateCandles ${callCount} times)`);
			console.log(`Sample candidates:`, this.limitOrderCandidates.slice(0, 3));

			// Initialize selections with default values based on order type
			for (const candidate of this.limitOrderCandidates) {
				const key = `${candidate.symbol}:${candidate.crossedType}`;
				const defaultSide = candidate.crossedType === 'HIGH' ? 'buy' : 'sell';
				this.limitOrderSelections.set(key, { side: defaultSide, riskAmountInr: config.riskAmountInr });
				// Auto-select all orders by default
				this.limitOrderSelectedOrders.add(key);
			}

		} catch (error) {
			console.error('❌ Error loading limit order candidates:', error);
			this.limitOrderError = error instanceof Error ? error.message : 'Failed to load candidates. Check console for details.';
		} finally {
				this.loadingLimitOrderCandidates = false;
					this.cdr.markForCheck();
				}
			}

			/**
			 * Load candle data for a symbol and extract 3-day high/low
			 */
			private async loadLimitOrderCandidateCandles(ticker: any): Promise<void> {
				console.log(`🔄 loadLimitOrderCandidateCandles called with ticker:`, { symbol: ticker?.symbol, keys: Object.keys(ticker || {}).slice(0, 10) });
				const symbol = ticker?.symbol || '';
				if (!symbol) {
					console.warn('⚠️ Ticker has no symbol, skipping', 'ticker keys:', Object.keys(ticker || {}));
					return;
				}
				console.log(`✓ Processing symbol: ${symbol}`);

				try {
					console.log(`🔧 ${symbol}: Ticker object keys:`, Object.keys(ticker || {}).join(', '));
					console.log(`🔧 ${symbol}: Ticker price fields - last_price: ${ticker?.last_price}, last_traded_price: ${ticker?.last_traded_price}, mark_price: ${ticker?.mark_price}, spot_price: ${ticker?.spot_price}`);

					const quotingAsset = ticker?.quoting_asset || ticker?.settling_asset || '';
					const contractValue = parseFloat(ticker?.contract_value || ticker?.size || '0.001');

					// Get previous N days' high & low using config
					const config = this.configService.getConfig();
					const now = Date.now();
					const toSec = Math.floor(now / 1000);
					const fromDailySec = toSec - 60 * 60 * 24 * (config.daysHighLow + 1);

					console.log(`📥 ${symbol}: Fetching candles from ${new Date(fromDailySec * 1000).toISOString()} to ${new Date(toSec * 1000).toISOString()}`);

					const daily = await this.svc.getCandles(symbol, '1d', fromDailySec, toSec);
					console.log(`📦 ${symbol}: Raw API response type: ${typeof daily}, is array: ${Array.isArray(daily)}, value:`, daily);
					const dailyArr = (Array.isArray(daily) ? daily : (daily as any)?.candles ?? []) as any[];

					console.log(`📊 ${symbol}: Parsed candle array length: ${dailyArr?.length || 0}, first 2:`, dailyArr?.slice(0, 2));

					if (!dailyArr || dailyArr.length < 2) {
						console.warn(`⚠️ ${symbol}: Insufficient candle data (${dailyArr?.length || 0} candles, need at least 2)`);
						return;
					}

					// Sort by time
					dailyArr.sort((a: any, b: any) => {
						const aTime = Array.isArray(a) ? a[0] : (a.time ?? a.t ?? 0);
						const bTime = Array.isArray(b) ? b[0] : (b.time ?? b.t ?? 0);
						return aTime - bTime;
					});

					const previousDays = dailyArr.slice(0, -1);
					const today = dailyArr[dailyArr.length - 1];

					// Calculate previous 3 days' high and low
					const prev3High = Math.max(...previousDays.map((c: any) => {
						if (Array.isArray(c)) return c[2] ?? Number.NaN;
						return c.high ?? c.h ?? Number.NaN;
					}));

					const prev3Low = Math.min(...previousDays.map((c: any) => {
						if (Array.isArray(c)) return c[3] ?? Number.NaN;
						return c.low ?? c.l ?? Number.NaN;
					}));

					// Get today's high and low for limit order entry price calculation
					const todayHigh = Array.isArray(today)
						? (today[2] ?? Number.NaN)
						: (today.high ?? today.h ?? Number.NaN);

					const todayLow = Array.isArray(today)
						? (today[3] ?? Number.NaN)
						: (today.low ?? today.l ?? Number.NaN);

					console.log(`📈 ${symbol}: Prev3 High/Low: ${prev3High}/${prev3Low}, Today High/Low: ${todayHigh}/${todayLow}`);

					if (!isFinite(prev3High) || !isFinite(prev3Low)) {
						console.warn(`⚠️ ${symbol}: Invalid high/low values (H:${prev3High}, L:${prev3Low})`);
						return;
					}

					// Get current price from ticker - try multiple field names
					let currentPrice = parseFloat(ticker?.last_traded_price || ticker?.last_price || ticker?.mark_price || ticker?.spot_price || '0');
					let priceSource = 'ticker';

					// If still 0 or invalid, try to get from candle data (use today's close)
					if (currentPrice <= 0 && dailyArr.length > 0) {
						const todayCandle = dailyArr[dailyArr.length - 1];
						const closePrice = Array.isArray(todayCandle) ? todayCandle[4] : (todayCandle?.close || todayCandle?.c);
						currentPrice = parseFloat(closePrice || '0');
						priceSource = 'candle close';
						console.log(`💡 ${symbol}: Ticker price was 0, using today's close price from candle index[4]: ₹${currentPrice}`);
					}

					console.log(`💰 ${symbol}: Current price (from ${priceSource}): ₹${currentPrice}`);

					if (currentPrice <= 0) {
						console.warn(`⚠️ ${symbol}: Invalid current price (${currentPrice})`);
						return;
					}

					// Filter by minimum price - skip if current price is below minimum
					const minPriceValue = this.minPrice ?? 0;
					if (currentPrice < minPriceValue) {
						console.log(`⏭️ ${symbol}: Skipped - Current price ₹${currentPrice.toFixed(2)} < Minimum price ₹${minPriceValue}`);
						return;
					}

					// Store today's high/low in a temporary map for later use in limit orders
					if (!this.limitOrderCandlesTodayMap) this.limitOrderCandlesTodayMap = {};
					this.limitOrderCandlesTodayMap[symbol] = { todayHigh, todayLow };

					// Create TWO candidates for each symbol:
					// 1. BUY candidate (based on previous 3-day HIGH)
					this.limitOrderCandidates.push({
						symbol,
						crossedType: 'HIGH', // BUY order based on high
						price: currentPrice,
						prev3High,
						prev3Low,
						quotingAsset,
						contractValue
					});

					// 2. SELL candidate (based on previous 3-day LOW)
					this.limitOrderCandidates.push({
						symbol,
						crossedType: 'LOW', // SELL order based on low
						price: currentPrice,
						prev3High,
						prev3Low,
						quotingAsset,
						contractValue
					});

					console.log(`✅ ${symbol}: Added BUY & SELL candidates | Price: ₹${currentPrice.toFixed(2)} | Prev3 H: ₹${prev3High.toFixed(2)} | Prev3 L: ₹${prev3Low.toFixed(2)}`);
				} catch (err) {
					console.error(`❌ Error processing candles for ${symbol}:`, err);
					// Don't rethrow - continue processing other symbols
				}
			}

	/**
	 * Open limit order modal
	 */
	async openLimitOrderModal(): Promise<void> {
		await this.loadLimitOrderCandidates();
		this.showLimitOrderModal = true;
		this.cdr.markForCheck();
	}

	/**
	 * Close limit order modal
	 */
	closeLimitOrderModal(): void {
		this.showLimitOrderModal = false;
		this.limitOrderCandidates = [];
		this.limitOrderSelections.clear();
		this.limitOrderSelectedOrders.clear();
		this.limitOrderError = null;
		this.limitOrderSuccess = null;
		this.cdr.markForCheck();
	}

	/**
	 * Cleanup target orders - Cancel limit orders that don't have corresponding open positions
	 */
	async cleanupOrders(): Promise<void> {
		try {
			this.cleaningUpOrders = true;
			this.cleanupError = null;
			this.cleanupSuccess = null;
			this.cleanupResults = null;
			this.cdr.markForCheck();

			console.log('🧹 Starting cleanup of target orders...');

			// Call the cleanup service method
			const results = await this.svc.cleanupTargetOrders();

			console.log('🧹 Cleanup results:', results);

			// Store results
			this.cleanupResults = results;

			// Set success message
			if (results.cancelled === 0 && results.total === 0) {
				this.cleanupSuccess = 'No stale limit orders found. All limit orders have corresponding open positions.';
			} else if (results.cancelled === 0) {
				this.cleanupSuccess = `Scan complete. All ${results.total} limit order(s) have corresponding open positions.`;
			} else {
				this.cleanupSuccess = `✅ Successfully cleaned up ${results.cancelled} out of ${results.total} stale limit orders.`;
			}

			console.log('✅ Cleanup completed:', this.cleanupSuccess);
			this.cdr.markForCheck();

			// Auto-clear success message after 5 seconds
			setTimeout(() => {
				this.cleanupSuccess = null;
				this.cdr.markForCheck();
			}, 5000);

		} catch (error: any) {
			console.error('❌ Cleanup error:', error);
			this.cleanupError = error?.message || 'Failed to cleanup target orders. Please check the console for details.';
			this.cdr.markForCheck();

			// Auto-clear error message after 5 seconds
			setTimeout(() => {
				this.cleanupError = null;
				this.cdr.markForCheck();
			}, 5000);
		} finally {
			this.cleaningUpOrders = false;
			this.cdr.markForCheck();
		}
	}

	private async checkSymbolBreakout(ticker: any) {
		const symbol = ticker?.symbol || '';
		const config = this.configService.getConfig();

		// Extract product details from ticker
		const quotingAsset = ticker?.quoting_asset || ticker?.settling_asset || '';
		const contractValue = parseFloat(ticker?.contract_value || ticker?.size || '0.001');

		// Step 4: Get previous N days' high & low using config
		const now = Date.now();
		const toSec = Math.floor(now / 1000);
		const fromDailySec = toSec - 60 * 60 * 24 * (config.daysHighLow + 1);

		const daily = await this.svc.getCandles(symbol, '1d', fromDailySec, toSec);
		const dailyArr = (Array.isArray(daily) ? daily : (daily as any)?.candles ?? []) as any[];

		if (!dailyArr || dailyArr.length < 2) {
			return;
		}

		// Sort by time
		dailyArr.sort((a: any, b: any) => {
			const aTime = Array.isArray(a) ? a[0] : (a.time ?? a.t ?? 0);
			const bTime = Array.isArray(b) ? b[0] : (b.time ?? b.t ?? 0);
			return aTime - bTime;
		});

		const today = dailyArr[dailyArr.length - 1];
		const previousDays = dailyArr.slice(0, -1); // Previous N days

		// Calculate previous 3 days' high and low
		const prev3High = Math.max(...previousDays.map((c: any) => {
			if (Array.isArray(c)) return c[2] ?? Number.NaN;
			return c.high ?? c.h ?? Number.NaN;
		}));

		const prev3Low = Math.min(...previousDays.map((c: any) => {
			if (Array.isArray(c)) return c[3] ?? Number.NaN;
			return c.low ?? c.l ?? Number.NaN;
		}));

		if (!isFinite(prev3High) || !isFinite(prev3Low)) {
			return;
		}

		// Get today's high and low
		let todayHigh: number;
		let todayLow: number;

		if (Array.isArray(today)) {
			todayHigh = today[2] ?? Number.NaN;
			todayLow = today[3] ?? Number.NaN;
		} else {
			todayHigh = today.high ?? today.h ?? Number.NaN;
			todayLow = today.low ?? today.l ?? Number.NaN;
		}

		if (!isFinite(todayHigh) || !isFinite(todayLow)) {
			return;
		}

		// Step 5: Check if crossed above 3-day high (1 + buffer%) or below 3-day low (1 - buffer%)
		const bufferMultiplier = 1 + (config.bufferPercentage / 100);
		const highThreshold = prev3High * bufferMultiplier;
		const lowThreshold = prev3Low / bufferMultiplier;

		if (todayHigh > highThreshold) {
			console.log(`✅ ${symbol}: Crossed ABOVE 3-day high | Today: ${todayHigh.toFixed(2)}, Threshold: ${highThreshold.toFixed(2)}`);
			this.items.push({ 
				symbol, 
				crossedType: 'HIGH', 
				price: todayHigh, 
				prev3High, 
				prev3Low, 
				quotingAsset, 
				contractValue 
			});
			this.cdr.markForCheck();
			return;
		}

		if (todayLow < lowThreshold) {
			console.log(`✅ ${symbol}: Crossed BELOW 3-day low | Today: ${todayLow.toFixed(2)}, Threshold: ${lowThreshold.toFixed(2)}`);
			this.items.push({ 
				symbol, 
				crossedType: 'LOW', 
				price: todayLow, 
				prev3High, 
				prev3Low, 
				quotingAsset, 
				contractValue 
			});
			this.cdr.markForCheck();
		}
	}

	placeOrder(item: Crossed): void {
		this.selectedItem = item;
		this.orderError = null;
		this.orderSuccess = null;
		this.orderForm.side = item.crossedType === 'HIGH' ? 'buy' : 'sell';
		const config = this.configService.getConfig();
		this.orderForm.riskAmountInr = config.riskAmountInr;
		this.orderForm.quantity = null;
		this.orderForm.useManualQuantity = false;
		this.showOrderModal = true;
		this.cdr.markForCheck();
	}

	closeOrderModal(): void {
		this.showOrderModal = false;
		this.placingOrder = false;
		this.orderError = null;
		this.selectedItem = null;
		this.cdr.markForCheck();
	}

	get orderPreview() {
		if (!this.selectedItem) return null;

		// Check if product is quoted in USD (requires INR conversion for risk calculation)
		const quotingAsset = (this.selectedItem.quotingAsset || '').toUpperCase();
		const isUsdQuoted = quotingAsset === 'USDT' || quotingAsset === 'USD';
		const USD_TO_INR = 85; // USD to INR conversion rate from Delta Exchange
		const priceMultiplier = isUsdQuoted ? USD_TO_INR : 1;

		const config = this.configService.getConfig();
		const bufferMultiplier = 1 + (config.bufferPercentage / 100);

		const entryPrice = this.selectedItem.price;
		const entryPriceInr = entryPrice * priceMultiplier;
		const prev3HighInr = this.selectedItem.prev3High * priceMultiplier;
		const prev3LowInr = this.selectedItem.prev3Low * priceMultiplier;

		const side = this.orderForm.side;
		const stopLossPrice = side === 'buy'
			? this.round(this.selectedItem.prev3Low / bufferMultiplier, 2)
			: this.round(this.selectedItem.prev3High * bufferMultiplier, 2);

		const stopLossPriceInr = stopLossPrice * priceMultiplier;
		const stopLossDifference = this.round(Math.abs(entryPriceInr - stopLossPriceInr), 4);
		const stopLossDifferenceUsd = this.round(Math.abs(entryPrice - stopLossPrice), 4);

		if (stopLossDifference <= 0) {
			return null;
		}

		// Use contract_value from the product as the lot size (minimum tradeable quantity)
		// For AAVEUSD: contract_value = 1, for BTCUSD: contract_value = 0.001
		const lotSize = this.selectedItem.contractValue || 0.001;
		const roundToLotSize = (qty: number): number => {
			return Math.round(qty / lotSize) * lotSize;
		};

		const minRisk = config.riskAmountInr - 500;
		const maxRisk = config.riskAmountInr + 500;

		// Calculate raw quantities based on INR risk (no strict validation in preview)
		const rawMinQty = minRisk / stopLossDifference;
		const rawMaxQty = maxRisk / stopLossDifference;

		// Don't enforce strict bounds - allow calculation for any risk amount
		const minQtyForRisk = Math.max(lotSize, roundToLotSize(rawMinQty));
		const maxQtyForRisk = Math.max(lotSize, roundToLotSize(rawMaxQty));

		// Remove strict validation - allow preview for any risk
		// Validation will happen only on order confirmation
		let quantity: number;
		if (this.orderForm.useManualQuantity && (this.orderForm.quantity || 0) > 0) {
			quantity = roundToLotSize(this.orderForm.quantity || 0);
		} else {
			// Calculate quantity based on user's risk (even if outside 2500-3000 range)
			const preferredQty = this.orderForm.riskAmountInr / stopLossDifference;
			quantity = roundToLotSize(preferredQty);
		}

		// Target quantity: exactly half of main quantity, rounded to lot size
		// Ensure it doesn't exceed half of quantity even after rounding
		const rawTargetQty = quantity / 2;
		const targetQuantity = Math.min(roundToLotSize(rawTargetQty), rawTargetQty);
		const targetPrice = side === 'buy'
			? this.round(entryPrice + stopLossDifferenceUsd, 2)
			: this.round(entryPrice - stopLossDifferenceUsd, 2);
		const effectiveRisk = this.round(quantity * stopLossDifference, 2);

		return {
			entryPrice,
			stopLossPrice,
			stopLossDifference,
			quantity,
			targetQuantity,
			targetPrice,
			effectiveRisk
		};
	}

	async confirmPlaceOrder(): Promise<void> {
		if (!this.selectedItem || this.placingOrder) {
			return;
		}

		this.orderError = null;
		this.orderSuccess = null;

		const preview = this.orderPreview;
		if (!preview) {
			this.orderError = 'Unable to calculate order values. Check prices and try again.';
			this.cdr.markForCheck();
			return;
		}

		// Warn if risk is outside recommended range, but allow order placement
		const config = this.configService.getConfig();
		if (this.orderForm.riskAmountInr < config.riskAmountInr - 500 || this.orderForm.riskAmountInr > config.riskAmountInr + 500) {
			const confirmed = confirm(
				`Risk (₹${this.orderForm.riskAmountInr}) is outside the recommended range of ₹${config.riskAmountInr - 500}-₹${config.riskAmountInr + 500}.\n\nDo you want to proceed anyway?`
			);
			if (!confirmed) {
				return;
			}
		}

		this.placingOrder = true;
		this.cdr.markForCheck();

		try {
			const result: PlaceBracketOrderResult = await this.svc.placeBracketOrder({
				symbol: this.selectedItem.symbol,
				side: this.orderForm.side,
				entryPrice: this.selectedItem.price,
				prev3High: this.selectedItem.prev3High,
				prev3Low: this.selectedItem.prev3Low,
				riskAmountInr: this.orderForm.riskAmountInr,
				quantity: this.orderForm.useManualQuantity ? (this.orderForm.quantity || undefined) : undefined
			});

			this.orderSuccess = `Order placed: Qty ${result.calculations.quantity}, SL ${result.calculations.stopLossPrice}, Target ${result.calculations.targetPrice} (half qty ${result.calculations.targetQuantity}).`;
			this.showOrderModal = false;
		} catch (err: any) {
			this.orderError = err?.message || 'Failed to place order.';
		} finally {
			this.placingOrder = false;
			this.cdr.markForCheck();
		}
	}

	/**
	 * Place limit bracket orders for all filteredItems sequentially (or with limited concurrency).
	 * This implements the user's requirements for limit entry price, trailing stop and target.
	 */
	/**
	 * Place limit bracket orders for selected candidates from limit order modal
	 * Orders are placed based on user selections (buy/sell side and risk amount per symbol)
	 * This is completely independent of scanner crossover signals
	 */
	async placeLimitOrdersAll(): Promise<void> {
		if (!this.limitOrderCandidates || !this.limitOrderCandidates.length) {
			this.limitOrderError = 'No candidates available';
			console.warn('[PlaceLimitOrdersAll]', this.limitOrderError);
			this.cdr.markForCheck();
			return;
		}

		// Get SELECTED orders (from checkbox selection)
		// If running from scheduler and no selections exist, auto-select all
		let selectedKeys = Array.from(this.limitOrderSelectedOrders);

		if (selectedKeys.length === 0) {
			console.log('[PlaceLimitOrdersAll] No manual selections found, auto-selecting all candidates for scheduler');
			selectedKeys = this.limitOrderCandidates.map(c => `${c.symbol}:${c.crossedType}`);
			console.log('[PlaceLimitOrdersAll] Auto-selected keys:', selectedKeys);
		}

		if (!selectedKeys.length) {
			this.limitOrderError = 'No candidates to place orders for';
			console.warn('[PlaceLimitOrdersAll]', this.limitOrderError);
			this.cdr.markForCheck();
			return;
		}

		console.log('[PlaceLimitOrdersAll] Placing orders for', selectedKeys.length, 'candidates');

		// For scheduled execution, auto-proceed without confirmation
		// For manual UI execution, require user confirmation
		if (!this.isScheduledExecution) {
			if (!confirm(`Place limit orders for ${selectedKeys.length} selected order(s)? This will attempt to create orders via API.`)) {
				return;
			}
		} else {
			console.log('[PlaceLimitOrdersAll] Scheduled execution mode - proceeding without confirmation');
		}

		this.placingOrder = true;
		this.limitOrderError = null;
		this.limitOrderSuccess = null;
		this.cdr.markForCheck();

		// Cancel all existing pending orders once before placing new orders
		try {
			this.limitOrderError = 'Cancelling existing orders...';
			this.cdr.markForCheck();
			await this.svc.cancelPendingOrders();
			this.limitOrderError = null;
		} catch (error: any) {
			console.error('Error cancelling pending orders:', error);
			// Continue with placing orders even if cancellation fails
		}

		const results: string[] = [];

		for (const key of selectedKeys) {
			try {
				// Parse key format "symbol:crossedType"
				const [symbol, crossedTypeStr] = key.split(':');
				const crossedType = crossedTypeStr as 'HIGH' | 'LOW';

				// Find the candidate
				const candidate = this.limitOrderCandidates.find(c => c.symbol === symbol && c.crossedType === crossedType);
				if (!candidate) {
					results.push(`${symbol} (${crossedType}): candidate not found`);
					console.warn('[PlaceLimitOrdersAll] Candidate not found:', key);
					continue;
				}

				// Get user-selected side and risk amount for this row (or use defaults)
				let selection = this.limitOrderSelections.get(key);
				if (!selection) {
					// Use default values for scheduled execution
					console.log('[PlaceLimitOrdersAll] No selection for', key, '- using defaults');
					const config = this.configService.getConfig();
					selection = {
						side: 'buy',  // Default to buy
						riskAmountInr: config.riskAmountInr
					};
				}

				const { side, riskAmountInr } = selection;

				try {
					// Call placeLimitBracketOrder with parameters
					const todayMap = this.limitOrderCandlesTodayMap?.[symbol] || {};
					const res = await this.svc.placeLimitBracketOrder({
								symbol,
								side,
								entryPrice: 0, // Will be recalculated in service
								prev3High: candidate.prev3High,
								prev3Low: candidate.prev3Low,
								todayHigh: todayMap.todayHigh,
								todayLow: todayMap.todayLow,
								riskAmountInr
							});

							const qty = res.calculations.quantity || 0;
							const entryPr = res.calculations.entryPrice || 'N/A';
							const slPr = res.calculations.stopLossPrice || 'N/A';
							const effectiveRisk = res.calculations.effectiveRiskInr || riskAmountInr;

							results.push(
								`${symbol} (${side.toUpperCase()}): ` +
								`Entry: ₹${entryPr}, SL: ₹${slPr}, ` +
								`Qty: ${qty}, Risk: ₹${effectiveRisk}, Target: ₹${res.calculations.targetPrice}`
							);
						} catch (err: any) {
					results.push(`${symbol} (${side}): failed - ${err?.message || err}`);
				}
			} catch (err: any) {
				results.push(`Error: ${err?.message || err}`);
			}
		}

		const successCount = results.filter(r => r.includes('order placed')).length;
		const failureResults = results.filter(r => r.includes('failed') || r.includes('error'));

		this.placingOrder = false;
		this.limitOrderSuccess = `Placed ${successCount} / ${selectedKeys.length} limit orders successfully`;
		this.limitOrderError = failureResults.length > 0 ? failureResults.join('\n') : null;

		this.cdr.markForCheck();
		console.log('Place Limit Orders results:', results);

		// Record results in task scheduler
		if (results.length > 0) {
			const structuredResults = results.map((msg, index) => ({
				success: !msg.includes('failed') && !msg.includes('error'),
				symbol: selectedKeys[index]?.split(':')[0] || 'UNKNOWN',
				type: selectedKeys[index]?.split(':')[1] || 'UNKNOWN',
				message: msg
			}));
			this.taskScheduler.recordTaskResults('place-limit-order', structuredResults);
		}

		// Reset scheduled execution flag
		this.isScheduledExecution = false;

		// Close modal after completion
		if (successCount === selectedKeys.length) {
			setTimeout(() => this.closeLimitOrderModal(), 1500);
		}
	}

	/**
	 * Helper method to get selection side for a symbol and order type
	 */
	getSelectionSide(symbol: string, crossedType: 'HIGH' | 'LOW'): 'buy' | 'sell' {
		const key = `${symbol}:${crossedType}`;
		return this.limitOrderSelections.get(key)?.side || (crossedType === 'HIGH' ? 'buy' : 'sell');
	}

	/**
	 * Helper method to set selection side for a symbol and order type
	 */
	setSelectionSide(symbol: string, crossedType: 'HIGH' | 'LOW', side: 'buy' | 'sell'): void {
		const key = `${symbol}:${crossedType}`;
		const sel = this.limitOrderSelections.get(key);
		if (sel) {
			sel.side = side;
		}
	}

	/**
	 * Helper method to get selection risk for a symbol and order type
	 */
	getSelectionRisk(symbol: string, crossedType: 'HIGH' | 'LOW'): number {
		const key = `${symbol}:${crossedType}`;
		const config = this.configService.getConfig();
		return this.limitOrderSelections.get(key)?.riskAmountInr || config.riskAmountInr;
	}

	/**
	 * Helper method to set selection risk for a symbol and order type
	 */
	setSelectionRisk(symbol: string, crossedType: 'HIGH' | 'LOW', risk: number): void {
		const key = `${symbol}:${crossedType}`;
		const sel = this.limitOrderSelections.get(key);
		if (sel) {
			sel.riskAmountInr = risk;
		}
	}

	/**
	 * Check if an order is selected
	 */
	isOrderSelected(symbol: string, crossedType: 'HIGH' | 'LOW'): boolean {
		const key = `${symbol}:${crossedType}`;
		return this.limitOrderSelectedOrders.has(key);
	}

	/**
	 * Toggle selection for a single order
	 */
	toggleOrderSelection(symbol: string, crossedType: 'HIGH' | 'LOW', event: any): void {
		const key = `${symbol}:${crossedType}`;
		if (event.target.checked) {
			this.limitOrderSelectedOrders.add(key);
		} else {
			this.limitOrderSelectedOrders.delete(key);
		}
		this.cdr.markForCheck();
	}

	/**
	 * Check if all orders are selected
	 */
	isAllSelected(): boolean {
		if (this.limitOrderCandidates.length === 0) return false;
		return this.limitOrderCandidates.every(c => this.isOrderSelected(c.symbol, c.crossedType));
	}

	/**
	 * Toggle select/deselect all orders
	 */
	toggleSelectAll(event: any): void {
		if (event.target.checked) {
			// Select all
			for (const candidate of this.limitOrderCandidates) {
				const key = `${candidate.symbol}:${candidate.crossedType}`;
				this.limitOrderSelectedOrders.add(key);
			}
		} else {
			// Deselect all
			this.limitOrderSelectedOrders.clear();
		}
		this.cdr.markForCheck();
	}

	/**
	 * Get count of selected orders
	 */
	getSelectedOrdersCount(): number {
		return this.limitOrderSelectedOrders.size;
	}

	private round(value: number, digits: number = 4): number {
		const factor = Math.pow(10, digits);
		return Math.round(value * factor) / factor;
	}
}
