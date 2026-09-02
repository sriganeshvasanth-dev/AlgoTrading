# 🚀 Quick Build Guide - Crypto Scanner APK

## ⚡ Quick Start (3 Options)

### Option 1: Automated Build (Recommended)
```powershell
.\build-apk.ps1
```
**Output**: `CryptoScanner-Debug.apk` in project root

---

### Option 2: Diagnose First, Then Build
```powershell
# 1. Check what's wrong
.\diagnose.ps1

# 2. Fix any issues shown

# 3. Build
.\build-apk.ps1
```

---

### Option 3: Manual Build (If scripts fail)
See: **[MANUAL_BUILD_STEPS.md](MANUAL_BUILD_STEPS.md)** for detailed step-by-step instructions

---

## 📋 What's Included

| File | Purpose |
|------|---------|
| **build-apk.ps1** | Automated build script (one command) |
| **diagnose.ps1** | Check environment and dependencies |
| **MANUAL_BUILD_STEPS.md** | Step-by-step manual build guide |
| **BUILD_APK_GUIDE.md** | Complete reference documentation |
| **QUICK_START.md** | Quick reference card |
| **TESTING_CHECKLIST.md** | Testing procedures |
| **IMPLEMENTATION_SUMMARY.md** | What was fixed and why |

---

## 🔧 Prerequisites

### First Time Setup
1. **Install Android Studio**: https://developer.android.com/studio
2. **Install Android SDK 34** (via Android Studio SDK Manager)
3. **Set Environment Variables**:
   - `ANDROID_HOME` = `C:\Users\YourUsername\AppData\Local\Android\Sdk`
   - `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr`

### Every Build
- Run from project root directory
- Ensure `src\assets\config.json` exists with your API keys

---

## 🐛 Common Issues & Quick Fixes

### Issue: "config.json not found"
```powershell
# Verify source file exists
Test-Path src\assets\config.json
# If False, create it with your API keys
```

### Issue: "ANDROID_HOME not set"
```powershell
# Set and restart PowerShell
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk', 'User')
```

### Issue: "gradlew failed"
```powershell
# Clean and rebuild
cd android
.\gradlew clean
.\gradlew assembleDebug
cd ..
```

### Issue: "Angular build failed"
```powershell
# Check for errors
npm run build

# If dependencies missing
npm install

# Try again
npm run build --configuration=production
```

---

## 📱 Install on Phone

### Simple Way
1. Copy `CryptoScanner-Debug.apk` to phone
2. Open file on phone
3. Allow "Unknown sources" if asked
4. Install

### ADB Way
```powershell
adb install CryptoScanner-Debug.apk
```

---

## ✅ Verify Build

After building, check:

```powershell
# APK exists?
Test-Path CryptoScanner-Debug.apk

# Get APK size
(Get-Item CryptoScanner-Debug.apk).Length / 1MB

# Config included?
Test-Path android\app\src\main\assets\public\assets\config.json
```

All should return `True` or show file size.

---

## 📖 Need More Help?

1. **Run diagnostics**: `.\diagnose.ps1`
2. **Read manual steps**: [MANUAL_BUILD_STEPS.md](MANUAL_BUILD_STEPS.md)
3. **Full APK guide**: [BUILD_APK_GUIDE.md](BUILD_APK_GUIDE.md)
4. **Check environment**:
   ```powershell
   npx cap doctor
   ```

---

## 🎯 Current Build Status

✅ **Fixed Issues**:
- Config file 404 error → `angular.json` assets fixed
- Positions not displaying → API handling improved
- APK build process → Scripts created

✅ **Ready to Build**:
- Angular configured
- Capacitor installed
- Android platform ready
- Build scripts provided

---

## 🚀 Expected Build Time

- **Angular build**: ~30-60 seconds
- **Capacitor sync**: ~5-10 seconds
- **Gradle build**: ~1-3 minutes (first time), ~30s (subsequent)
- **Total**: ~2-4 minutes

---

## 💡 Pro Tips

1. **First build takes longest** (Gradle downloads dependencies)
2. **Subsequent builds are faster** (cache reused)
3. **Clean build if errors persist**:
   ```powershell
   Remove-Item dist -Recurse -Force
   Remove-Item android\app\build -Recurse -Force
   .\build-apk.ps1
   ```
4. **Use Android Studio** for detailed error messages:
   ```powershell
   npx cap open android
   ```

---

## 📞 Support

Having issues? Check in this order:

1. ✅ Run `.\diagnose.ps1` - Shows what's wrong
2. 📖 Read error message - Usually tells you what to fix
3. 📄 Check [MANUAL_BUILD_STEPS.md](MANUAL_BUILD_STEPS.md) - Step-by-step guide
4. 🔍 Read [BUILD_APK_GUIDE.md](BUILD_APK_GUIDE.md) - Full documentation
5. 🧪 Run `npx cap doctor` - Capacitor diagnostics

---

## ✨ What Was Fixed

Your screenshot showed these issues - all now fixed:

1. ❌ Config 404 error → ✅ Fixed in `angular.json`
2. ❌ Positions not showing → ✅ Fixed API handling
3. ❌ No APK build process → ✅ Created automation scripts

**You're ready to build!** 🎉
