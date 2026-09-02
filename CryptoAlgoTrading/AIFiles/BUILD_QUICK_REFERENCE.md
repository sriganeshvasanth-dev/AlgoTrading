# 🚀 Quick APK Build Reference

## One-Command Build

```powershell
# Run the automated build script
.\build-apk-quick.ps1

# Or manual 3-step build:
npm run build:prod
npx cap sync android
cd android && .\gradlew.bat build && cd ..
```

## Find Your APK

```
📍 Debug APK:   android/app/build/outputs/apk/debug/app-debug.apk
📍 Release APK: android/app/build/outputs/apk/release/app-release.apk
```

## Install on Device/Emulator

```powershell
# Install debug APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Uninstall
adb uninstall com.crypto.scanner

# View logs
adb logcat | findstr "com.crypto.scanner"
```

## Build Steps Explained

| Step | Command | Purpose | Time |
|------|---------|---------|------|
| 1️⃣ Build Web | `npm run build:prod` | Compile Angular to static files | 2-3 min |
| 2️⃣ Sync | `npx cap sync android` | Copy files to Android project | 30 sec |
| 3️⃣ Build APK | `cd android && .\gradlew.bat build && cd ..` | Compile Java to APK | 3-5 min |

## File Sizes

- **Debug APK**: 20-30 MB (testing only)
- **Release APK**: 15-20 MB (optimized, ready for store)

## Environment Variables (One-time Setup)

```powershell
# Create permanent env vars
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\YourName\AppData\Local\Android\sdk", "User")
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-11.x.x", "User")

# Verify
$env:ANDROID_HOME
$env:JAVA_HOME
```

## Common Commands Cheat Sheet

```powershell
# Development flow
npm start                    # Web dev server (http://127.0.0.1:4200)
npm run build:prod          # Production web build
npx cap sync android        # Sync web → Android
npx cap open android        # Open in Android Studio

# Android build
cd android
.\gradlew.bat build         # Build debug APK
.\gradlew.bat assembleRelease  # Build release APK
.\gradlew.bat clean         # Clean build artifacts
cd ..

# Device interaction
adb devices                 # List connected devices
adb install -r app.apk      # Install APK
adb uninstall com.crypto.scanner  # Uninstall app
adb logcat                  # View device logs
adb shell am start -n com.crypto.scanner/.MainActivity  # Launch app
```

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| "ANDROID_HOME not found" | Set env var (see above) |
| "Gradle build failed" | `cd android && .\gradlew.bat clean && cd ..` then rebuild |
| "APK not found" | Check `android/app/build/outputs/apk/` exists |
| "adb not found" | Add `%ANDROID_HOME%\platform-tools` to PATH |
| "App crashes on start" | Check `capacitor.config.ts` allowInsecure settings |

## Performance Tips

```powershell
# Skip unnecessary builds
npm run build:prod -- --no-progress  # Faster console output

# Parallel gradle builds (faster)
cd android
.\gradlew.bat build -x test --parallel --daemon
cd ..

# Use gradle cache
.\gradlew.bat build --build-cache
```

## What Gets Built?

```
📦 Angular Build
   ├── Minified JavaScript
   ├── Tree-shaken dependencies
   ├── Optimized CSS
   └── Bundled assets

➡️  Synced to Android

📱 Android Build
   ├── Capacitor runtime
   ├── Web content embedded
   ├── Native modules
   └── Compiled to APK
```

## Testing Checklist

- [ ] App launches without crashes
- [ ] Navigation works
- [ ] API calls function properly
- [ ] No console errors
- [ ] UI responsive on device

Run tests:
```powershell
adb logcat E  # See errors only
adb logcat | findstr "com.crypto.scanner"  # App logs only
```

## Release Preparation

For Google Play Store submission:
1. Create signed release APK (see APK_BUILD_GUIDE.md)
2. Test thoroughly on device
3. Update version in `capacitor.config.ts`
4. Build release APK
5. Upload to Google Play Console

## Still Stuck?

1. Check `APK_BUILD_GUIDE.md` for detailed instructions
2. View build logs: `.\gradlew.bat build --info`
3. Check device logs: `adb logcat -c`
4. Verify Android SDK: Open Android Studio → SDK Manager
5. Try clean rebuild: `.\build-apk-quick.ps1`

---

**Need help?** Open APK_BUILD_GUIDE.md for complete documentation.
