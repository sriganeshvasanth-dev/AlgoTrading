import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface TaskScheduleConfig {
  enabled: boolean;
  scheduleType: 'daily' | 'hourly' | 'interval';
  dailyTime?: string;               // HH:MM format for daily tasks (e.g., "00:05")
  intervalMinutes?: number;         // For interval-based tasks
  retryOnFailure: boolean;
  maxRetries: number;
}

export interface AppConfig {
  // Technical Analysis
  daysHighLow: number;              // Previous N days for high/low calculation (integer, min 1)
  bufferPercentage: number;         // Buffer % for entry/SL (0.4%)

  // Risk Management
  riskAmountInr: number;            // Risk amount in INR (2500-3000)
  targetMultiplier: number;         // Target multiplier (4x SL difference)

  // Filtering
  minimumPrice: number;             // Minimum price filter (5)
  topVolumeSymbols: number;         // Top symbols by volume (integer, min 1)

  // Currency Conversion
  usdToInr: number;                 // USD to INR conversion rate

  // Scheduler Configuration (Legacy - kept for backward compatibility)
  schedulerEnabled: boolean;
  schedulerInterval: 1 | 2;         // Hours (1 or 2)
  scheduledFeatures: {
    placeLimitOrder: boolean;
    placeTargetStopLoss: boolean;
    updateTrailingStopLoss: boolean;
  };

