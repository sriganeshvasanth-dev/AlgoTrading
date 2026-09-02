# Mobile Background Scheduling Implementation Guide

## Problem Summary
Your Angular Crypto Currency Scanner app's scheduler services and jobs work perfectly in the web browser, but after converting to an APK, they only fire when the app is active. When the screen is locked or the app is backgrounded, all jobs stop executing until the app is brought back to the foreground.

### Why This Happens
- **On Web**: JavaScript `setInterval()` and `setTimeout()` run as long as the browser tab is open
- **On Mobile APK**: When the app is backgrounded or the device screen is locked, the entire JavaScript engine pauses. The OS suspends the WebView to save battery
- **Solution**: Use native Android scheduling mechanisms (LocalNotifications) that work independently of the JavaScript runtime

## Complete Solution Overview

This solution uses **3 layers**:
1. **JavaScript Timers** → Used when app is in foreground (browser/active app state)
2. **Capacitor LocalNotifications** → Used when app is backgrounded
3. **Android System Alarms** → Underlying native mechanism that survives background/lock state

---

## Step 1: Install Capacitor Plugins

Run this command in your project root:

```bash
npm install @capacitor/local-notifications @capacitor/app
npx cap sync android
```

This adds the required plugins to your Android project.

---

## Step 2: Update AndroidManifest.xml

Edit `android/app/src/main/AndroidManifest.xml` and add these permissions and receivers:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"
        android:networkSecurityConfig="@xml/network_security_config">

        <!-- Existing MainActivity -->
        <activity
            ...
        </activity>

        <!-- Existing FileProvider -->
        <provider
            ...
        </provider>

        <!-- ADD THIS: Boot receiver to restart jobs on device restart -->
        <receiver
            android:name="com.getcapacitor.localnotifications.NotificationBootReceiverKt"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>
    </application>

    <!-- Existing INTERNET permission -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- ADD THESE: Required for background scheduling -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />

