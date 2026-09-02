# ✅ Android APK Build Checklist

## Pre-Build Setup (Do Once)

- [ ] Download Android Studio from https://developer.android.com/studio
- [ ] Install Android SDK (during Android Studio setup)
- [ ] Download Java JDK 11+ from https://www.oracle.com/java/technologies/javase-jdk11-downloads.html
- [ ] Set environment variable: `ANDROID_SDK_ROOT = C:\Users\YourName\AppData\Local\Android\Sdk`
- [ ] Set environment variable: `JAVA_HOME = C:\Program Files\Java\jdk-11.x.x`
- [ ] Restart your terminal/IDE
- [ ] Verify: Run `java -version` in terminal (should show Java version)

## Build APK

### Method 1: Automated (Easiest)
- [ ] Double-click `build-apk.bat` in project folder
- [ ] Wait for completion (~5-10 minutes first time)
- [ ] Follow on-screen instructions

### Method 2: Manual
- [ ] Open terminal in project folder
- [ ] Run: `npm run build`
- [ ] Run: `npx cap sync android`
- [ ] Run: `cd android && gradlew assembleDebug`

## After Build

- [ ] Check APK was created: `android/app/build/outputs/apk/debug/app-debug.apk`
- [ ] Enable USB Debugging on Android phone (Settings > Developer Options)
- [ ] Connect phone via USB
- [ ] Install: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`
- [ ] Or open in Android Studio Emulator
- [ ] Launch app and test

## File Locations

| What | Where |
|------|-------|
| Angular App | `src/` |
| Built Web Files | `dist/CryptoCurrencyScanner/browser/` |
| Android Project | `android/` |
| Debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Release APK | `android/app/build/outputs/apk/release/app-release.apk` |

## Environment Variables (Windows)

Add these to your System Environment Variables:

**ANDROID_SDK_ROOT**
```
C:\Users\[YourUsername]\AppData\Local\Android\Sdk
```

**JAVA_HOME**
```
C:\Program Files\Java\jdk-11.0.x
```

**Restart terminal after adding!**

## Commands Reference

```bash
# Build Angular app
npm run build

# Add Android platform (first time only)
npx cap add android

# Sync web files to Android
npx cap sync android

# Build debug APK
cd android
gradlew assembleDebug

# Build release APK (requires keystore signing)
gradlew assembleRelease

# Install APK to connected phone
adb install -r app/build/outputs/apk/debug/app-debug.apk

# View device logs
adb logcat | findstr CryptoCurrencyScanner
```

## Expected Build Time

- First build: 15-20 minutes (downloads dependencies)
- Subsequent builds: 3-5 minutes
- APK size: ~50-100 MB

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| "Gradle build failed" | Delete `android/` folder and run `npx cap add android` again |
| "Android SDK not found" | Set `ANDROID_SDK_ROOT` environment variable and restart terminal |
| "java not found" | Set `JAVA_HOME` environment variable and restart terminal |
| "index.html not found" | Check `capacitor.config.ts` has correct `webDir` |
| "App crashes" | Run `adb logcat` to see error messages |

---

**Ready to build?** Start with the automated method: Double-click `build-apk.bat` 🚀
