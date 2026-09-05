import { Injectable, NgZone } from '@angular/core';

/**
 * Mobile Platform Initialization Service
 *
 * Non-blocking mobile platform initialization service.
 * Initializes asynchronously to avoid blocking app startup.
 *
 * Uses global Capacitor API access to avoid dynamic import issues.
 */
@Injectable({
  providedIn: 'root'
})
export class MobileInitializationService {
  private isNativePlatform = false;
  private initialized = false;

  constructor(private ngZone: NgZone) {
    this.detectPlatform();
    this.initializeAsync();
  }

  /**
   * Detect if running on native platform
   */
  private detectPlatform(): void {
    const Capacitor = (window as any).Capacitor;
    this.isNativePlatform = Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform();

    if (this.isNativePlatform) {
      console.log('📱 Mobile platform detected');
    } else {
      console.log('🌐 Web platform detected');
    }
  }

  /**
   * Non-blocking async initialization
   * Uses setTimeout to defer execution and avoid blocking UI
   */
  private initializeAsync(): void {
    if (!this.isNativePlatform) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      setTimeout(async () => {
        try {
          await this.initializeCapacitorModules();
          this.initialized = true;
          console.log('✅ Mobile platform initialization complete');
        } catch (error) {
          console.error('❌ Mobile platform initialization failed:', error);
        }
      }, 100);
    });
  }

  /**
   * Initialize required Capacitor modules using global API access
   */
  private async initializeCapacitorModules(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const Capacitor = (window as any).Capacitor;

      if (!Capacitor) {
        console.warn('⚠️ Capacitor not available');
        return;
      }

      const LocalNotifications = Capacitor.Plugins?.LocalNotifications;
      const App = Capacitor.Plugins?.App;

      if (!LocalNotifications || !App) {
        console.warn('⚠️ Capacitor plugins not available');
        return;
      }

      // Request notification permissions
      try {
        const permissionResult = await LocalNotifications.requestPermissions();
        console.log('🔔 Notification permissions:', {
          display: permissionResult.display
        });

        if (permissionResult.display !== 'granted') {
          console.warn('⚠️ Notification permissions not granted');
        }
      } catch (permError) {
        console.warn('⚠️ Could not request notification permissions:', permError);
      }

      // Setup app state listeners
      try {
        await App.addListener('appStateChange', (state: any) => {
          const status = state.isActive ? '🟢 Foreground' : '🔴 Background';
          console.log(`📱 App state: ${status}`);
        });

        console.log('✅ Capacitor modules initialized');
      } catch (listenerError) {
        console.warn('⚠️ Could not setup app state listeners:', listenerError);
      }
    } catch (error) {
      console.error('❌ Failed to initialize Capacitor modules:', error);
    }
  }

  /**
   * Check if running on native platform
   */
  isNative(): boolean {
    return this.isNativePlatform;
  }

  /**
   * Request notification permissions after user action
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!this.isNativePlatform) {
      return true;
    }

    try {
      const Capacitor = (window as any).Capacitor;
      const LocalNotifications = Capacitor?.Plugins?.LocalNotifications;

      if (!LocalNotifications) {
        console.warn('⚠️ LocalNotifications plugin not available');
        return false;
      }

      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === 'granted';
      console.log(`Notification permission ${granted ? '✅ granted' : '❌ denied'}`);
      return granted;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Get app status info for debugging
   */
  async getAppStatusInfo(): Promise<any> {
    try {
      const Capacitor = (window as any).Capacitor;
      const App = Capacitor?.Plugins?.App;

      if (!App) {
        return { status: 'Capacitor App plugin not available' };
      }

      const info = await App.getInfo();
      return info;
    } catch (error) {
      console.error('Failed to get app status:', error);
      return { error: error };
    }
  }
}
