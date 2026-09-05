# Mobile Scheduler Troubleshooting Guide

## Quick Diagnostics

### Step 1: Check Platform Detection
```typescript
// In browser console or app component
import { MobileInitializationService } from './core/services/mobile-initialization.service';

// Inject service
constructor(private mobileInit: MobileInitializationService) {}

// Check platform
ngOnInit() {
  console.log('Is Native:', this.mobileInit.isNative());
}
```

**Expected Output (Mobile)**: `true`
**Expected Output (Web)**: `false`

---

## Issue: Tasks Show in UI but Don't Execute

### Root Causes & Solutions

#### 1. ❌ Platform Detection Failed
**Symptoms**: 
- Web timers work, native doesn't
- Console shows: "Web platform detected"
- Tasks register but never fire on mobile

**Diagnosis**:
```bash
# Check in browser console
console.log((window as any).Capacitor);  # Should NOT be undefined on mobile
adb logcat | grep "Platform detected"
```

**Solutions**:
- Ensure Capacitor is properly initialized
- Run: `npx cap sync android`
- Rebuild APK: `./gradlew clean assembleDebug`
- Reinstall: `adb install -r app-debug.apk`

---

#### 2. ❌ Notification Permission Not Granted
**Symptoms**:
- Console shows: "Notification permissions: denied"
- Tasks don't execute
- No notification appears

**Diagnosis**:
```bash
# Check permission status
adb shell pm list permissions | grep POST_NOTIFICATIONS

# Check app permissions
Settings > Apps > Algo Trading > Permissions > Notifications
```

**Solutions**:
```typescript
// Request permission programmatically
import { MobileInitializationService } from './core/services/mobile-initialization.service';

constructor(private mobileInit: MobileInitializationService) {}

async requestPermission() {
  const granted = await this.mobileInit.requestNotificationPermission();
  if (granted) {
    console.log('✅ Notifications enabled');
  } else {
    console.log('❌ Please enable notifications in app settings');
  }
}
```

Then test:
1. Go to Settings > Apps > Algo Trading > Permissions
2. Turn ON "Notifications" toggle
3. Return to app and check logs

---

#### 3. ❌ Task Not Registered
**Symptoms**:
- Task doesn't appear in Task Status panel
- No logs for task registration

**Diagnosis**:
```bash
adb logcat | grep "registerTask"
```

**Expected Output**:
```
Registered task: place-limit-order
Registered task: cleanup-target-orders
Registered task: move-sl-to-entry
```

