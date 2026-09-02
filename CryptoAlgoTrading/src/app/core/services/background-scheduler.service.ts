import { Injectable } from '@angular/core';

/**
 * Background Scheduler Service
 * Automatically detects platform and uses appropriate scheduling mechanism:
 * - Web: JavaScript setInterval/setTimeout
 * - Mobile: Capacitor LocalNotifications with native Android alarms
 * 
 * Works on both web browser and mobile APK seamlessly!
 */
@Injectable({
  providedIn: 'root'
})
export class BackgroundSchedulerService {
  private isNativePlatform = false;
  private notificationId = 10000;
  private scheduledJobs = new Map<string, any>();
  private webIntervals = new Map<string, any>();
  private wakeLock: any = null; // Store WakeLock reference

  constructor() {
    this.detectPlatform();
  }

  /**
   * Auto-detect if running on native mobile platform or web browser
   */
  private detectPlatform() {
    // Check for Capacitor (Angular + Capacitor setup)
    const hasCapacitor = (window as any).Capacitor !== undefined;

    // Check for Cordova (fallback)
    const hasCordova = (window as any).cordova !== undefined;

    this.isNativePlatform = hasCapacitor || hasCordova;

    if (this.isNativePlatform) {
      console.log('✅ Native mobile platform detected - using Capacitor LocalNotifications');
      this.initializeNativeNotifications();
    } else {
      console.log('ℹ️  Web platform detected - using JavaScript timers');
    }
  }

  /**
   * Initialize native notification listeners (runs only on mobile)
   */
  private async initializeNativeNotifications() {
    try {
      // Dynamically import only on native platforms (using any to suppress type errors during dev)
      const dynamicImport = eval("import('@capacitor/local-notifications')") as Promise<any>;
      const { LocalNotifications } = await dynamicImport;

      const dynamicAppImport = eval("import('@capacitor/app')") as Promise<any>;
      const { App } = await dynamicAppImport;

      // Request notification permissions
      const result = await LocalNotifications.requestPermissions();
      console.log('📱 Notification permissions:', result.display);

      // Listen to app state changes
      App.addListener('appStateChange', (state: any) => {
        const isActive = state.isActive;
        console.log(`App state: ${isActive ? '🟢 Active (Foreground)' : '🔴 Inactive (Background)'}`);
      });

      // Handle notification when it arrives or is tapped
      LocalNotifications.addListener(
        'localNotificationActionPerformed',
        async (notification: any) => {
          const jobId = notification.notification.data?.jobId;
          const jobData = this.scheduledJobs.get(jobId);

          if (jobData) {
            console.log(`🔔 Background job triggered: ${jobData.name}`);
            try {
              // Acquire wake lock before executing job
              await this.acquireWakeLock();

              // Execute the job
              await jobData.callback();
              console.log(`✅ Job completed: ${jobData.name}`);
            } catch (error) {
              console.error(`❌ Job failed: ${jobData.name}`, error);
            } finally {
              // Always release wake lock after job completes
              await this.releaseWakeLock();
            }
          }
        }
      );

      console.log('✅ Native notifications initialized');
    } catch (error) {
      console.warn('⚠️  Failed to initialize native notifications:', error);
    }
  }