</manifest>
```

### What These Permissions Do:
- `RECEIVE_BOOT_COMPLETED` - Restart jobs when device boots
- `WAKE_LOCK` - Keep device awake during job execution
- `SCHEDULE_EXACT_ALARM` - Precise job scheduling
- `POST_NOTIFICATIONS` - Show notification when job runs
- `VIBRATE` - Optional: vibrate when notification arrives

---

## Step 3: Create Background Scheduler Service

Create file: `src/app/core/services/background-scheduler.service.ts`

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BackgroundSchedulerService {
  private isNativePlatform = false;
  private notificationId = 10000;
  private scheduledTasks = new Map<string, any>();

  constructor() {
    this.initializeNativeSupport();
  }

  private initializeNativeSupport() {
    // Check if running on native mobile platform (Android/iOS)
    const isAndroid = (window as any).cordova !== undefined;
    const isCapacitor = (window as any).Capacitor !== undefined;
    this.isNativePlatform = isAndroid || isCapacitor;

    if (this.isNativePlatform) {
      console.log('✅ Native platform detected - using background scheduling');
      this.setupNativeNotifications();
    } else {
      console.log('ℹ️  Web platform detected - using JavaScript timers');
    }
  }

  private async setupNativeNotifications() {
    try {
      // Dynamically import Capacitor plugins only on native platform
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const { App } = await import('@capacitor/app');

      // Request notification permissions
      const result = await LocalNotifications.requestPermissions();
      console.log('Notification permissions:', result.display);

      // Handle app state changes
      App.addListener('appStateChange', (state: any) => {
        console.log(`App state changed: ${state.isActive ? 'Active' : 'Backgrounded'}`);
      });

      // Handle when notification is tapped/arrived
      LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (notification: any) => {
          const taskId = notification.notification.data?.taskId;
          const callback = this.scheduledTasks.get(taskId);
          if (callback) {
            console.log(`🔔 Executing background task: ${notification.notification.body}`);
            try {
              callback();
            } catch (error) {
              console.error('Error executing background task:', error);
            }
          }
        }
      );
    } catch (error) {
      console.warn('Failed to setup native notifications:', error);
    }
  }

  /**
   * Schedule a job to run at regular intervals
   * Automatically uses native scheduling on mobile, web timers on browser
   */
  async scheduleJob(
    jobName: string,
    intervalMinutes: number,
    callback: () => void
  ) {
    if (!this.isNativePlatform) {
      // Web: Use JavaScript setInterval
      console.log(`📅 Scheduling web job: ${jobName} every ${intervalMinutes} minutes`);
      setInterval(callback, intervalMinutes * 60 * 1000);
      return;
    }

    // Native: Use Capacitor LocalNotifications
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      const taskId = `${jobName}-${this.notificationId++}`;
      this.scheduledTasks.set(taskId, callback);

      const now = new Date();
      const nextRun = new Date(now.getTime() + intervalMinutes * 60 * 1000);

      // Determine repeat interval
      let repeatInterval: 'minute' | 'hour' | 'day' =  'minute';
      if (intervalMinutes >= 1440) repeatInterval = 'day';
      else if (intervalMinutes >= 60) repeatInterval = 'hour';

      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(taskId.split('-')[1]),
            title: 'Scheduler',
            body: jobName,
            schedule: {
              at: nextRun,
              every: repeatInterval,
            },
            smallIcon: 'ic_launcher',
            priority: 2,
            ongoing: true,
            data: { taskId },
          },
        ],
      });

      console.log(`🔄 Native job scheduled: ${jobName} every ${intervalMinutes} minutes`);
    } catch (error) {
      console.error('Failed to schedule native job:', error);
      // Fallback to web timer
      setInterval(callback, intervalMinutes * 60 * 1000);
    }
  }

  /**
   * Schedule a job to run once at a specific time
   */
  async scheduleJobAt(
    jobName: string,
    scheduledTime: Date,
    callback: () => void
  ) {
    if (!this.isNativePlatform) {
      // Web: Use JavaScript setTimeout
      const delay = scheduledTime.getTime() - new Date().getTime();
      if (delay > 0) {
        setTimeout(callback, delay);
        console.log(`📅 Web job scheduled for ${scheduledTime.toLocaleString()}`);
      }
      return;
    }

    // Native: Use LocalNotifications
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      const taskId = `${jobName}-${this.notificationId++}`;
      this.scheduledTasks.set(taskId, callback);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(taskId.split('-')[1]),
            title: 'Scheduler',
            body: jobName,
            schedule: { at: scheduledTime },
            smallIcon: 'ic_launcher',
            priority: 2,
            data: { taskId },
          },
        ],
      });

      console.log(`🔄 Native job scheduled: ${jobName} at ${scheduledTime.toLocaleString()}`);
    } catch (error) {
      console.error('Failed to schedule native job:', error);
      const delay = scheduledTime.getTime() - new Date().getTime();
      if (delay > 0) {
        setTimeout(callback, delay);
      }
    }
  }
}
```

---

## Step 4: Integrate with Your Task Scheduler

Update your existing `task-scheduler.service.ts` to use the background scheduler:

```typescript
// In your registerTask() method or similar:

// Instead of just using setInterval/setTimeout:
// setInterval(() => this.executeTask(task), intervalMs);

// Use the background scheduler:
this.backgroundScheduler.scheduleJob(
  task.taskName,
  task.config.intervalMinutes || 60,
  () => this.executeTask(task, 0)
);

// For scheduled daily jobs:
this.backgroundScheduler.scheduleJobAt(
  task.taskName,
  scheduledTime,
  () => this.executeTask(task, 0)
);
```

Example in your positions component:

