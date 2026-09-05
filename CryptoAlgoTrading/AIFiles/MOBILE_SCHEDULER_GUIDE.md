# Mobile Scheduler Services - Configuration & Verification Guide

## Overview
The scheduler services are fully optimized for mobile (Android APK) and web browsers. They automatically detect the platform and use the appropriate execution mechanism.

---

## Platform Detection

### What the Services Do
- **Mobile (Android APK)**: Uses Capacitor LocalNotifications + Native Android Alarms
- **Web Browser**: Uses JavaScript setInterval/setTimeout
- **Fallback**: If mobile scheduling fails, automatically falls back to web timers

### Detection Code
```typescript
private detectPlatform() {
  const hasCapacitor = (window as any).Capacitor !== undefined;
  const hasCordova = (window as any).cordova !== undefined;
  this.isNativePlatform = hasCapacitor || hasCordova;
}
```

---

## Android Permissions (✅ Already Configured)

### AndroidManifest.xml Permissions
```xml
<!-- Required for scheduler -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### What Each Permission Does
- **INTERNET**: Access to Delta API for trading operations
- **RECEIVE_BOOT_COMPLETED**: Resume scheduled tasks on device restart
- **WAKE_LOCK**: Prevent device sleep during task execution
- **SCHEDULE_EXACT_ALARM**: Schedule precise time-based tasks
- **POST_NOTIFICATIONS**: Show tasksch completion notifications
- **VIBRATE**: Feedback when tasks complete

---

## Required Capacitor Plugins

### Installed Plugins
The following must be installed in `package.json`:

```json
{
  "@capacitor/local-notifications": "^5.0.0 or higher",
  "@capacitor/app": "^5.0.0 or higher",
  "@capacitor/core": "^5.0.0 or higher"
}
```

### Installation Command
```bash
npm install @capacitor/local-notifications @capacitor/app @capacitor/core
npx cap sync
```

---

## Capacitor Configuration

### capacitor.config.json (✅ Already Configured)
```json
{
  "appId": "com.crypto.scanner",
  "appName": "Algo Trading",
  "webDir": "dist/CryptoCurrencyScanner/browser",
  "server": {
    "androidScheme": "https",
    "cleartext": true,
    "allowInsecure": ["api.india.delta.exchange"]
  },
  "plugins": {
    "SplashScreen": {
      "launchAutoHide": true,
      "backgroundColor": "#667eea"
    }
  }
}
```

---

## Build Instructions for APK

### Step 1: Build Web Assets
```bash
ng build --configuration production
```

### Step 2: Sync Capacitor
```bash
npx cap sync android
```

### Step 3: Build APK
```bash
# Debug APK (for testing)
cd android
./gradlew assembleDebug

# Release APK (for distribution)
./gradlew assembleRelease
```

Generated APKs:
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

---

## Scheduler Features on Mobile

### 1. Task Scheduling Mechanisms

#### Daily Tasks (e.g., "Place Limit Order at 10:15 AM")
- **Mobile**: Native Android AlarmManager with exact alarm
- **Web**: JavaScript setTimeout at exact time
- **Auto-recovery**: If device is off at scheduled time, runs on next startup

#### Interval Tasks (e.g., "Every 30 minutes")
- **Mobile**: LocalNotifications repeated with interval
- **Web**: JavaScript setInterval
- **Battery optimization**: Reduces frequency automatically if battery < 20%

### 2. Background Execution

**On Mobile:**
- Tasks execute via Capacitor LocalNotifications
- Notification is shown (with job name) when task starts
- Notification dismissed after task completes
- Job runs even if app is in background/closed
- Device stays awake via WakeLock during execution

**On Web:**
- Tasks run via JavaScript timers
- Only works if browser tab remains open
- No background execution when tab is closed

### 3. Wake Lock Management

```typescript
// Automatically acquires wake lock:
1. When job is about to start
2. Keeps device awake during execution
3. Releases lock after job completes

// Priority order:
1. WakeLock API (modern browsers)
2. Capacitor App plugin (native Android)
3. Fallback: normal power management
```

### 4. Task Recovery

The system handles:
- ✅ Device restart: Tasks resume on boot
- ✅ App closed: Background execution continues (mobile only)
- ✅ Network disconnect: Queued and retried
- ✅ Task failure: Automatic retry with exponential backoff (if configured)

---

## Testing Scheduler on Mobile

### Test 1: Verify Platform Detection
```typescript
// In browser console or app logs
console.log('Is Native Platform:', this.backgroundScheduler['isNativePlatform']);
// Expected: true on APK, false on web
```

### Test 2: Schedule & Verify Execution
1. Open app on mobile
2. Go to **Config** page
3. Enable "Place Limit Order" task
4. Set scheduled time to 1 minute from now
5. Expected: Task executes automatically at scheduled time

### Test 3: Background Execution
1. Start a scheduled task
2. Put app in background (press home button)
3. Expected: Task still executes
4. Return to app: Task status shows as "completed"

### Test 4: Device Restart
1. Schedule a task for 2 minutes from now
2. Restart device
3. Open app
4. Expected: Task executes at scheduled time even after restart

### Test 5: Multiple Concurrent Tasks
1. Enable 3 different tasks with different schedules
2. Monitor logs for proper sequencing
3. Expected: All tasks execute without conflicts

---

## Monitoring Logs on Mobile

### View Logs via ADB (Android Debug Bridge)
```bash
# Connect device via USB with debugging enabled

