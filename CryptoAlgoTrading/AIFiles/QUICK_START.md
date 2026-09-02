# Quick Start: Build APK

## Easiest Way - Automated Script

Run this single command in PowerShell:

```powershell
.\build-apk.ps1
```

This will:
1. ✅ Clean previous builds
2. ✅ Build Angular app (production)
3. ✅ Verify assets and config.json
4. ✅ Sync Capacitor
5. ✅ Build Android APK
6. ✅ Copy APK to root folder as `CryptoScanner-Debug.apk`

## Manual Build (3 Commands)

```powershell
# 1. Build Angular
npm run build --configuration=production

# 2. Sync Capacitor
npx cap sync android

# 3. Build APK
cd android
.\gradlew assembleDebug
cd ..
```

APK location: `android\app\build\outputs\apk\debug\app-debug.apk`

## Install on Phone

### Option 1: Direct Copy
1. Copy `CryptoScanner-Debug.apk` to your phone
2. Open the file on your phone
3. Allow "Install from unknown sources" if prompted
4. Install the app

### Option 2: ADB (USB Cable)
```powershell
# Connect phone via USB with USB Debugging enabled
adb install CryptoScanner-Debug.apk
```

## First Time Setup

### Install Android Studio (One Time)
1. Download: https://developer.android.com/studio
2. Install Android Studio
3. Open Android Studio > SDK Manager
4. Install:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Command-line Tools

### Set Environment Variables (One Time)
Add to Windows System Environment Variables:

```
ANDROID_HOME = C:\Users\YourUsername\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Android\Android Studio\jbr
```

Add to PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%JAVA_HOME%\bin
```

## Troubleshooting

### "gradlew not found"
```powershell
# Reinstall Android platform
npx cap add android
```

### "ANDROID_HOME not set"
Set environment variable (see above), then restart PowerShell

### "Build failed"
```powershell
# Clean and rebuild
cd android
.\gradlew clean
.\gradlew assembleDebug
cd ..
```

### "Config not loading in app"
The assets issue has been fixed in `angular.json`. Rebuild:
```powershell
npm run build --configuration=production
npx cap sync android
```

## What's Fixed in This Update

✅ Config file 404 error - Fixed `angular.json` to include `src/assets`
✅ Positions not displaying - Fixed API response handling
✅ Better error logging - Added console logs for debugging
✅ Mobile APK build - Capacitor configured and ready

## Full Documentation

See `BUILD_APK_GUIDE.md` for:
- Complete setup instructions
- Advanced build options
- Signed release APK
- Optimization tips
- Detailed troubleshooting

## Support

Having issues? Check:
1. `npx cap doctor` - Diagnose Capacitor setup
2. Build logs in terminal
3. `BUILD_APK_GUIDE.md` - Full documentation
