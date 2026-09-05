import { Injectable, OnDestroy } from '@angular/core';

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
export class BackgroundSchedulerService implements OnDestroy {
  private isNativePlatform = false;
  private notificationId = 10000;
  private scheduledJobs = new Map<string, any>();
  private webIntervals = new Map<string, any>();
  private wakeLock: any = null;
  // Map notification ID to job ID (workaround for Capacitor limitation where custom data isn't reliably passed)
  private notificationIdToJobIdMap = new Map<number, string>();

  constructor() {
    console.log('🚀 BackgroundSchedulerService constructor called');
    this.detectPlatform();
    if (this.isNativePlatform) {
      console.log('📱 Native platform detected, deferring initialization');
      this.deferInitialization();
    } else {
      console.log('🌐 Web platform detected, timers will be used');
    }
  }

  /**
   * Auto-detect if running on native mobile platform or web browser
   */
  private detectPlatform() {
    const hasCapacitor = (window as any).Capacitor !== undefined;
    const hasCordova = (window as any).cordova !== undefined;
    this.isNativePlatform = hasCapacitor || hasCordova;

    if (this.isNativePlatform) {
      console.log('✅ Native mobile platform detected - using Capacitor LocalNotifications');
    } else {
      console.log('ℹ️ Web platform detected - using JavaScript timers');
    }
  }

  /**
   * Initialize native notifications (CRITICAL: must be called before any tasks are scheduled)
   */
  private setupNativeListeners() {
    try {
      const Capacitor = (window as any).Capacitor;
      if (!Capacitor?.Plugins?.LocalNotifications) {
        console.warn('⚠️ Capacitor LocalNotifications not available yet');
        // Retry after a short delay
        setTimeout(() => this.setupNativeListeners(), 500);
        return;
      }

      const LocalNotifications = Capacitor.Plugins.LocalNotifications;

      // Job execution function
      const executeJobFromNotification = async (notification: any) => {
        // Debug: Log the full notification structure
        console.log('📦 Full notification object:', JSON.stringify(notification, null, 2));

        // Extract notification ID (this is reliably passed through on Android)
        const notificationId = notification?.notification?.id || notification?.id;
        console.log(`📬 Notification received with ID: ${notificationId}`);

        // Use the notificationId -> jobId map (workaround for Capacitor limitation)
        const jobId = this.notificationIdToJobIdMap.get(notificationId);
        const jobData = jobId ? this.scheduledJobs.get(jobId) : undefined;

        console.log(`🔍 Looked up jobId from notificationId ${notificationId}: ${jobId}, found job: ${!!jobData}`);

        if (jobData) {
          console.log(`🔔 Executing job: ${jobData.name}`);
          try {
            await this.acquireWakeLock();
            const result = jobData.callback();
            if (result instanceof Promise) {
              await result;
            }
            console.log(`✅ Job completed: ${jobData.name}`);

            // If recurring, reschedule
            if (jobData.isRecurring && jobData.intervalMinutes && jobId) {
              const nextRunTime = new Date(Date.now() + jobData.intervalMinutes * 60 * 1000);
              try {
                const LocalNotifs = (window as any).Capacitor?.Plugins?.LocalNotifications;
                if (LocalNotifs) {
                  const nextNotificationId = this.notificationId++;
                  // Store the mapping for the next notification
                  this.notificationIdToJobIdMap.set(nextNotificationId, jobId);

                  await LocalNotifs.schedule({
                    notifications: [
                      {
                        id: nextNotificationId,
                        title: 'Scheduled Task',
                        body: jobData.name,
                        // Note: custom 'data' is not reliably passed on Android, so we DON'T rely on it
                        schedule: {
                          at: nextRunTime
                        }
                      }
                    ]
                  });
                  console.log(`📅 Recurring job rescheduled: ${jobData.name} (next: ${nextRunTime.toLocaleString()}, notificationId: ${nextNotificationId})`);
                }
              } catch (error) {
                console.error(`Failed to reschedule: ${jobData.name}`, error);
              }
            } else {
              // Non-recurring job: clean up the mapping
              this.notificationIdToJobIdMap.delete(notificationId);
            }
          } catch (error) {
            console.error(`❌ Job failed: ${jobData.name}`, error);
          } finally {
            await this.releaseWakeLock();
          }
        } else {
          console.warn(`⚠️ Job data not found for notificationId: ${notificationId}, jobId: ${jobId}. Available jobs:`, 
            Array.from(this.scheduledJobs.keys()), 'Notification->Job mappings:', 
            Array.from(this.notificationIdToJobIdMap.entries()));
             }
            };

            // Register BOTH listeners
            LocalNotifications.addListener('localNotificationReceived', executeJobFromNotification)
              .then(() => console.log('✅ Listener registered: localNotificationReceived'))
              .catch((e: any) => console.warn('⚠️ localNotificationReceived failed:', e));

            LocalNotifications.addListener('localNotificationActionPerformed', executeJobFromNotification)
              .then(() => console.log('✅ Listener registered: localNotificationActionPerformed'))
              .catch((e: any) => console.warn('⚠️ localNotificationActionPerformed failed:', e));

            // Request permissions
            LocalNotifications.requestPermissions()
              .then((result: any) => console.log('🔔 Notification permissions:', result.display))
              .catch((e: any) => console.warn('⚠️ Permission request failed:', e));

            console.log('✅ Native notification listeners initialized');
          } catch (error) {
            console.error('Failed to setup native listeners:', error);
          }
        }

