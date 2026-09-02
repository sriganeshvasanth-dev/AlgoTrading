# 🎯 APK BUILD BATCH FILES - COMPLETE GUIDE

## Overview

I've created a complete set of **Windows batch files** to automate your APK build process. No PowerShell required!

---

## 📁 Batch Files Created

### 1. **build-apk-simple.bat** ⭐ START HERE

The simplest, fastest way to build!

```batch
build-apk-simple.bat
```

**What it does:**
- ✅ Builds Angular production bundle
- ✅ Syncs to Capacitor Android
- ✅ Builds APK with Gradle
- ✅ Verifies the APK file
- ✅ Shows you where the APK is

**Time:** ~6-8 minutes (first build) | ~3-4 minutes (subsequent)

**Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

### 2. **build-debug-apk.bat** (Advanced)

Same as simple, but with more options and detailed output.

```batch
build-debug-apk.bat                 # Build debug APK
build-debug-apk.bat release         # Build release APK
build-debug-apk.bat clean           # Clean all artifacts
```

**Features:**
- Detailed step-by-step progress
- Prerequisite checking
- Error recovery guidance
- Build statistics

---

### 3. **create-keystore.bat** (One-time Setup)

Create a signing key for release APKs.

```batch
create-keystore.bat
```

**What it does:**
- Creates `release.keystore` file
- Sets up signing certificate
- Verifies the keystore is valid

**Run once** and keep the keystore file safe!

---

### 4. **build-release-apk.bat** (For App Store)

Build an optimized, signed APK for Google Play Store.

```batch
build-release-apk.bat
```

**Prerequisites:**
- Must run `create-keystore.bat` first
- Creates smaller, optimized APK

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

---

### 5. **install-apk.bat** (Easy Install)

Install the built APK to a device or emulator.

```batch
install-apk.bat
```

**What it does:**
- Lists connected devices
- Installs APK
- Optionally launches the app
- Shows live logs

---

## 🚀 Quick Start

### Option 1: Fully Automated (Recommended)

```batch
REM Do this ONCE to setup
create-keystore.bat

REM Then for each build
build-apk-simple.bat
install-apk.bat
```

### Option 2: Step by Step

```batch
REM Step 1: Build
build-apk-simple.bat

REM Step 2: Install
install-apk.bat

REM Step 3: View logs
adb logcat | findstr "com.crypto.scanner"
```

---

## 📋 Full Build Workflow

```
1. First Time Setup
   ├─ Verify Java installed
   ├─ Verify Node.js installed  
   ├─ Verify Android SDK installed
   └─ Run: create-keystore.bat

2. Every Build
   ├─ Run: build-apk-simple.bat
   ├─ Wait 6-8 minutes
   └─ APK created in android/app/build/outputs/apk/debug/

3. Test on Device
   ├─ Connect Android phone via USB
   ├─ Enable USB Debugging
   ├─ Run: install-apk.bat
   └─ App launches automatically (optional)

4. For App Store
   ├─ Increase version number
   ├─ Run: build-release-apk.bat
   ├─ Test on device
   └─ Upload to Google Play Console
```

---

## 🎯 Choose Your Command

| Goal | Run This | Time |
|------|----------|------|
| **Build APK for testing** | `build-apk-simple.bat` | 6-8 min |
| **Build with more details** | `build-debug-apk.bat` | 6-8 min |
| **Clean & rebuild** | `build-debug-apk.bat clean` | varies |
| **Setup signing** | `create-keystore.bat` | 2 min |
| **Build for Play Store** | `build-release-apk.bat` | 6-8 min |
| **Install to device** | `install-apk.bat` | 1 min |

---

## ✅ Prerequisites Checklist

Before running any batch file, verify:

```batch
REM Check Java
java -version

REM Check Node.js
node --version

REM Check npm
npm --version

REM Check Android SDK
echo %ANDROID_HOME%
```

All should show version numbers, not "not found".

**Not installed?**
- **Java:** https://www.oracle.com/java/technologies/downloads/
- **Node.js:** https://nodejs.org/
- **Android SDK:** Via Android Studio or https://developer.android.com/studio

---

## 📱 APK File Locations

After building:

```
📂 Your Project
└─ android/app/build/outputs/apk/
   ├─ debug/
   │  └─ app-debug.apk           ← Debug build (20-30 MB)
   └─ release/
      └─ app-release.apk         ← Release build (15-20 MB)
```

---

## 🔧 Common Tasks

### Build and Install in One Go

```batch
build-apk-simple.bat && install-apk.bat
```

### View App Logs After Install

```batch
adb logcat | findstr "com.crypto.scanner"
```

### Uninstall App

```batch
adb uninstall com.crypto.scanner
```

### Check Connected Devices

```batch
adb devices
```

### Restart ADB

```batch
adb kill-server
adb start-server
```

---

## ⚠️ Troubleshooting

### Build Fails - General

```batch
REM Clean and rebuild
build-debug-apk.bat clean
build-apk-simple.bat
```

### "Java not found"

```batch
REM Set JAVA_HOME
setx JAVA_HOME "C:\Program Files\Java\jdk-11.x.x"
```

Then close and reopen Command Prompt.

### "adb not found"

```batch
REM Set ANDROID_HOME
setx ANDROID_HOME "%USERPROFILE%\AppData\Local\Android\sdk"

REM Add to PATH
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools"
```

Then close and reopen Command Prompt.

