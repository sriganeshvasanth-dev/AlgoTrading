# Android Background Execution Setup Guide

## Problem
Scheduler/Jobs only fire when the app is active. When the screen is locked or app is backgrounded, timers stop firing.

## Solution Overview
This guide implements three layers of background execution:
1. **JavaScript timers** (for web/foreground)
2. **Capacitor LocalNotifications** (for mobile background execution)
3. **Android native configuration** (system-level support)

## Step-by-Step Setup

### 1. Install Required Capacitor Plugins
```bash
npm install @capacitor/local-notifications
npx cap sync android
```

### 2. Android Manifest Configuration
Edit `android/app/src/main/AndroidManifest.xml` and add these permissions:

```xml
<manifest>
  <!-- Required permissions for background execution -->
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
  <uses-permission android:name="android.permission.WAKE_LOCK" />
  <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  <uses-permission android:name="android.permission.VIBRATE" />

  <application>
    <!-- ... your existing app configuration ... -->

    <!-- Add receiver for boot events -->
    <receiver
      android:name="com.getcapacitor.localnotifications.NotificationBootReceiverKt"
      android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
      </intent-filter>
    </receiver>
  </application>
</manifest>
```

### 3. Android Build Configuration
Edit `android/build.gradle` to ensure compatibility:

```gradle
android {
  compileSdk 35  // or higher

  defaultConfig {
    minSdk 26  // Required for reliable alarms
    targetSdk 35
  }
}
```

### 4. Capacitor Configuration
Update `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.yourcompany.app',
  appName: 'CryptoCurrencyScanner',
  webDir: 'dist/crypto-currency-scanner/browser',
  android: {
    useCordovaPlugins: true,
    useStockBrowser: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_launcher',
      iconColor: '#488AFF',
      sound: 'notification_sound',
      requestPermissionOnShow: true,
    },
  },
};

export const config = config;
```

### 5. Implementation in Angular Service
The TypeScript services have already been updated:

- **BackgroundSchedulerService** (`src/app/core/services/background-scheduler.service.ts`)
  - `scheduleTaskAtTime()` - Schedule one-time execution
  - `scheduleTaskWithInterval()` - Schedule recurring execution
  - Uses native notifications for mobile background execution

- **NativeBackgroundService** (`src/app/core/services/native-background.service.ts`)
  - Monitors app state (active/inactive)
  - Provides platform detection

- **TaskSchedulerService** (updated)
  - Now uses BackgroundSchedulerService when on mobile
  - Falls back to web timers on desktop

### 6. Usage Example in Your Component

```typescript
import { TaskSchedulerService } from '@app/core/services/task-scheduler.service';

export class YourComponent {
  constructor(private taskScheduler: TaskSchedulerService) {}

  setupScheduler() {
    // This will automatically use background execution on mobile
    this.taskScheduler.registerTask({
      taskId: 'place-targets-job',
      taskName: 'Place Targets & Stop Loss',
      taskType: 'interval',
      intervalMinutes: 5,  // Runs every 5 minutes
      enabled: true,
      description: 'Places target and stop loss orders',
      executor: () => {
        // Your business logic here
        this.targetManager.placeTargetsAndStopLossForAllPositions();
      }
    });
  }
}
```

## Testing on Mobile

### Test on Device/Emulator:
1. **App is active**: Jobs fire normally via JavaScript timers
2. **App backgrounded**: Jobs fire via LocalNotifications (watch logcat)
3. **Screen locked**: Jobs continue firing via LocalNotifications
4. **App killed**: Jobs DO NOT fire (need native WorkManager for this - premium solution)

### View Android Logs:
```bash
# Terminal 1: Start logcat filter
adb logcat | grep -i notification

# Terminal 2: Build & run
npm run build:prod
npx cap open android
# In Android Studio, click Run (Green Play button)
```

### Logcat Output Examples:
```
✅ Scheduled recurring task: Place Targets every 5 minutes
🔔 Notification triggered for task: Place Targets
✅ Task executed successfully
```

## Troubleshooting

### Jobs not firing when app is backgrounded?

**Issue**: Notifications scheduled but not firing
- **Solution**: Check Power Saving Settings
  1. Android Settings > Battery > Battery Saver
  2. Look for "optimizer" or similar
  3. Add your app to whitelist/exception list

**Solution**: Check notification permissions
```bash
# Check if permissions are granted
adb shell pm list permissions | grep notification
```

**Solution**: Increase notification priority (already done in updated code)
```typescript
priority: 2,  // High priority
ongoing: true, // Keeps notification visible
```

### App crashes when scheduling tasks?

**Solution**: Ensure permissions are requested
```typescript
const result = await LocalNotifications.requestPermissions();
if (result.display === 'granted') {
  // Schedule tasks
}
```

### Still not working after steps above?

Check `android/app/build.gradle`:
- Ensure `compileSdk >= 34`
- Ensure `targetSdk >= 34`
- Ensure `minSdk >= 26`

Run:
```bash
cd android
./gradlew clean build
```

## Limitations

### Android (Current Solution - LocalNotifications):
- ✅ Works when app is backgrounded
- ✅ Works when screen is locked
- ❌ Does NOT work if app is force-stopped (killed)
- ⚠️ Depends on device power-saving settings
- ⚠️ Depends on user granting notification permission

### For Persistent Background Execution (Even When Killed):
Would require native Android WorkManager integration - beyond current Capacitor LocalNotifications scope.

### iOS:
- Limited to 30 seconds of background execution time
- ⚠️ Not suitable for long-running jobs
- Consider implementing as scheduled "wake up" mechanism

## Next Steps

1. **Install dependencies**: `npm install @capacitor/local-notifications`
2. **Update AndroidManifest.xml** with permissions (Step 2 above)
3. **Build APK**: `npm run build:prod && npx cap open android`
4. **Test on device with screen locked**
5. **Check logcat for execution logs**
6. **Adjust battery saver settings on device if needed**

## References
- Capacitor LocalNotifications: https://capacitorjs.com/docs/apis/local-notifications
- Android Alarms: https://developer.android.com/training/scheduling/alarms
- BatchTask Scheduler: GitHub (more advanced option)