  /**
   * Defer initialization to avoid blocking app startup (but still attach listeners early)
   */
  private deferInitialization() {
    console.log('⏱️ Deferring native initialization...');
    // Try to setup listeners immediately
    this.setupNativeListeners();

    // Also defer initialization of other native features
    setTimeout(() => {
      console.log('⏱️ Deferred initialization timeout fired, initializing permissions and app state listener');
      this.initializeNativeNotifications().catch(error => {
        console.error('Failed to initialize native notifications:', error);
      });
    }, 200);
  }

  /**
   * Initialize native notification permissions and app state listener
   * NOTE: Actual event listeners are registered in setupNativeListeners()
   */
  private async initializeNativeNotifications() {
    try {
      const Capacitor = (window as any).Capacitor;
      if (!Capacitor) {
        console.warn('⚠️ Capacitor not available');
        return;
      }

      const LocalNotifications = Capacitor.Plugins.LocalNotifications;
      const App = Capacitor.Plugins.App;

      if (!LocalNotifications || !App) {
        console.warn('⚠️ LocalNotifications or App plugin not available');
        return;
      }

      // Request notification permissions
      try {
        const result = await LocalNotifications.requestPermissions();
        console.log('📱 Notification permissions:', result.display);
      } catch (permError) {
        console.warn('⚠️ Could not request permissions:', permError);
      }

      // Setup app state listener
      try {
        App.addListener('appStateChange', (state: any) => {
          const isActive = state.isActive;
          console.log(`App state: ${isActive ? '🟢 Active (Foreground)' : '🔴 Inactive (Background)'}`);
        });
      } catch (listenerError) {
        console.warn('⚠️ Could not setup app state listener:', listenerError);
      }

      console.log('✅ Native notifications initialized');
    } catch (error) {
      console.warn('⚠️ Failed to initialize native notifications:', error);
    }
  }

