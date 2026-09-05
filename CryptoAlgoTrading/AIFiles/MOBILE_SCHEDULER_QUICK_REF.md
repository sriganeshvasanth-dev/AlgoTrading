# Mobile Scheduler - Quick Reference Card

## 🎯 Quick Start

### Verify It's Working
```bash
# 1. Connect Android device via USB
adb devices

# 2. Install and run
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 3. Check logs
adb logcat | grep -E "scheduler|Platform"

# Expected output:
# ✅ "Mobile platform detected"
# ✅ "Notification permissions: granted"
```

---

## 📋 Building for APK

```bash
# Development (Debug)
ng build
npx cap sync android
cd android && ./gradlew assembleDebug

# Production (Release)
ng build --configuration production
npx cap sync android
cd android && ./gradlew assembleRelease
```

---

## 🧪 Test Scenarios

| Test | Steps | Expected |
|------|-------|----------|
| **Platform Detection** | Check logs | Shows "Mobile" on APK, "Web" in browser |
| **Schedule Task** | Create 1-min task, watch logs | Executes at exact time |
| **Background** | Task starts, press Home | Still executes |
| **Restart** | Schedule 2-min task, restart | Resumes at correct time |
| **Multiple** | 3 tasks, different times | All execute independently |

---

## 🔧 Common Commands

```bash
# View logs (all)
adb logcat

# View logs (filtered)
adb logcat | grep scheduler

# View logs (last 50 lines)
adb logcat | tail -50

# Clear logs
adb logcat -c

# Save logs to file
adb logcat > logs.txt

# Install APK
adb install app.apk

# Install and overwrite
adb install -r app.apk

# Uninstall app
adb uninstall com.crypto.scanner

# Clear app data
adb shell pm clear com.crypto.scanner

# Check permissions
adb shell pm list permissions | grep -E "SCHEDULE|WAKE|BOOT|POST"

# Grant permission
adb shell pm grant com.crypto.scanner android.permission.SCHEDULE_EXACT_ALARM

# Get device info
adb shell getprop ro.build.fingerprint
```

---

## 🐛 Debugging

### Is it detecting mobile?
```bash
adb logcat | grep "Platform detected"
# Should show: "Mobile platform detected"
```

### Are permissions granted?
```bash
adb logcat | grep "Notification permissions"
# Should show: "permissions: granted"
```

### Did task register?
```bash
adb logcat | grep "registerTask"
# Should show: "Registered task: place-limit-order"
```

### Did it execute?
```bash
adb logcat | grep "Executing"
# Should show: "Executing job: place-limit-order"
```

---

## ⚠️ Top Issues & Fixes

| Issue | Fix |
|-------|-----|
| Tasks don't execute | Check: permissions granted, notifications enabled, Doze mode disabled |
| App crashes | Install Capacitor plugins: `npm install @capacitor/local-notifications` |
| No notifications | Grant POST_NOTIFICATIONS: `adb shell pm grant ... android.permission.POST_NOTIFICATIONS` |
| Runs on web only | Rebuild APK: `./gradlew clean assembleDebug` |
| Battery drain | Reduce frequency, disable battery saver, check wake lock release |

---

## 📱 Android Permissions (Minimum)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

---

## 📦 Required npm Packages

```bash
npm install @capacitor/core
npm install @capacitor/app
npm install @capacitor/local-notifications
```

---

## 🧠 How It Works

```
┌─── Android Device ───┐
│                      │
│  App starts          │
│  │                   │
│  ├─ Detect platform  │
│  │  (Capacitor OK?)  │
│  │                   │
│  ├─ Is Native?       │
│  │  YES ─────────────┼─→ Use LocalNotifications
│  │  NO ──────────────┼─→ Use JavaScript timers
│  │                   │
│  ├─ Register tasks   │
│  │                   │
│  ├─ Schedule jobs    │
│  │                   │
│  └─ Run at time      │
│     │                │
│     ├─ Background? ──┼─→ Keep executing (wake lock)
│     └─ Foreground?   │  Keep executing normally
│                      │
└──────────────────────┘
```

---

## 🔐 Production Checklist

- [ ] Changed `minifyEnabled: true` in build.gradle (release)
- [ ] Signed APK with release keystore
- [ ] Verified API endpoints use production URLs
- [ ] Network security config updated for HTTPS
- [ ] Tested on multiple Android versions
- [ ] Verified no hardcoded credentials in code
- [ ] Tested background execution
- [ ] Confirmed boot receiver works after restart

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| MOBILE_SCHEDULER_GUIDE.md | Full configuration & features |
| ANDROID_BUILD_CONFIG.md | Build optimization & settings |
| SCHEDULER_TROUBLESHOOTING.md | Debugging & common issues |
| MOBILE_APK_SCHEDULER_CHECKLIST.md | Pre-release verification |

---

## 🎯 Success Indicators

✅ App launches without errors
✅ Platform detection shows "Mobile"
✅ Permissions show as "granted"
✅ Task appears in UI
✅ Task executes at scheduled time
✅ Works in background
✅ Survives device restart
✅ No excessive battery drain
✅ Logs show completion
✅ Can test with ADB

---

## 🚀 Deploy to Production

```bash
# 1. Build release
ng build --configuration production
npx cap sync android
cd android && ./gradlew clean assembleRelease

# 2. Sign APK (if not auto-signed)
jarsigner -keystore my-app.keystore app-release-unsigned.apk my-alias

# 3. Align APK
zipalign -v 4 app-release-unsigned.apk app-release.apk

# 4. Done! app-release.apk ready for distribution
```

---

## 🆘 Need Help?

1. **Check logs**: `adb logcat | grep scheduler`
2. **Review troubleshooting**: See SCHEDULER_TROUBLESHOOTING.md
3. **Rebuild**: `./gradlew clean assembleDebug`
4. **Reinstall**: `adb install -r app.apk`
5. **Clear cache**: `adb shell pm clear com.crypto.scanner`

---

**Keep this handy during development!** 📌