  // Task-Specific Scheduling
  taskSchedules: {
    placeLimitOrder: TaskScheduleConfig;
    placeTargetStopLoss: TaskScheduleConfig;
    updateTrailingStopLoss: TaskScheduleConfig;
    cleanupTargetOrders: TaskScheduleConfig;
    moveSLToEntry: TaskScheduleConfig;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly CONFIG_KEY = 'crypto-scanner-config';

  private defaultConfig: AppConfig = {
    daysHighLow: 3,
    bufferPercentage: 0.4,
    riskAmountInr: 2500,
    targetMultiplier: 4,
    minimumPrice: 5,
    topVolumeSymbols: 80,
    usdToInr: 85,
    schedulerEnabled: false,
    schedulerInterval: 1,
    scheduledFeatures: {
      placeLimitOrder: false,
      placeTargetStopLoss: false,
      updateTrailingStopLoss: false
    },
    taskSchedules: {
      placeLimitOrder: {
        enabled: false,
        scheduleType: 'daily',
        dailyTime: '00:05',           // 12:05 AM
        retryOnFailure: true,
        maxRetries: 3
      },
      placeTargetStopLoss: {
        enabled: false,
        scheduleType: 'hourly',
        intervalMinutes: 120,         // Every 2 hours
        retryOnFailure: true,
        maxRetries: 2
      },
      updateTrailingStopLoss: {
        enabled: false,
        scheduleType: 'daily',
        dailyTime: '00:05',           // 12:05 AM
        retryOnFailure: true,
        maxRetries: 3
      },
      cleanupTargetOrders: {
        enabled: false,
        scheduleType: 'daily',
        dailyTime: '23:30',           // 11:30 PM
        retryOnFailure: true,
        maxRetries: 2
      },
      moveSLToEntry: {
        enabled: false,
        scheduleType: 'interval',
        intervalMinutes: 60,          // Every 1 hour
        retryOnFailure: true,
        maxRetries: 3
      }
    }
  };

  private configSubject = new BehaviorSubject<AppConfig>(this.loadConfig());
  public config$ = this.configSubject.asObservable();

  constructor() {
    const loadedConfig = this.configSubject.value;
    console.log('✅ [ConfigService] Initialized successfully');
    console.log('  - daysHighLow:', loadedConfig.daysHighLow);
    console.log('  - bufferPercentage:', loadedConfig.bufferPercentage);
    console.log('  - riskAmountInr:', loadedConfig.riskAmountInr);
    console.log('  - targetMultiplier:', loadedConfig.targetMultiplier);
    console.log('  - minimumPrice:', loadedConfig.minimumPrice);
    console.log('  - topVolumeSymbols:', loadedConfig.topVolumeSymbols);
    console.log('  - Task Schedules:', {
      placeLimitOrder: loadedConfig.taskSchedules.placeLimitOrder,
      placeTargetStopLoss: loadedConfig.taskSchedules.placeTargetStopLoss,
      updateTrailingStopLoss: loadedConfig.taskSchedules.updateTrailingStopLoss,
      cleanupTargetOrders: loadedConfig.taskSchedules.cleanupTargetOrders,
      moveSLToEntry: loadedConfig.taskSchedules.moveSLToEntry
    });
  }

  /**
   * Load configuration from localStorage or use defaults
   */
  private loadConfig(): AppConfig {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        console.log('📝 [ConfigService] Found stored config in localStorage');
        const parsed = JSON.parse(stored);
        console.log('📝 [ConfigService] Parsed stored config:', parsed);

        // Deep merge with defaults to preserve nested objects
        const merged: AppConfig = { ...this.defaultConfig, ...parsed };

        // Deep merge taskSchedules to preserve all task configs
        if (parsed.taskSchedules) {
          merged.taskSchedules = {
            placeLimitOrder: {
              ...this.defaultConfig.taskSchedules.placeLimitOrder,
              ...parsed.taskSchedules.placeLimitOrder
            },
            placeTargetStopLoss: {
              ...this.defaultConfig.taskSchedules.placeTargetStopLoss,
              ...parsed.taskSchedules.placeTargetStopLoss
            },
            updateTrailingStopLoss: {
              ...this.defaultConfig.taskSchedules.updateTrailingStopLoss,
              ...parsed.taskSchedules.updateTrailingStopLoss
            },
            cleanupTargetOrders: {
              ...this.defaultConfig.taskSchedules.cleanupTargetOrders,
              ...parsed.taskSchedules.cleanupTargetOrders
            },
            moveSLToEntry: {
              ...this.defaultConfig.taskSchedules.moveSLToEntry,
              ...parsed.taskSchedules.moveSLToEntry
            }
          };
        }

        // Deep merge scheduledFeatures
        if (parsed.scheduledFeatures) {
          merged.scheduledFeatures = {
            ...this.defaultConfig.scheduledFeatures,
            ...parsed.scheduledFeatures
          };
        }

        console.log('✅ [ConfigService] Config loaded from localStorage with deep merge');
        console.log('  - placeLimitOrder:', merged.taskSchedules.placeLimitOrder);
        console.log('  - placeTargetStopLoss:', merged.taskSchedules.placeTargetStopLoss);
        console.log('  - updateTrailingStopLoss:', merged.taskSchedules.updateTrailingStopLoss);
        console.log('  - cleanupTargetOrders:', merged.taskSchedules.cleanupTargetOrders);
        console.log('  - moveSLToEntry:', merged.taskSchedules.moveSLToEntry);
        return merged;
      }
    } catch (error) {
      console.error('❌ [ConfigService] Error loading config from localStorage:', error);
    }
    console.log('📝 [ConfigService] Using default config');
    console.log('  - placeLimitOrder:', this.defaultConfig.taskSchedules.placeLimitOrder);
    console.log('  - placeTargetStopLoss:', this.defaultConfig.taskSchedules.placeTargetStopLoss);
    console.log('  - updateTrailingStopLoss:', this.defaultConfig.taskSchedules.updateTrailingStopLoss);
    console.log('  - cleanupTargetOrders:', this.defaultConfig.taskSchedules.cleanupTargetOrders);
    console.log('  - moveSLToEntry:', this.defaultConfig.taskSchedules.moveSLToEntry);
    return { ...this.defaultConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AppConfig {
    return this.configSubject.value;
  }

  /**
   * Get specific config value
   */
  getConfigValue<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.configSubject.value[key];
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AppConfig>): void {
    const currentConfig = this.configSubject.value;

    // Perform DEEP merge for nested objects, especially taskSchedules and individual tasks
    const newConfig: AppConfig = {
      ...currentConfig,
      ...updates,
      taskSchedules: {
        placeLimitOrder: updates.taskSchedules?.placeLimitOrder
          ? { ...currentConfig.taskSchedules.placeLimitOrder, ...updates.taskSchedules.placeLimitOrder }
          : currentConfig.taskSchedules.placeLimitOrder,
        placeTargetStopLoss: updates.taskSchedules?.placeTargetStopLoss
          ? { ...currentConfig.taskSchedules.placeTargetStopLoss, ...updates.taskSchedules.placeTargetStopLoss }
          : currentConfig.taskSchedules.placeTargetStopLoss,
        updateTrailingStopLoss: updates.taskSchedules?.updateTrailingStopLoss
          ? { ...currentConfig.taskSchedules.updateTrailingStopLoss, ...updates.taskSchedules.updateTrailingStopLoss }
          : currentConfig.taskSchedules.updateTrailingStopLoss,
        cleanupTargetOrders: updates.taskSchedules?.cleanupTargetOrders
          ? { ...currentConfig.taskSchedules.cleanupTargetOrders, ...updates.taskSchedules.cleanupTargetOrders }
          : currentConfig.taskSchedules.cleanupTargetOrders,
        moveSLToEntry: updates.taskSchedules?.moveSLToEntry
          ? { ...currentConfig.taskSchedules.moveSLToEntry, ...updates.taskSchedules.moveSLToEntry }
          : currentConfig.taskSchedules.moveSLToEntry
      },
      scheduledFeatures: updates.scheduledFeatures
        ? { ...currentConfig.scheduledFeatures, ...updates.scheduledFeatures }
        : currentConfig.scheduledFeatures
    };

    console.log('📝 [ConfigService] updateConfig called with updates:', {
      placeLimitOrderDailyTime: updates.taskSchedules?.placeLimitOrder?.dailyTime,
      placeLimitOrderEnabled: updates.taskSchedules?.placeLimitOrder?.enabled,
      placeTargetStopLossDailyTime: updates.taskSchedules?.placeTargetStopLoss?.dailyTime,
      placeTargetStopLossEnabled: updates.taskSchedules?.placeTargetStopLoss?.enabled,
      updateTrailingStopLossDailyTime: updates.taskSchedules?.updateTrailingStopLoss?.dailyTime,
      updateTrailingStopLossEnabled: updates.taskSchedules?.updateTrailingStopLoss?.enabled
    });

    console.log('📝 [ConfigService] Final config before save - placeLimitOrder:', newConfig.taskSchedules.placeLimitOrder);
    console.log('📝 [ConfigService] Final config before save - placeTargetStopLoss:', newConfig.taskSchedules.placeTargetStopLoss);
    console.log('📝 [ConfigService] Final config before save - updateTrailingStopLoss:', newConfig.taskSchedules.updateTrailingStopLoss);
    console.log('📝 [ConfigService] Final config before save - cleanupTargetOrders:', newConfig.taskSchedules.cleanupTargetOrders);
    console.log('📝 [ConfigService] Final config before save - moveSLToEntry:', newConfig.taskSchedules.moveSLToEntry);

    try {
      const jsonStr = JSON.stringify(newConfig);
      console.log('📝 [ConfigService] Saving to localStorage - Full config:', newConfig);

      localStorage.setItem(this.CONFIG_KEY, jsonStr);
      console.log('✅ [ConfigService] Saved to localStorage with key:', this.CONFIG_KEY);

      // Broadcast the update to all subscribers
      this.configSubject.next(newConfig);
      console.log('✅ [ConfigService] Broadcasted config update to subscribers');

      console.log('✅ [ConfigService] Configuration updated and saved');
    } catch (error) {
      console.error('❌ [ConfigService] Error saving config to localStorage:', error);
    }
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    try {
      localStorage.removeItem(this.CONFIG_KEY);
      this.configSubject.next({ ...this.defaultConfig });
      console.log('✅ [ConfigService] Configuration reset to defaults');
    } catch (error) {
      console.error('❌ [ConfigService] Error resetting config:', error);
    }
  }