  /**
   * Schedule a job to run at regular intervals
   * Hybrid approach: Native for background, web timer for foreground
   * 
   * @param jobName - Name of the job
   * @param intervalMinutes - How often to run (in minutes)
   * @param callback - Function to execute when job runs
   */
  async scheduleJob(
    jobName: string,
    intervalMinutes: number,
    callback: () => (void | Promise<void>)
  ): Promise<void> {
    if (intervalMinutes < 1 || intervalMinutes > 1440) {
      console.error(`❌ Invalid interval: ${intervalMinutes}. Expected 1-1440 minutes.`);
      return;
    }

    const jobId = `${jobName}-recurring-${Date.now()}`;

    // Store the callback for when notifications fire
    this.scheduledJobs.set(jobId, {
      name: jobName,
      callback,
      intervalMinutes,
      isRecurring: true
    });

    // Try native scheduling first (for background execution on Android)
    if (this.isNativePlatform) {
      try {
        const Capacitor = (window as any).Capacitor;
        const LocalNotifications = Capacitor?.Plugins?.LocalNotifications;

        if (LocalNotifications) {
          // Schedule the first notification
          const firstRunTime = new Date(Date.now() + 5000); // Run after 5 seconds

          // Use the current notificationId
          const notifId = this.notificationId++;
          // Store the mapping: notificationId -> jobId
          this.notificationIdToJobIdMap.set(notifId, jobId);

          await LocalNotifications.schedule({
            notifications: [
              {
                id: notifId,
                title: 'Scheduled Task',
                body: jobName,
                // NOTE: custom 'data' is not reliably passed on Android, so we don't rely on it
                // Instead, we use the notificationId -> jobId mapping
                schedule: {
                  at: firstRunTime
                }
              }
            ]
          });

          console.log(`📅 Native recurring job scheduled: ${jobName} (first run: ${firstRunTime.toLocaleString()}, every ${intervalMinutes} min, notificationId: ${notifId})`);
          return;
        }
      } catch (error) {
        console.warn(`⚠️ Native recurring scheduling failed for ${jobName}, falling back to web timer:`, error);
      }
    }

    // Fallback: Use web timer (works while app is in foreground)
    const intervalMs = intervalMinutes * 60 * 1000;
    const jobKey = `${jobName}-interval-fallback`;

    if (this.webIntervals.has(jobKey)) {
      clearInterval(this.webIntervals.get(jobKey));
    }

    const intervalId = setInterval(async () => {
      try {
        console.log(`⏰ Web timer: Executing job ${jobName} at ${new Date().toLocaleString()}`);
        await this.acquireWakeLock();
        const result = callback();
        if (result instanceof Promise) {
          await result;
        }
        console.log(`✅ Web timer: Job completed: ${jobName}`);
      } catch (error) {
        console.error(`❌ Web timer: Job failed: ${jobName}`, error);
      } finally {
        await this.releaseWakeLock();
      }
    }, intervalMs);

    this.webIntervals.set(jobKey, intervalId);
    console.log(`📅 Web fallback recurring job: ${jobName} every ${intervalMinutes} minutes`);
  }