### APK Not Found After Build

```batch
REM Check if gradle build actually succeeded
cd android
.\gradlew.bat build --info
cd ..
REM Look for "BUILD SUCCESSFUL" in output
```

### App Crashes on Device

```batch
REM Clear logs and launch
adb logcat -c
adb shell am start -n com.crypto.scanner/.MainActivity
REM Look for errors
adb logcat | findstr "ERROR"
```

---

## 📊 Build Times

| Step | Time | Notes |
|------|------|-------|
| Angular build | 2-3 min | Slower first time, uses cache after |
| Capacitor sync | 30 sec | Very fast |
| Gradle build | 3-5 min | Slower first time, daemon speeds it up |
| **Total** | **6-8 min** | First build is slower |
| **Cached** | **3-4 min** | Subsequent builds (no clean) |

---

## 🎁 APK File Info

**Debug APK** (`app-debug.apk`):
- Size: 20-30 MB
- Includes debug info
- Can be installed directly
- Use for testing
- Cannot be published to Play Store

**Release APK** (`app-release.apk`):
- Size: 15-20 MB (smaller, optimized)
- No debug info
- Signed with keystore
- Ready for Play Store
- Requires `create-keystore.bat` first

---

## 🔐 About the Keystore

The `release.keystore` file:
- ✅ Only needed for releasing to Play Store
- ✅ Created one time (first run of `create-keystore.bat`)
- ⚠️ **KEEP IT SAFE!** - You'll need it for ALL future releases
- ⚠️ **BACKUP!** - Make multiple copies in safe locations
- ⚠️ **DON'T LOSE!** - Google Play won't accept APKs signed with different keystores

---

## 📱 Testing on Device

### Physical Phone

1. Connect via USB
2. Enable: Settings > Developer Options > USB Debugging
3. Run: `install-apk.bat`
4. Tap app to launch

### Android Emulator

1. Open Android Studio
2. Create/start an emulator
3. Run: `install-apk.bat`
4. Emulator will get the APK installed

---

## 🎯 Release Process

```batch
REM 1. One-time keystore setup
create-keystore.bat

REM 2. Update version in capacitor.config.ts
REM    "version": "1.0.0" → "1.0.1"

REM 3. Build release APK
build-release-apk.bat

REM 4. Test it first
install-apk.bat

REM 5. Upload to Google Play Console
REM    https://play.google.com/console
REM    Upload: android/app/build/outputs/apk/release/app-release.apk
```

---

## 📚 Documentation Reference

- **APK_BUILD_GUIDE.md** - Detailed build instructions
- **TROUBLESHOOTING.md** - Problem solving
- **BUILD_QUICK_REFERENCE.md** - Quick commands
- **BUILD_VISUAL_FLOW.md** - Architecture diagrams

---

## 💡 Pro Tips

1. **First build takes longer** because it downloads Gradle dependencies
   - Subsequent builds are much faster (3-4 minutes)

2. **Keep a backup of release.keystore**
   - You'll need it for all future releases
   - Without it, you can't update your app on Google Play

3. **Use debug APK for development**
   - Faster to build
   - Easier to test changes
   - Only use release APK for app store

4. **Parallel builds are faster**
   ```batch
   cd android
   .\gradlew.bat build --parallel --daemon
   cd ..
   ```

5. **Check logs while debugging**
   ```batch
   adb logcat | findstr "com.crypto.scanner"
   ```

---

## 🆘 Still Having Issues?

1. **Check prerequisites are installed**
   ```batch
   java -version
   node --version
   npm --version
   ```

2. **Try clean rebuild**
   ```batch
   build-debug-apk.bat clean
   build-apk-simple.bat
   ```

3. **Check detailed logs**
   ```batch
   cd android
   .\gradlew.bat build --info > build.log
   cd ..
   ```

4. **View detailed output**
   - Open build.log in text editor
   - Search for "ERROR" or "FAILED"
   - Look for specific error messages

5. **Ask for help with:**
   - Full console output
   - The error messages you see
   - What step it fails on

---

## 🎉 Success Indicators

After running `build-apk-simple.bat`, you should see:

```
[✓] Prerequisites OK
[✓] Angular build complete
[✓] Capacitor sync complete
[✓] Gradle build complete
[✓] APK verified

BUILD SUCCESSFUL!
APK Location: android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 📞 Quick Help

| Problem | Solution |
|---------|----------|
| "Java not found" | Install JDK 11+, set JAVA_HOME |
| "npm not found" | Install Node.js |
| "adb not found" | Add Android SDK to PATH |
| "Build fails" | Run `build-debug-apk.bat clean` then try again |
| "APK not found" | Check for errors in gradle output |
| "App crashes" | Check `adb logcat` for errors |
| "No device" | Connect phone, enable USB Debugging |

---

## 🎊 You're Ready!

Choose your starting path:

### 🚀 Quick Start
```batch
build-apk-simple.bat
```

### 🎯 With Details
```batch
build-debug-apk.bat
```

### 📦 For Release
```batch
create-keystore.bat
build-release-apk.bat
```

### 📱 Install & Test
```batch
install-apk.bat
```

---

**Happy Building! 🎉**

Questions? Check:
- `APK_BUILD_GUIDE.md` - Full documentation
- `TROUBLESHOOTING.md` - Problem solving
- `BUILD_QUICK_REFERENCE.md` - Commands cheat sheet