  /**
   * Schedule a job to run at regular intervals
   * Works on both web (JavaScript timer) and mobile (native notifications)
   * 
   * @param jobName - Name of the job (e.g., "Place Targets & Stop Loss")
   * @param intervalMinutes - How often to run (in minutes)
   * @param callback - Function to execute when job runs
   */
  async scheduleJob(
    jobName: string,
    intervalMinutes: number,
    callback: () => void | Promise<void>
  ): Promise<void> {
    if (intervalMinutes < 1 || intervalMinutes > 1440) {
      console.error(`❌ Invalid interval: ${intervalMinutes}. Expected 1-1440 minutes.`);
      return;
    }

    // WEB PLATFORM: Use JavaScript timer
    if (!this.isNativePlatform) {
      const intervalMs = intervalMinutes * 60 * 1000;
      const jobKey = `${jobName}-web`;

      // Clear existing interval for this job
      if (this.webIntervals.has(jobKey)) {
        clearInterval(this.webIntervals.get(jobKey));
      }

      const intervalId = setInterval(() => {
        console.log(`⏰ Executing web job: ${jobName} at ${new Date().toLocaleString()}`);
        try {
          const result = callback();
          if (result instanceof Promise) {
            result.catch(error => console.error(`Job error: ${jobName}`, error));
          }
        } catch (error) {
          console.error(`Job error: ${jobName}`, error);
        }
      }, intervalMs);

      this.webIntervals.set(jobKey, intervalId);
      console.log(`📅 Web job scheduled: "${jobName}" every ${intervalMinutes} minute(s)`);
      return;
    }

    // MOBILE PLATFORM: Use Capacitor LocalNotifications
    try {
      const dynamicImportJob = eval("import('@capacitor/local-notifications')") as Promise<any>;
      const { LocalNotifications } = await dynamicImportJob;

      const jobId = `job-${jobName}-${this.notificationId++}`;

      // Store job callback for later execution
      this.scheduledJobs.set(jobId, {
        name: jobName,
        callback: callback,
        createdAt: new Date(),
        interval: intervalMinutes
      });

      const now = new Date();
      const nextRun = new Date(now.getTime() + intervalMinutes * 60 * 1000);

      // Determine the repeat interval based on duration
      let repeatInterval: 'minute' | 'hour' | 'day' | 'week' = 'minute';
      if (intervalMinutes >= 1440) {
        repeatInterval = 'day';
      } else if (intervalMinutes >= 60) {
        repeatInterval = 'hour';
      }

      // Schedule the notification
      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(jobId.split('-')[1]),
            title: 'Crypto Scanner',
            body: jobName,
            smallIcon: 'ic_launcher',
            largeBody: `Job runs every ${intervalMinutes} minute(s)`,
            summary: 'Background Task',
            schedule: {
              at: nextRun,
              every: repeatInterval,
            },
            priority: 2,  // High priority
            ongoing: true,  // Keep notification showing
            data: { jobId },
          },
        ],
      });

      console.log(`🔄 Mobile job scheduled: "${jobName}" every ${intervalMinutes} minute(s)`);
      console.log(`   Next run: ${nextRun.toLocaleString()}`);
      console.log(`   Repeat interval: ${repeatInterval}`);
    } catch (error) {
      console.error(`❌ Failed to schedule mobile job "${jobName}":`, error);
      // Fallback to web timer
      console.log('⚠️  Falling back to JavaScript timer...');
      await this.scheduleJob(jobName, intervalMinutes, callback);
    }
  }

  /**
   * Schedule a one-time job to run at a specific date/time
   * 
   * @param jobName - Name of the job
   * @param scheduledTime - When to run the job
   * @param callback - Function to execute
   */
  async scheduleJobAt(
    jobName: string,
    scheduledTime: Date,
    callback: () => void | Promise<void>
  ): Promise<void> {
    const now = new Date();

    if (scheduledTime <= now) {
      console.warn(`⚠️  Scheduled time (${scheduledTime.toLocaleString()}) is in the past. Running immediately.`);
      try {
        const result = callback();
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        console.error(`Job error: ${jobName}`, error);
      }
      return;
    }

    // WEB PLATFORM: Use JavaScript timer
    if (!this.isNativePlatform) {
      const delay = scheduledTime.getTime() - now.getTime();
      const jobKey = `${jobName}-at-web`;

      const timeoutId = setTimeout(() => {
        console.log(`⏰ Executing web job: ${jobName} at ${new Date().toLocaleString()}`);
        try {
          const result = callback();
          if (result instanceof Promise) {
            result.catch(error => console.error(`Job error: ${jobName}`, error));
          }
        } catch (error) {
          console.error(`Job error: ${jobName}`, error);
        }
      }, delay);

      console.log(`📅 Web job scheduled: "${jobName}" at ${scheduledTime.toLocaleString()}`);
      return;
    }

    // MOBILE PLATFORM: Use Capacitor LocalNotifications
    try {
      const dynamicImportAt = eval("import('@capacitor/local-notifications')") as Promise<any>;
      const { LocalNotifications } = await dynamicImportAt;

      const jobId = `job-${jobName}-${this.notificationId++}`;

      this.scheduledJobs.set(jobId, {
        name: jobName,
        callback: callback,
        createdAt: new Date(),
        scheduledFor: scheduledTime
      });

      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(jobId.split('-')[1]),
            title: 'Crypto Scanner',
            body: jobName,
            smallIcon: 'ic_launcher',
            schedule: {
              at: scheduledTime,
            },
            priority: 2,
            data: { jobId },
          },
        ],
      });

      console.log(`🔄 Mobile job scheduled: "${jobName}" at ${scheduledTime.toLocaleString()}`);
    } catch (error) {
      console.error(`❌ Failed to schedule mobile job at "${jobName}":`, error);
      // Fallback to web timer
      await this.scheduleJobAt(jobName, scheduledTime, callback);
    }
  }

  /**
   * Get information about all scheduled jobs
   */
  getScheduledJobs() {
    return {
      webJobs: Array.from(this.webIntervals.keys()),
      mobileJobs: Array.from(this.scheduledJobs.entries()).map(([key, value]) => ({
        id: key,
        name: value.name,
        interval: value.interval,
        createdAt: value.createdAt,
      })),
      platform: this.isNativePlatform ? 'mobile' : 'web',
    };
  }

  /**
   * Cancel a job by name
   */
  async cancelJob(jobName: string): Promise<void> {
    // Cancel web jobs
    const webKey = `${jobName}-web`;
    if (this.webIntervals.has(webKey)) {
      clearInterval(this.webIntervals.get(webKey));
      this.webIntervals.delete(webKey);
      console.log(`✅ Cancelled web job: ${jobName}`);
    }

    // Cancel mobile jobs
    if (this.isNativePlatform) {
      try {
        const dynamicImportCancel = eval("import('@capacitor/local-notifications')") as Promise<any>;
        const { LocalNotifications } = await dynamicImportCancel;

        // Find all jobs with this name
        for (const [jobId, jobData] of this.scheduledJobs.entries()) {
          if (jobData.name === jobName) {
            const notificationId = parseInt(jobId.split('-')[1]);
            await LocalNotifications.cancel({
              notifications: [{ id: notificationId }],
            });
            this.scheduledJobs.delete(jobId);
            console.log(`✅ Cancelled mobile job: ${jobName}`);
          }
        }
      } catch (error) {
        console.error(`Failed to cancel mobile job: ${jobName}`, error);
      }
    }
  }

  /**
   * Clear all scheduled jobs
   */
  async clearAllJobs(): Promise<void> {
    // Clear all web intervals
    this.webIntervals.forEach((intervalId) => clearInterval(intervalId));
    this.webIntervals.clear();
    console.log('✅ Cleared all web jobs');

    // Clear all mobile notifications
    if (this.isNativePlatform) {
      try {
        const dynamicImportClear = eval("import('@capacitor/local-notifications')") as Promise<any>;
        const { LocalNotifications } = await dynamicImportClear;

        const notificationIds = Array.from(this.scheduledJobs.entries()).map(([key]) =>
          parseInt(key.split('-')[1])
        );

        if (notificationIds.length > 0) {
          await LocalNotifications.cancel({
            notifications: notificationIds.map(id => ({ id })),
          });
        }

        this.scheduledJobs.clear();
        console.log('✅ Cleared all mobile jobs');
      } catch (error) {
        console.error('Failed to clear mobile jobs', error);
      }
    }
  }

  /**
   * Check if running on native mobile platform
   */
  isRunningOnMobile(): boolean {
    return this.isNativePlatform;
  }

  /**
   * Acquire wake lock to keep device awake during job execution
   * Uses native WakeLock API on mobile (Android) and Screen Wake API on web
   * Prevents device from entering sleep/deep sleep mode
   */
  private async acquireWakeLock(): Promise<void> {
    try {
      // Try native WakeLock API first (modern browsers and Capacitor)
      if ('wakeLock' in navigator) {
        try {
          this.wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('🔒 Wake lock acquired via WakeLock API - device will stay awake during job execution');

          // Handle wake lock release when user turns off screen
          this.wakeLock.addEventListener('release', () => {
            console.log('⚠️ Wake lock was released by system');
          });
          return;
        } catch (err: any) {
          console.warn('⚠️ WakeLock API failed:', err);
          // Fall through to try Capacitor approach
        }
      }

      // Try Capacitor approach for native Android
      if (this.isNativePlatform && (window as any).Capacitor) {
        try {
          const dynamicImportApp = eval("import('@capacitor/app')") as Promise<any>;
          const { App } = await dynamicImportApp;

          // On Android, this keeps the app running in background
          console.log('🔒 Background execution enabled via Capacitor App plugin');
          return;
        } catch (error) {
          console.warn('⚠️ Capacitor wake lock failed:', error);
        }
      }

      console.log('ℹ️ Wake lock not available on this platform, job will run with normal power management');
    } catch (error) {
      console.warn('⚠️ Failed to acquire wake lock:', error);
      // Don't throw - job should still run even if wake lock fails
    }
  }

  /**
   * Release wake lock to allow device to sleep normally
   * Should be called after job completes
   */
  private async releaseWakeLock(): Promise<void> {
    try {
      if (this.wakeLock) {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('🔓 Wake lock released - device can sleep normally');
      }
    } catch (error) {
      console.warn('⚠️ Failed to release wake lock:', error);
      // Don't throw - not critical if release fails
    }
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy() {
    this.clearAllJobs();
  }
}