```typescript
// Before (doesn't work on mobile when app is backgrounded):
setInterval(() => {
  this.targetManager.placeTargetsAndStopLossForAllPositions();
}, this.refreshIntervalMs);

// After (works on mobile even when backgrounded):
this.backgroundScheduler.scheduleJob(
  'Place Targets & Stop Loss',
  this.refreshIntervalMinutes,
  () => this.targetManager.placeTargetsAndStopLossForAllPositions()
);
```

---

## Step 5: Update Android Build Configuration

Edit `android/app/build.gradle`:

```gradle
android {
    compileSdk = rootProject.ext.compileSdkVersion  // Should be 34+

    defaultConfig {
        minSdkVersion 26  // ← IMPORTANT: Must be 26+ for reliable notifications
        targetSdkVersion rootProject.ext.targetSdkVersion  // Should be 34+
        // ... rest of config
    }
}
```

---

## Step 6: Build and Test the APK

```bash
# Clean and rebuild
rm -rf android/.gradle
npm run build:prod
npx cap sync android

# Build APK
cd android
./gradlew clean assembleDebug
cd ..

# APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Step 7: Testing on Device

### Test Case 1: App in Foreground
1. Install APK on device
2. Open app and navigate to Positions
3. Configure scheduler job from Config UI
4. Watch: Jobs should execute at scheduled times
5. ✅ Expected: Jobs fire normally

### Test Case 2: App in Background
1. Start a scheduled job
2. Press home button (app goes to background)
3. Wait for scheduled time
4. ✅ Expected: Job still fires (you'll see notification)

### Test Case 3: Screen Locked
1. Start a scheduled job
2. Lock the device
3. Wait for scheduled time
4. ✅ Expected: Job fires while locked
5. Unlock device and check logs

### Test Case 4: App Killed
1. ⚠️ Note: If app is force-stopped, background jobs WON'T run
   - This is Android's security model
   - Jobs resume when app is opened again
2. Native WorkManager could be used for persistent background (enterprise solution)

### Viewing Logs

While testing:

```bash
# Terminal 1: Watch Android logs
adb logcat | grep -E "(Scheduling|executing|Background|Notification)"

# Terminal 2: Run your app
npm run start  # or open in Android Studio and click Run
```

### Expected Log Output:

```
✅ Native platform detected - using background scheduling
🔄 Native job scheduled: Place Targets every 5 minutes
⏸️  App went to background
🔔 Executing background task: Place Targets & Stop Loss
✅ Task executed successfully
```

---

## Troubleshooting

### Problem: Jobs not firing when app is backgrounded

**Solution 1: Check Battery Optimization Settings**
```
Device Settings > Battery > Battery Optimization (or "Battery Saver")
→ Find your app and select "Don't optimize" or "Allow background activity"
```

**Solution 2: Verify Permissions Granted**
```bash
adb shell pm grant com.crypto.scanner android.permission.POST_NOTIFICATIONS
adb shell pm grant com.crypto.scanner android.permission.SCHEDULE_EXACT_ALARM
```

**Solution 3: Check minSdkVersion**
```gradle
// In android/app/build.gradle:
defaultConfig {
    minSdkVersion 26  // Must be 26 or higher
}
```

**Solution 4: Increase Notification Priority**
```typescript
// Already done in service above:
priority: 2,        // High priority
ongoing: true,      // Keeps notification visible
```

### Problem: "Cannot find module @capacitor/local-notifications"

**Solution**: Run npm install again:
```bash
npm install @capacitor/local-notifications @capacitor/app
npx cap sync android
```

### Problem: Notifications not showing

- User may have disabled notifications in device settings
- Check: Device Settings > Apps > Your App > Notifications > Allow
- Or: Device Settings > Notification > App notifications for your app

### Problem: Jobs work for a while then stop

- Device might be going into deep sleep (Doze mode)
- **Solution**: Add app to device battery whitelist (see Battery Optimization above)

---

## Performance Considerations

### Battery Usage
- ✅ Good: Jobs only run at scheduled intervals
- ⚠️ Monitor: Frequent jobs (< 15 minutes) use more battery
- 💡 Recommendation: Keep intervals >= 5 minutes for crypto scanner

### Network
- ✅ Good: Each job makes its own API calls
- ⚠️ Monitor: Ensure API calls complete before next job starts
- 💡 Add timeout/abort logic to prevent hanging requests

### Notification Display
- Jobs show a persistent notification while running
- Set `ongoing: false` if you don't want persistent notification
- Users can dismiss individual notifications

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│    User's Business Logic/Component      │
│   (e.g., placeTargetsAndStopLoss)      │
└────────────────┬────────────────────────┘
                 │
     ┌───────────▼───────────┐
     │ TaskSchedulerService  │
     │   (Your service)      │
     └───────────┬───────────┘
                 │
    ┌────────────▼────────────┐
    │ BGSchedulerService      │
    │ (NEW SERVICE)           │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │ Platform Check          │
    └─────┬──────────┬────────┘
          │          │
    ┌─────▼──┐  ┌────▼──────┐
    │  Web   │  │   Native  │
    │ JS     │  │ (Android) │
    │Timers  │  │ Notif API │
    └─────┬──┘  └────┬──────┘
          │          │
          │     ┌─────▼──────┐
          │     │ Android OS │
          │     │ Alarm Mgr  │
          │     │ (Background│
          │     │  execution)│
          │     └────────────┘
```