  /**
   * Schedule a job to run at a specific time
   * Hybrid approach: Uses native Android scheduling when available, web timer as fallback
   *
   * @param jobName - Name of the job
   * @param scheduledTime - When to run
   * @param callback - Function to execute
   */
  async scheduleJobAt(
    jobName: string,
    scheduledTime: Date,
    callback: () => (void | Promise<void>)
  ): Promise<void> {
    const now = new Date();

    if (scheduledTime <= now) {
      console.warn(`⚠️ Scheduled time (${scheduledTime.toLocaleString()}) is in the past. Running immediately.`);
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

    const delayMs = scheduledTime.getTime() - now.getTime();
    const jobId = `${jobName}-at-${scheduledTime.getTime()}`;

    // Store the callback so it can be executed when the notification fires
    this.scheduledJobs.set(jobId, {
      name: jobName,
      callback,
      scheduledTime,
      isRecurring: false
    });

    // Try native scheduling first (for background execution on Android)
    if (this.isNativePlatform) {
      try {
        const Capacitor = (window as any).Capacitor;
        const LocalNotifications = Capacitor?.Plugins?.LocalNotifications;

        if (LocalNotifications) {
          // Use the current notificationId
          const notifId = this.notificationId++;
          // Store the mapping: notificationId -> jobId
          this.notificationIdToJobIdMap.set(notifId, jobId);

          await LocalNotifications.schedule({
            notifications: [
              {
                id: notifId,
                title: 'Scheduled Task',
                body: jobName,
                // NOTE: custom 'data' is not reliably passed on Android, so we don't rely on it
                // Instead, we use the notificationId -> jobId mapping
                schedule: {
                  at: scheduledTime
                }
              }
            ]
          });

          const timeUntilRun = Math.round(delayMs / 1000);
          console.log(`📅 Native job scheduled: ${jobName} at ${scheduledTime.toLocaleString()} (${timeUntilRun}s from now, notificationId: ${notifId})`);
          return;
        }
      } catch (error) {
        console.warn(`⚠️ Native scheduling failed for ${jobName}, falling back to web timer:`, error);
      }
    }

    // Fallback: Use web timer (works while app is in foreground)
    const jobKey = `${jobName}-at-${scheduledTime.getTime()}-fallback`;
    if (this.webIntervals.has(jobKey)) {
      clearTimeout(this.webIntervals.get(jobKey));
    }

    const timeoutId = setTimeout(async () => {
      try {
        console.log(`⏰ Web timer: Executing job ${jobName} at ${new Date().toLocaleString()}`);
        await this.acquireWakeLock();
        const result = callback();
        if (result instanceof Promise) {
          await result;
        }
        console.log(`✅ Web timer: Job completed: ${jobName}`);
      } catch (error) {
        console.error(`❌ Web timer: Job failed: ${jobName}`, error);
      } finally {
        await this.releaseWakeLock();
        this.webIntervals.delete(jobKey);
        this.scheduledJobs.delete(jobId);
      }
    }, delayMs);

    this.webIntervals.set(jobKey, timeoutId);
    const timeUntilRun = Math.round(delayMs / 1000);
    console.log(`📅 Web fallback scheduled: ${jobName} at ${scheduledTime.toLocaleString()} (${timeUntilRun}s from now)`);
  }

  /**
   * Cancel a scheduled job
   *
   * @param jobName - Name of the job to cancel
   */
  async cancelJob(jobName: string): Promise<void> {
    try {
      // Cancel web timer
      const webKey = `${jobName}-web`;
      if (this.webIntervals.has(webKey)) {
        clearInterval(this.webIntervals.get(webKey));
        this.webIntervals.delete(webKey);
      }

      // Cancel native job
      for (const [jobId, jobData] of this.scheduledJobs.entries()) {
        if (jobData.name === jobName) {
          this.scheduledJobs.delete(jobId);
        }
      }

      console.log(`✅ Job cancelled: ${jobName}`);
    } catch (error) {
      console.error(`Failed to cancel job: ${jobName}`, error);
    }
  }

  /**
   * Clear all scheduled jobs
   */
  async clearAllJobs(): Promise<void> {
    try {
      // Clear all web intervals
      for (const intervalId of this.webIntervals.values()) {
        clearInterval(intervalId);
        clearTimeout(intervalId);
      }
      this.webIntervals.clear();

      // Clear all scheduled jobs
      this.scheduledJobs.clear();

      console.log('✅ All jobs cleared');
    } catch (error) {
      console.error('Failed to clear jobs:', error);
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
   */
  private async acquireWakeLock(): Promise<void> {
    try {
      if ('wakeLock' in navigator) {
        try {
          this.wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('🔒 Wake lock acquired via WakeLock API');
          return;
        } catch (err: any) {
          console.warn('⚠️ WakeLock API failed:', err);
        }
      }

      if (this.isNativePlatform && (window as any).Capacitor) {
        try {
          const Capacitor = (window as any).Capacitor;
          if (Capacitor && Capacitor.Plugins.App) {
            console.log('🔒 Using Capacitor App for background execution');
            return;
          }
        } catch (error) {
          console.warn('⚠️ Capacitor approach failed:', error);
        }
      }

      console.log('ℹ️ Wake lock not available');
    } catch (error) {
      console.warn('⚠️ Failed to acquire wake lock:', error);
    }
  }

  /**
   * Release wake lock to allow device to sleep normally
   */
  private async releaseWakeLock(): Promise<void> {
    try {
      if (this.wakeLock) {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('🔓 Wake lock released');
      }
    } catch (error) {
      console.warn('⚠️ Failed to release wake lock:', error);
    }
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.clearAllJobs().catch((error: any) => {
      console.warn('Cleanup error:', error);
    });
  }
}