# View real-time logs
adb logcat | grep "scheduler\|Task\|job"

# Save logs to file
adb logcat > logs.txt

# Clear logs
adb logcat -c
```

### Key Log Messages to Watch For

| Log Message | Meaning |
|------------|---------|
| `✅ Native mobile platform detected` | Capacitor initialized correctly |
| `📱 Notification permissions: granted` | Permissions are set up |
| `📅 Job scheduled: ...` | Task scheduled successfully |
| `⏰ Executing job: ...` | Task is running |
| `🔄 Job completed in X ms` | Task finished |
| `⚠️ Job failed:` | Task encountered error |

---

## Common Issues & Solutions

### Issue 1: Tasks Not Running on Mobile
**Symptoms**: Tasks in config but not executing

**Solutions**:
1. ✅ Verify permissions in Settings > Apps > Algo Trading
   - Check: POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM
2. ✅ Check battery optimization settings
   - Ensure app is not in battery saver
   - Add app to "Exceptions" in battery settings
3. ✅ Verify notification permission granted
   - Go to Config page, check console logs
4. ✅ Test with simple 1-minute interval task first

### Issue 2: Tasks Only Run When App is Open
**Symptoms**: Background execution not working

**Solutions**:
1. ✅ Ensure Capacitor plugins are installed
   ```bash
   npm install @capacitor/local-notifications @capacitor/app
   npx cap sync android
   ```
2. ✅ Rebuild and reinstall APK
   ```bash
   ./gradlew clean && ./gradlew assembleDebug
   adb install -r app-debug.apk
   ```
3. ✅ Check if battery saver is limiting background apps

### Issue 3: Tasks Run Twice
**Symptoms**: Task executes multiple times

**Solutions**:
1. ✅ Ensure only one instance of task scheduler is running
   - Check that no duplicate service registration
2. ✅ Check if task is both scheduled via web and mobile
   - Mobile should auto-detect platform
3. ✅ Clear app data and reinstall
   ```bash
   adb shell pm clear com.crypto.scanner
   ```

### Issue 4: Battery Drain
**Symptoms**: Battery depleting quickly

**Solutions**:
1. ✅ Reduce task frequency
   - Change from every 5 minutes to every 15-30 minutes
2. ✅ Disable unused tasks in Config
3. ✅ Use interval tasks instead of exact time (less power)
4. ✅ Ensure wake lock is properly released
   - Check logs for "Wake lock released"

---

## Production Checklist

Before releasing APK to users:

- [ ] ✅ All required permissions are in AndroidManifest.xml
- [ ] ✅ Capacitor plugins are installed and synced
- [ ] ✅ capacitor.config.json is properly configured
- [ ] ✅ Tested all 5 test scenarios above
- [ ] ✅ Verified logs show correct platform detection
- [ ] ✅ Tested device restart scenario
- [ ] ✅ Tested background execution
- [ ] ✅ Verified no battery drain issues
- [ ] ✅ Signed APK for release
- [ ] ✅ Tested on multiple Android devices

---

## Key Service Files

| File | Purpose |
|------|---------|
| `task-scheduler.service.ts` | Main orchestrator for all scheduled tasks |
| `background-scheduler.service.ts` | Platform-specific execution (mobile/web) |
| `config.service.ts` | Stores user-configured task schedules |
| `task-executor.service.ts` | Executes registered task handlers |
| `capacitor.config.json` | Capacitor app configuration |
| `android/app/src/main/AndroidManifest.xml` | Android permissions & boot receiver |

---

## Environment Variables

### For Development (.env files - if used)
```
CAPACITOR_PLATFORM=android
API_URL=https://api.india.delta.exchange
LOG_LEVEL=debug
```

---

## Support & Debugging

### Enable Debug Logging
In `task-scheduler.service.ts`, set:
```typescript
private debugMode = true; // Increased logging
```

### Create Debug Build Log
```bash
adb logcat -G 16M  # Increase buffer
./gradlew assembleDebug  # Build
adb install app-debug.apk  # Install
adb logcat > debug_logs.txt  # Capture
```

### Share Debug Info
When reporting issues, include:
1. Device info: `adb shell getprop ro.build.fingerprint`
2. App logs: `adb logcat | grep -i crypto`
3. Permission status: `adb shell pm list permissions | grep crypto`
4. Scheduled tasks config
5. Task execution history from app

---

## References

- [Capacitor Documentation](https://capacitorjs.com)
- [LocalNotifications Plugin](https://capacitorjs.com/docs/apis/local-notifications)
- [Android Alarms](https://developer.android.com/training/scheduling/alarms)
- [WakeLock API](https://developer.mozilla.org/en-US/docs/Web/API/WakeLock)

---

**Last Updated**: 2024
**Status**: ✅ Production Ready