---

## Complete Workflow Example

### Scenario: Run "Place Targets" every 5 minutes, even when app is backgrounded

**1. Configuration (in Config UI)**
```
Job Name: Place Targets & Stop Loss
Interval: 5 minutes
Enabled: true
```

**2. In your positions.component.ts**
```typescript
setupScheduler() {
  this.taskScheduler.registerTask({
    taskId: 'place-targets-job',
    taskName: 'Place Targets & Stop Loss',
    taskType: 'interval',
    intervalMinutes: 5,
    enabled: true,
    executor: () => {
      this.targetManager.placeTargetsAndStopLossForAllPositions();
    }
  });
}
```

**3. In task-scheduler.service.ts**
```typescript
registerTask(config: TaskConfig) {
  // ... validation ...

  // On mobile, this automatically uses native scheduling
  this.backgroundScheduler.scheduleJob(
    config.taskName,
    config.intervalMinutes,
    () => config.executor()
  );
}
```

**4. Runtime Behavior**
```
App Open
  ↓
Job runs every 5 minutes via JavaScript timer
  ↓
User locks screen / minimizes app
  ↓
JavaScript pauses → native LocalNotifications takes over
  ↓
Job still runs every 5 minutes via Android OS
  ↓
User unlocks / brings app back
  ↓
JavaScript resumes → native scheduling pauses
  ↓
Cycle repeats
```

---

## Next Steps

1. **Backup your code**: `git commit -m "Before background scheduling update"`
2. **Copy BackgroundSchedulerService** to your services folder
3. **Update AndroidManifest.xml** with permissions
4. **Update android/app/build.gradle** minSdkVersion
5. **Integrate into TaskSchedulerService**
6. **Run `npm install @capacitor/local-notifications @capacitor/app`**
7. **Build APK**: `npm run build:prod && npx cap open android`
8. **Test on device** with screen locked
9. **Fine-tune** battery/permissions if needed

---

## References

- [Capacitor LocalNotifications Docs](https://capacitorjs.com/docs/apis/local-notifications)
- [Android AlarmManager](https://developer.android.com/training/scheduling/alarms)
- [Android Doze Mode](https://developer.android.com/training/monitoring-device-state/doze-standby)
- [Capacitor Android Configuration](https://capacitorjs.com/docs/android)

---

## Support

If issues persist:
1. Check logcat: `adb logcat | grep -i "notification\|alarm"`
2. Verify minSdkVersion is ≥ 26 in build.gradle
3. Verify permissions in AndroidManifest.xml
4. Test on different Android versions (recommend API 28+)
5. Check device isn't in aggressive power-saving mode
