# 📱 Algo Trading - Mobile APK Build Guide

## Overview
This guide explains how to build and deploy the Algo Trading Android APK using Capacitor and Gradle.

## Prerequisites

### System Requirements
- **Windows 10/11** (or macOS/Linux)
- **Java Development Kit (JDK)** 11 or higher
- **Android SDK** (API level 26+)
- **Android Studio** (optional but recommended)
- **Node.js** 18+ and npm 11+

### Installation Checklist

#### 1. Java JDK
```powershell
# Verify Java installation
java -version
javac -version

# If not installed, download from: https://www.oracle.com/java/technologies/downloads/
```

#### 2. Android SDK Setup
```powershell
# Option A: Install Android Studio (includes SDK)
# Download from: https://developer.android.com/studio

# Option B: Set environment variable (if SDK already installed)
# ANDROID_HOME = C:\Users\YourUsername\AppData\Local\Android\Sdk
# Add to PATH: %ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools

# Verify installation
adb --version
```

#### 3. Gradle Setup
```powershell
# Gradle is included with the project
# Verify via: .\gradlew --version (Windows) or ./gradlew --version (Mac/Linux)
```

## Build Process

### Step 1: Build Angular Production Bundle
```powershell
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading

npm run build:prod
```

**Expected Output:**
- Build artifacts generated in `dist/CryptoAlgoTrading/browser/`
- Build should complete successfully

### Step 2: Sync with Capacitor
```powershell
npx cap sync android
```

**What This Does:**
- Copies the web build to Android assets
- Updates native dependencies
- Prepares Android native code

### Step 3: Build Android APK

#### Option A: Debug APK (for testing)
```powershell
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading\android

# Windows
gradlew.bat assembleDebug

# macOS/Linux
./gradlew assembleDebug
```

**Output Location:** `CryptoAlgoTrading/android/app/build/outputs/apk/debug/app-debug.apk`

#### Option B: Release APK (for distribution)
```powershell
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading\android

# Windows
gradlew.bat assembleRelease

# macOS/Linux
./gradlew assembleRelease
```

**Output Location:** `CryptoAlgoTrading/android/app/build/outputs/apk/release/app-release.apk`

> ⚠️ **Note:** Release APK requires signing certificate. See [Signing the APK](#signing-the-apk) section.

### Step 4: Verify APK
```powershell
# Check APK file exists
Get-Item "D:\GitRepos\AlgoTrading\CryptoAlgoTrading\android\app\build\outputs\apk\debug\app-debug.apk" -ErrorAction Stop
```

## Installation & Testing

### Install on Connected Device
```powershell
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading\android

# Windows
gradlew.bat installDebug

# macOS/Linux
./gradlew installDebug
```

### Install via ADB (Android Debug Bridge)
```powershell
# Connect device via USB and enable USB debugging

# Install APK
adb install "D:\GitRepos\AlgoTrading\CryptoAlgoTrading\android\app\build\outputs\apk\debug\app-debug.apk"

# Launch app
adb shell am start -n com.crypto.scanner/.MainActivity

# View logs
adb logcat
```

## Signing the APK

### Generate Keystore
```powershell
# Create signing key
keytool -genkey -v -keystore crypto-algo-trading.keystore `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -alias crypto-algo-trading

# When prompted, enter:
# - Keystore password: [choose a strong password]
# - Key password: [can be same as keystore]
# - Certificate details: [enter your information]

# Save the keystore file securely!
# Location: D:\GitRepos\AlgoTrading\CryptoAlgoTrading\crypto-algo-trading.keystore
```

### Build Signed Release APK
```powershell
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading\android

# Create gradle.properties in android folder with:
# RELEASE_STORE_FILE=../crypto-algo-trading.keystore
# RELEASE_STORE_PASSWORD=your_keystore_password
# RELEASE_KEY_ALIAS=crypto-algo-trading
# RELEASE_KEY_PASSWORD=your_key_password

# Then build
gradlew.bat bundleRelease
# or
gradlew.bat assembleRelease
```

## Troubleshooting

### Common Issues

#### 1. "JAVA_HOME not set"
```powershell
# Set environment variable
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-21", "User")
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
```

#### 2. "ANDROID_HOME not set"
```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\YourUsername\AppData\Local\Android\Sdk", "User")
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
```

#### 3. "Build failed - SDK version mismatch"
```powershell
# Update build.gradle with correct SDK versions
# File: android/app/build.gradle

android {
  compileSdkVersion 34  # Update as needed
  targetSdkVersion 34   # Update as needed
  minSdkVersion 26      # Minimum supported version
}
```

#### 4. "Cannot find gradlew"
```powershell
# Ensure you're in the correct directory
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading\android

# Check if gradlew exists
Get-Item ".\gradlew.bat"
```

#### 5. "Build succeeded but no APK generated"
```powershell
# Check build output directory
Get-ChildItem -Recurse "D:\GitRepos\AlgoTrading\CryptoAlgoTrading\android\app\build\outputs\apk"
```

## Testing the APK

### On Emulator
```powershell
# Open Android Studio > Device Manager > Create/Start a virtual device
# Then install APK
adb install app-debug.apk
adb shell am start -n com.crypto.scanner/.MainActivity
```

### On Physical Device
```powershell
# 1. Enable USB Debugging
#    Settings > Developer Options > USB Debugging

# 2. Connect device via USB

# 3. Verify connection
adb devices

# 4. Install APK
adb install "D:\GitRepos\AlgoTrading\CryptoAlgoTrading\android\app\build\outputs\apk\debug\app-debug.apk"

# 5. Launch app
adb shell am start -n com.crypto.scanner/.MainActivity
```

## Publishing to Google Play

### Preparation
1. Create a Google Play Developer account ($25 one-time fee)
2. Create an Application listing
3. Generate and secure a release keystore
4. Build signed release APK (see [Signing the APK](#signing-the-apk))

### Steps
1. Build signed APK: `gradlew.bat bundleRelease`
2. Go to Google Play Console
3. Create new release
4. Upload signed APK/AAB
5. Fill in store listing details
6. Submit for review (3-24 hour review process)

## App Configuration

### Current Settings (capacitor.config.json)
```json
{
  "appId": "com.crypto.scanner",
  "appName": "Algo Trading",
  "webDir": "dist/CryptoAlgoTrading/browser",
  "server": {
    "androidScheme": "https",
    "cleartext": true,
    "allowInsecure": ["api.india.delta.exchange"]
  }
}
```

### Customization
- **appId**: Change `com.crypto.scanner` to your package name
- **appName**: Update display name in app store
- **allowInsecure**: Add any additional insecure domains for development

## Performance Optimization

### Recommended Settings for Production
```json
{
  "server": {
    "androidScheme": "https",
    "cleartext": false
  },
  "plugins": {
    "SplashScreen": {
      "launchAutoHide": true,
      "backgroundColor": "#667eea"
    }
  }
}
```

## Quick Reference Commands

```powershell
# Build production web bundle
npm run build:prod

# Sync with Capacitor
npx cap sync android

# Build debug APK
cd android && gradlew.bat assembleDebug

# Build release APK
cd android && gradlew.bat assembleRelease

# Install to connected device
cd android && gradlew.bat installDebug

# View ADB logs
adb logcat

# Open in Android Studio
npx cap open android
```

## Support Resources

- **Capacitor Docs**: https://capacitorjs.com/docs/android
- **Android Developers**: https://developer.android.com
- **Google Play Console**: https://play.google.com/console
- **APK Debugging**: https://developer.android.com/studio/debug

---

**Last Updated:** 2024
**Version:** 1.0
