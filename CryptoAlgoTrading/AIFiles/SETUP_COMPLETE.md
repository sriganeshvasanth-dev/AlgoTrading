# 📱 Algo Trading APK Build - Setup Complete

## ✅ Files Created

The following build automation files have been created in `CryptoAlgoTrading/`:

### 1. **APK_BUILD_GUIDE.md**
Comprehensive technical guide covering:
- Prerequisites and installation
- Step-by-step build process
- Signing and publishing procedures
- Troubleshooting reference
- Quick command reference

### 2. **MOBILE_BUILD_README.md** (Start Here!)
Developer-friendly guide with:
- Quick start instructions
- Detailed TL;DR section
- Complete walkthrough with examples
- Testing and installation procedures
- Google Play Store publishing guide

### 3. **build-apk.ps1**
PowerShell build automation script:
- Automated prerequisite checking
- Production bundle building
- Capacitor synchronization
- APK generation (debug or release)
- Optional automatic installation on device

### 4. **build-apk.bat**
Windows Batch build script:
- Alternative to PowerShell
- Interactive build type selection
- Color-coded output
- Error handling and suggestions

## 🚀 Quick Start

### Option A: PowerShell (Recommended)
```powershell
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading
.\build-apk.ps1
```

### Option B: Batch Script
```cmd
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading
build-apk.bat
```

### Option C: Manual Step-by-Step
```powershell
npm run build:prod
npx cap sync android
cd android
gradlew.bat assembleDebug
```

## 📋 Prerequisites Checklist

Before building, ensure you have:

- [ ] **Java JDK 11+** installed
  ```powershell
  java -version
  ```

- [ ] **JAVA_HOME** environment variable set
  ```powershell
  echo $env:JAVA_HOME
  ```

- [ ] **Android SDK** installed
  ```powershell
  echo $env:ANDROID_HOME
  ```

- [ ] **Node.js 18+** installed
  ```powershell
  node --version
  ```

- [ ] **npm 11+** installed
  ```powershell
  npm --version
  ```

## 🔧 Environment Setup (If Needed)

### Set JAVA_HOME
```powershell
# Find your JDK installation
Get-ChildItem "C:\Program Files\Java\"

# Set environment variable
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-21", "User")

# Verify
java -version
```

### Set ANDROID_HOME
```powershell
# Typical location from Android Studio
[Environment]::SetEnvironmentVariable(
  "ANDROID_HOME", 
  "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk", 
  "User"
)

# Verify
adb --version
```

## 📦 Build Outputs

### Debug APK (for testing)
**Location:** `android/app/build/outputs/apk/debug/app-debug.apk`
- Unoptimized
- Faster build time
- Can be sideloaded
- ~60-80 MB typical size

### Release APK (for distribution)
**Location:** `android/app/build/outputs/apk/release/app-release.apk`
- Optimized and minified
- Smaller file size (~30-40 MB typical)
- Requires signing with keystore
- Ready for Google Play Store

## 📱 Installation on Device

### Install APK
```powershell
adb install "android\app\build\outputs\apk\debug\app-debug.apk"
```

### Launch App
```powershell
adb shell am start -n com.crypto.scanner/.MainActivity
```

### View Logs
```powershell
adb logcat | findstr "com.crypto.scanner"
```

## 🔐 Signing Release APK

For Google Play Store submission:

```powershell
# 1. Generate keystore (one-time)
keytool -genkey -v -keystore crypto-algo-trading.keystore `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -alias crypto-algo-trading

# 2. Create android/gradle.properties with signing credentials

# 3. Build signed release APK
cd android
gradlew.bat assembleRelease
```

See `MOBILE_BUILD_README.md` for detailed signing instructions.

## 🌐 Publishing to Google Play

1. Create Google Play Developer account (https://play.google.com/console)
2. Pay $25 USD registration fee
3. Create app listing
4. Upload signed APK
5. Complete store information
6. Submit for review (3-24 hours)

## 🆘 Troubleshooting

### "Build failed - gradlew not found"
```powershell
# Ensure Android folder exists
Test-Path "android\gradlew.bat"

# Re-sync if missing
npx cap sync android
```

### "Java not found"
```powershell
# Install from: https://www.oracle.com/java/technologies/downloads/
# Then set JAVA_HOME environment variable
```

### "Android SDK not found"
```powershell
# Install Android Studio or command-line tools
# Set ANDROID_HOME environment variable
# Download required SDK components via sdkmanager
```

### "APK build succeeded but file not found"
```powershell
# Check output directory
Get-ChildItem -Recurse "android\app\build\outputs\apk"
```

## 📚 Documentation

- **MOBILE_BUILD_README.md** - Complete build guide (START HERE)
- **APK_BUILD_GUIDE.md** - Detailed technical reference
- **build-apk.ps1** - PowerShell automation script
- **build-apk.bat** - Windows batch automation script

## 💡 What's Different from Web Build?

| Aspect | Web | Mobile APK |
|--------|-----|-----------|
| Build Command | `npm run build:prod` | `npm run build:prod + gradlew assembleDebug` |
| Deployment | Web server | Google Play Store or sideload |
| Size | ~10-20 MB | ~60-80 MB (debug), ~30-40 MB (release) |
| Performance | Browser-based | Native Android container |
| Permissions | Browser sandbox | Android manifest permissions |
| Offline | No | Possible with offline features |

## 🎯 Current Project Status

✅ **Already Configured:**
- Capacitor v5.7.0 installed
- Android project created
- Gradle build system ready
- App ID: `com.crypto.scanner`
- App Name: `Algo Trading`

## 📞 Need Help?

1. Review error messages carefully
2. Check `MOBILE_BUILD_README.md` troubleshooting section
3. Verify all prerequisites are installed
4. Check that environment variables are set
5. Try: `gradlew.bat clean assembleDebug` for fresh build

## 🎉 Next Steps

1. Read **MOBILE_BUILD_README.md** for detailed instructions
2. Run build script: `.\build-apk.ps1`
3. Install on device: `adb install android\app\build\outputs\apk\debug\app-debug.apk`
4. Test all features
5. When ready: Follow publishing steps in guide

---

**Build System:** Gradle + Capacitor  
**Target OS:** Android 8.0+ (API 26+)  
**App Package:** com.crypto.scanner  
**Build Tools:** Angular 21.2 + Capacitor 5.7  

Happy building! 🚀