  /**
   * Debug method to check what's in localStorage
   */
  debugCheckLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📊 [ConfigService DEBUG] Current localStorage content:');
        console.log('  KEY:', this.CONFIG_KEY);
        console.log('  Full Config:', parsed);
        console.log('  Task Schedules:', {
          placeLimitOrder: parsed.taskSchedules?.placeLimitOrder,
          placeTargetStopLoss: parsed.taskSchedules?.placeTargetStopLoss,
          updateTrailingStopLoss: parsed.taskSchedules?.updateTrailingStopLoss
        });
      } else {
        console.log('📊 [ConfigService DEBUG] No config stored in localStorage');
      }
    } catch (error) {
      console.error('❌ [ConfigService DEBUG] Error checking localStorage:', error);
    }
  }

  /**
   * Debug method to check current config in memory
   */
  debugCheckCurrentConfig(): void {
    const config = this.configSubject.value;
    console.log('📊 [ConfigService DEBUG] Current config in memory:');
    console.log('  Full Config:', config);
    console.log('  Task Schedules:', {
      placeLimitOrder: config.taskSchedules.placeLimitOrder,
      placeTargetStopLoss: config.taskSchedules.placeTargetStopLoss,
      updateTrailingStopLoss: config.taskSchedules.updateTrailingStopLoss
    });
  }


  /**
   * Export configuration as JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.configSubject.value, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importConfig(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);
      this.updateConfig(imported);
      return true;
    } catch (error) {
      console.error('Error importing config:', error);
      return false;
    }
  }
}