**Solutions**:
- Check dashboard.component.ts: `setupTaskScheduler()` is called
- Verify config enables the task
- Check for name conflicts (don't use special characters)

---

#### 4. ❌ Scheduled Time Passes, Task Doesn't Run
**Symptoms**:
- Task shows in UI as scheduled
- Scheduled time elapses
- No execution, no error

**Diagnosis**:
```bash
# View detailed logs
adb logcat | grep -E "Mobile job scheduled|Executing|failed"

# Check if device is in Doze mode
adb shell dumpsys deviceidle | grep mState
```

**Expected Doze Output**: `mState=ACTIVE` (not in Doze)

**Solutions**:

A. **Disable Doze Mode (Testing Only)**
```bash
adb shell dumpsys deviceidle disable  # Temporarily disable
adb shell dumpsys deviceidle enable   # Re-enable later
```

B. **Add App to Whitelist (Production)**
```bash
adb shell cmd deviceidle whitelist +com.crypto.scanner
adb shell dumpsys deviceidle whitelist  # Verify
```

C. **Request Battery Optimization Exemption**
```typescript
// Show user prompt to add app to exceptions
const info = await Battery.getBatteryInfo();
console.log('Please go to Settings > Battery > Battery Saver > "Advanced" > App');
console.log('Add "Algo Trading" to exceptions');
```

---

#### 5. ❌ Task Runs Twice or Multiple Times
**Symptoms**:
- Notification shows twice
- Task execution duplicated
- Logs show multiple "Executing" messages

**Diagnosis**:
```bash
adb logcat | grep "Executing job" | wc -l  # Count executions
```

**Solutions**:
- Verify only ONE schedule call per task
- Check task registration doesn't happen multiple times
- Clear app data: `adb shell pm clear com.crypto.scanner`
- Check for duplicate task IDs in scheduler

---

## Issue: App Crashes on Startup (Mobile Only)

### Root Causes & Solutions

#### 1. ❌ Missing Capacitor Plugin
**Symptoms**:
- App crashes immediately on launch
- Error: "Cannot find module '@capacitor/local-notifications'"

**Diagnosis**:
```bash
npm list @capacitor/local-notifications
npm list @capacitor/app
```

**Solutions**:
```bash
npm install @capacitor/local-notifications @capacitor/app @capacitor/core
npx cap sync
./gradlew clean assembleDebug
```

---

#### 2. ❌ Android Permission Not Declared
**Symptoms**:
- Crash on: `requestPermissions()`
- Logcat shows: "Permission denied"

**Diagnosis**:
Check `android/app/src/main/AndroidManifest.xml` for:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

**Solutions**:
Add missing permissions and rebuild:
```bash
./gradlew clean assembleDebug
adb install -r app-debug.apk
```

---

#### 3. ❌ Incompatible Android Version
**Symptoms**:
- App won't install or crashes
- Error: "API Level not supported"

**Diagnosis**:
```bash
adb shell getprop ro.build.version.sdk
adb shell getprop ro.build.version.release
```

**Solutions**:
- Minimum supported: Android 7.0 (API 24)
- Target latest: Android 14 (API 34)
- Update `minSdk` and `targetSdk` in `build.gradle`

---

## Issue: Battery Drain / High CPU Usage

### Root Causes & Solutions

#### 1. ❌ High Task Frequency
**Symptoms**:
- Battery depletes rapidly
- Device gets hot
- Multiple tasks running simultaneously

**Solutions**:
- Reduce frequency: change tasks from 5-minute to 15-30 minute intervals
- Disable unused tasks in Config
- Stagger task execution times to avoid overlaps

---

#### 2. ❌ Wake Lock Not Released
**Symptoms**:
- Console logs show: "Wake lock acquired" but never "Wake lock released"
- Device stays awake even when app is closed

**Diagnosis**:
```bash
adb shell dumpsys power | grep wl_  # View wakelock status
```

**Solutions**:
```typescript
// Ensure callback completes
async taskCallback() {
  try {
    // Do work
    await this.service.work();
  } catch (error) {
    console.error('Task failed:', error);
  }
  // Wake lock automatically released when callback ends
}
```

---

#### 3. ❌ Excessive Logging
**Symptoms**:
- Console logs flooded with debug messages
- High disk/memory usage

**Solutions**:
Set debug mode OFF for production:
```typescript
private debugMode = false;  // In task-scheduler.service.ts
```

---

## Issue: Tasks Work on Emulator but Not Physical Device

### Causes & Solutions

#### 1. ❌ Device in Battery Saver
**Solution**:
```
Settings > Battery > Battery Saver > OFF
Settings > Battery > Optimize battery usage > Remove Algo Trading from list
Settings > Developer Options > Disable "Stay Awake" is OK
```

#### 2. ❌ Permissions Differ Between Devices
**Solution**:
```bash
# Clear and reinstall
adb uninstall com.crypto.scanner
adb install app-debug.apk

# Grant all permissions manually
adb shell pm grant com.crypto.scanner android.permission.POST_NOTIFICATIONS
adb shell pm grant com.crypto.scanner android.permission.SCHEDULE_EXACT_ALARM
adb shell pm grant com.crypto.scanner android.permission.WAKE_LOCK
```

#### 3. ❌ Network Connectivity
**Solution**:
- Test with same WiFi as emulator
- Check if API endpoint is accessible: `ping api.india.delta.exchange`
- Verify cleartext traffic allowed in `network_security_config.xml`

---

## Issue: Cannot Connect via ADB

### Solutions

#### 1. Enable USB Debugging
```
Settings > About Phone > Build Number (Tap 7 times)
Settings > Developer Options > Enable USB Debugging
```

#### 2. Trust Computer Prompt
- Connect device
- When "Trust this computer?" prompt appears, tap "Allow"

#### 3. Check ADB Connection
```bash
adb devices  # Should show device in list
adb shell pm list packages | grep crypto  # Verify app installed
```

#### 4. Restart ADB Server
```bash
adb kill-server
adb start-server
adb devices
```

---

## Collecting Debug Logs

### Full Diagnostic Log
```bash
# Create log file with all relevant info
echo "=== Device Info ===" > debug.log
adb shell getprop ro.build.fingerprint >> debug.log
adb shell getprop ro.build.version.sdk >> debug.log

echo -e "\n=== Installed Packages ===" >> debug.log
adb shell pm list packages | grep crypto >> debug.log

echo -e "\n=== App Permissions ===" >> debug.log
adb shell pm list permissions | grep -E "SCHEDULE|WAKE|BOOT|POST" >> debug.log

echo -e "\n=== Previous Logs (clear first) ===" >> debug.log
adb logcat -c
echo "Watch logs for 30 seconds..."
sleep 30

echo -e "\n=== Captured Logs ===" >> debug.log
adb logcat | grep -E "crypto|scheduler|task|error" >> debug.log

echo "Debug log saved to: debug.log"
```

---

## Verification Checklist

After making changes, verify:

- [ ] Platform detection shows "Mobile" on APK
- [ ] Notification permission shows as "granted"
- [ ] Tasks appear in Task Status panel
- [ ] At least one task executes at scheduled time
- [ ] Task completes without errors
- [ ] Task executes in background (screen off)
- [ ] Device survives restart and resumes tasks
- [ ] No excessive battery drain (< 5% per hour idle)
- [ ] No memory leaks (check adb logcat for OOM)

---

## When to Use Each Logging Level

### Debug (Development)
```typescript
console.log('📅 Task scheduled');  // Always show
console.log('⏰ Task executing');  // Always show
console.log('✅ Task completed');  // Always show
```

### Error (Always)
```typescript
console.error('❌ Task failed');  // Always show
console.error('⚠️ Permission denied');  // Always show
```

### Info Logs (When needed)
```bash
adb logcat | grep "scheduler"  # Filter important logs
adb logcat | grep "ERROR"      # Only errors
adb logcat | tail -100         # Last 100 lines
```

---

## Support Resources

**Capacitor Issues**: https://github.com/ionic-team/capacitor/issues
**LocalNotifications**: https://capacitorjs.com/docs/apis/local-notifications
**Android Alarms**: https://developer.android.com/training/scheduling/alarms
**WakeLock API**: https://developer.mozilla.org/en-US/docs/Web/API/WakeLock

---

## Still Need Help?

Gather and share:
1. Device info: `adb shell getprop ro.build.fingerprint`
2. Full logcat: `adb logcat > full_logs.txt`
3. APK build log: `./gradlew assembleDebug 2>&1 | tee build.log`
4. App config: Screenshot of Config page showing enabled tasks
5. Exact error message from console

