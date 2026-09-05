import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { ConfigService, AppConfig } from '../../core/services/config.service';
import { LoggingService } from '../../core/services/logging.service';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit, OnDestroy, CanDeactivate<ConfigComponent> {
  config: AppConfig;
  originalConfig: AppConfig;
  isSaving = false;
  saveMessage: string | null = null;
  isDirty = false;

  constructor(
    private configService: ConfigService,
    private logger: LoggingService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.config = this.configService.getConfig();
    this.originalConfig = JSON.parse(JSON.stringify(this.config));
  }

  ngOnInit(): void {
    // Load the current configuration
    this.config = JSON.parse(JSON.stringify(this.configService.getConfig()));
    this.originalConfig = JSON.parse(JSON.stringify(this.config));
    this.isDirty = false;

    // Subscribe to config changes from other components
    this.configService.config$.subscribe(config => {
      // Only update if not currently saving (to prevent marking as dirty from our own saves)
      if (!this.isSaving) {
        this.config = JSON.parse(JSON.stringify(config));
        this.originalConfig = JSON.parse(JSON.stringify(config));
        this.isDirty = false;
        this.cdr.markForCheck();
      }
    });

    // Add beforeunload listener to warn if closing with unsaved changes
    window.addEventListener('beforeunload', this.onBeforeUnload.bind(this));

    this.logger.debug('Configuration page loaded');
  }

  /**
   * Handle beforeunload event - warn user if they have unsaved changes
   */
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.checkIfDirty()) {
      event.preventDefault();
      event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return event.returnValue;
    }
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    // Remove the beforeunload listener
    window.removeEventListener('beforeunload', this.onBeforeUnload.bind(this));
  }

  /**
   * Save configuration changes
   */
  async saveConfig(): Promise<void> {
    console.log('📝 [ConfigComponent] saveConfig() called');

    // Normalize times before validation
    this.normalizeTaskTimes();

    if (!this.validateConfig()) {
      console.log('❌ [ConfigComponent] Validation failed, not saving');
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    try {
      console.log('📝 [ConfigComponent] Config before save:', {
        placeLimitOrder: this.config.taskSchedules.placeLimitOrder,
        placeTargetStopLoss: this.config.taskSchedules.placeTargetStopLoss,
        updateTrailingStopLoss: this.config.taskSchedules.updateTrailingStopLoss,
        cleanupTargetOrders: this.config.taskSchedules.cleanupTargetOrders,
        moveSLToEntry: this.config.taskSchedules.moveSLToEntry,
        daysHighLow: this.config.daysHighLow,
        bufferPercentage: this.config.bufferPercentage,
        riskAmountInr: this.config.riskAmountInr,
        targetMultiplier: this.config.targetMultiplier,
        minimumPrice: this.config.minimumPrice,
        topVolumeSymbols: this.config.topVolumeSymbols
      });

      this.logger.debug('Saving config with:', {
        placeLimitOrderEnabled: this.config.taskSchedules.placeLimitOrder.enabled,
        placeLimitOrderDailyTime: this.config.taskSchedules.placeLimitOrder.dailyTime,
        placeLimitOrderScheduleType: this.config.taskSchedules.placeLimitOrder.scheduleType,
        placeTargetStopLossEnabled: this.config.taskSchedules.placeTargetStopLoss.enabled,
        placeTargetStopLossDailyTime: this.config.taskSchedules.placeTargetStopLoss.dailyTime,
        updateTrailingStopLossEnabled: this.config.taskSchedules.updateTrailingStopLoss.enabled,
        updateTrailingStopLossDailyTime: this.config.taskSchedules.updateTrailingStopLoss.dailyTime,
        cleanupTargetOrdersEnabled: this.config.taskSchedules.cleanupTargetOrders.enabled,
        cleanupTargetOrdersDailyTime: this.config.taskSchedules.cleanupTargetOrders.dailyTime,
        moveSLToEntryEnabled: this.config.taskSchedules.moveSLToEntry.enabled,
        moveSLToEntryScheduleType: this.config.taskSchedules.moveSLToEntry.scheduleType,
        schedulerEnabled: this.config.schedulerEnabled
      });

      console.log('📝 [ConfigComponent] Calling configService.updateConfig()');
      this.configService.updateConfig(this.config);

      console.log('✅ [ConfigComponent] configService.updateConfig() completed');
      this.saveMessage = '✅ Configuration saved successfully!';
      // Deep copy to ensure originalConfig matches current config
      this.originalConfig = JSON.parse(JSON.stringify(this.config));
      // Mark config as clean after save
      this.isDirty = false;

      this.logger.info('Configuration saved successfully');
      console.log('✅ [ConfigComponent] Save completed successfully');

      // Clear message after 3 seconds
      setTimeout(() => {
        this.saveMessage = null;
        this.cdr.markForCheck();
      }, 3000);
    } catch (error) {
      this.logger.error('Failed to save configuration:', error);
      this.saveMessage = '❌ Failed to save configuration';
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      this.config = JSON.parse(JSON.stringify(this.originalConfig));
      this.saveMessage = null;
      this.cdr.markForCheck();
    }
  }

  /**
   * Go back to previous page
   */
  goBack(): void {
    this.router.navigate(['/scanner']);
  }

  /**
   * Validate configuration values
   */
  private validateConfig(): boolean {
    // Validate numeric values
    if (this.config.daysHighLow < 1 || this.config.daysHighLow > 365) {
      this.saveMessage = '❌ Days for High/Low must be between 1 and 365';
      this.cdr.markForCheck();
      return false;
    }

    if (this.config.bufferPercentage < 0 || this.config.bufferPercentage > 1) {
      this.saveMessage = '❌ Buffer Percentage must be between 0 and 1';
      this.cdr.markForCheck();
      return false;
    }

    if (this.config.targetMultiplier < 1) {
      this.saveMessage = '❌ Target Multiplier must be at least 1';
      this.cdr.markForCheck();
      return false;
    }

    if (this.config.riskAmountInr < 0) {
      this.saveMessage = '❌ Risk Amount cannot be negative';
      this.cdr.markForCheck();
      return false;
    }

    // Validate time format - only for daily schedules
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    // Place Limit Order
    if (this.config.taskSchedules.placeLimitOrder.enabled && 
        this.config.taskSchedules.placeLimitOrder.scheduleType === 'daily') {
      if (!timeRegex.test(this.config.taskSchedules.placeLimitOrder.dailyTime || '')) {
        this.saveMessage = '❌ Invalid time format for Place Limit Order (use HH:MM)';
        this.cdr.markForCheck();
        return false;
      }
    }

    // Place Target/Stop Loss
    if (this.config.taskSchedules.placeTargetStopLoss.enabled && 
        this.config.taskSchedules.placeTargetStopLoss.scheduleType === 'daily') {
      if (!timeRegex.test(this.config.taskSchedules.placeTargetStopLoss.dailyTime || '')) {
        this.saveMessage = '❌ Invalid time format for Place Target/Stop Loss (use HH:MM)';
        this.cdr.markForCheck();
        return false;
      }
    }

    // Update Trailing Stop Loss
    if (this.config.taskSchedules.updateTrailingStopLoss.enabled && 
        this.config.taskSchedules.updateTrailingStopLoss.scheduleType === 'daily') {
      if (!timeRegex.test(this.config.taskSchedules.updateTrailingStopLoss.dailyTime || '')) {
        this.saveMessage = '❌ Invalid time format for Update Trailing Stop Loss (use HH:MM)';
        this.cdr.markForCheck();
        return false;
      }
    }

    // Validate interval format - only for interval schedules
    // Place Limit Order
    if (this.config.taskSchedules.placeLimitOrder.enabled && 
        this.config.taskSchedules.placeLimitOrder.scheduleType === 'interval') {
      if (!this.config.taskSchedules.placeLimitOrder.intervalMinutes || 
          this.config.taskSchedules.placeLimitOrder.intervalMinutes < 1 || 
          this.config.taskSchedules.placeLimitOrder.intervalMinutes > 1440) {
        this.saveMessage = '❌ Invalid interval for Place Limit Order (use 1-1440 minutes)';
        this.cdr.markForCheck();
        return false;
      }
    }

    // Place Target/Stop Loss
    if (this.config.taskSchedules.placeTargetStopLoss.enabled && 
        this.config.taskSchedules.placeTargetStopLoss.scheduleType === 'interval') {
      if (!this.config.taskSchedules.placeTargetStopLoss.intervalMinutes || 
          this.config.taskSchedules.placeTargetStopLoss.intervalMinutes < 1 || 
          this.config.taskSchedules.placeTargetStopLoss.intervalMinutes > 1440) {
        this.saveMessage = '❌ Invalid interval for Place Target/Stop Loss (use 1-1440 minutes)';
        this.cdr.markForCheck();
        return false;
      }
    }

    // Update Trailing Stop Loss
    if (this.config.taskSchedules.updateTrailingStopLoss.enabled && 
        this.config.taskSchedules.updateTrailingStopLoss.scheduleType === 'interval') {
      if (!this.config.taskSchedules.updateTrailingStopLoss.intervalMinutes || 
          this.config.taskSchedules.updateTrailingStopLoss.intervalMinutes < 1 || 
          this.config.taskSchedules.updateTrailingStopLoss.intervalMinutes > 1440) {
        this.saveMessage = '❌ Invalid interval for Update Trailing Stop Loss (use 1-1440 minutes)';
        this.cdr.markForCheck();
        return false;
      }
    }

    // Validate max retries - when retry is enabled
    if (this.config.taskSchedules.placeLimitOrder.retryOnFailure &&
        (!this.config.taskSchedules.placeLimitOrder.maxRetries || 
         this.config.taskSchedules.placeLimitOrder.maxRetries < 1 || 
         this.config.taskSchedules.placeLimitOrder.maxRetries > 10)) {
      this.saveMessage = '❌ Max retries for Place Limit Order must be between 1 and 10';
      this.cdr.markForCheck();
      return false;
    }

    if (this.config.taskSchedules.placeTargetStopLoss.retryOnFailure &&
        (!this.config.taskSchedules.placeTargetStopLoss.maxRetries || 
         this.config.taskSchedules.placeTargetStopLoss.maxRetries < 1 || 
         this.config.taskSchedules.placeTargetStopLoss.maxRetries > 10)) {
      this.saveMessage = '❌ Max retries for Place Target/Stop Loss must be between 1 and 10';
      this.cdr.markForCheck();
      return false;
    }

    if (this.config.taskSchedules.updateTrailingStopLoss.retryOnFailure &&
        (!this.config.taskSchedules.updateTrailingStopLoss.maxRetries || 
         this.config.taskSchedules.updateTrailingStopLoss.maxRetries < 1 || 
         this.config.taskSchedules.updateTrailingStopLoss.maxRetries > 10)) {
      this.saveMessage = '❌ Max retries for Update Trailing Stop Loss must be between 1 and 10';
      this.cdr.markForCheck();
      return false;
    }

    return true;
  }

  /**
   * Normalize task times to HH:MM format
   */
  private normalizeTaskTimes(): void {
    this.config.taskSchedules.placeLimitOrder.dailyTime = 
      this.normalizeTime(this.config.taskSchedules.placeLimitOrder.dailyTime || '');
    this.config.taskSchedules.placeTargetStopLoss.dailyTime = 
      this.normalizeTime(this.config.taskSchedules.placeTargetStopLoss.dailyTime || '');
    this.config.taskSchedules.updateTrailingStopLoss.dailyTime = 
      this.normalizeTime(this.config.taskSchedules.updateTrailingStopLoss.dailyTime || '');
  }

  /**
   * Normalize a single time string to HH:MM format
   */
  private normalizeTime(time: string): string {
    if (!time) return '';

    // Remove any whitespace
    time = time.trim();

    // If already in HH:MM format, return as-is
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
      return time;
    }

    // Try to parse various formats
    const match = time.match(/(\d{1,2})\D(\d{1,2})/);
    if (match) {
      const hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);

      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      }
    }

    return time; // Return original if parsing fails
  }

  /**
   * Check if configuration has been modified
   */
  private checkIfDirty(): boolean {
    return JSON.stringify(this.config) !== JSON.stringify(this.originalConfig);
  }

  /**
   * CanDeactivate implementation - called when user tries to navigate away
   */
  canDeactivate(
    component: ConfigComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Update isDirty flag based on current state
    this.isDirty = this.checkIfDirty();

    if (!this.isDirty) {
      // No changes, safe to navigate
      console.log('✅ [ConfigComponent] No unsaved changes, allowing navigation');
      return true;
    }

    // Configuration has been modified
    console.log('⚠️  [ConfigComponent] Unsaved changes detected, auto-saving...');

    // Auto-save the configuration before allowing navigation
    if (!this.validateConfig()) {
      // If validation fails, ask user to confirm
      const confirmed = confirm(
        'Configuration validation failed. Your changes have NOT been saved.\n\nDo you want to discard these changes and continue?'
      );
      return confirmed;
    }

    // Save automatically
    return new Promise<boolean>((resolve) => {
      this.normalizeTaskTimes();

      try {
        this.configService.updateConfig(this.config);
        this.originalConfig = JSON.parse(JSON.stringify(this.config));
        this.isDirty = false;
        console.log('✅ [ConfigComponent] Auto-saved configuration before navigation');
        resolve(true);
      } catch (error) {
        console.error('❌ [ConfigComponent] Failed to auto-save configuration:', error);
        const confirmed = confirm(
          'Failed to save your configuration. Do you want to discard these changes and continue?'
        );
        resolve(confirmed);
      }
    });
  }
}
