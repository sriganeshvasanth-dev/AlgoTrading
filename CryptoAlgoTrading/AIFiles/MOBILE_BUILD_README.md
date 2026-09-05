# 🚀 Algo Trading - Mobile APK Build Instructions

## Quick Start (TL;DR)

```powershell
# PowerShell (Recommended)
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading
.\build-apk.ps1

# Or Batch Script
build-apk.bat
```

## Prerequisites Setup

### 1. **Install Java Development Kit (JDK)**

**Download:** https://www.oracle.com/java/technologies/downloads/

```powershell
# Verify installation
java -version
javac -version

# Expected output: Java version 11 or higher
```

**Set JAVA_HOME (if not auto-set):**
```powershell
# Temporarily
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"

# Permanently (Admin PowerShell)
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-21", "Machine")
```

### 2. **Install Android SDK**

**Option A: Android Studio (Easiest)**
1. Download from: https://developer.android.com/studio
2. Install and open Android Studio
3. SDK is installed automatically to: `C:\Users\[YourUsername]\AppData\Local\Android\Sdk`

**Option B: Command Line Tools Only**
```powershell
# Download from https://developer.android.com/studio#command-tools
# Extract to your preferred location
# Update ANDROID_HOME environment variable

[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Android\Sdk", "Machine")
$env:ANDROID_HOME = "C:\Android\Sdk"

# Verify
echo $env:ANDROID_HOME
```

**Verify Installation:**
```powershell
adb --version
sdkmanager --list
```

### 3. **Verify Node.js & npm**

```powershell
node --version    # Should be v18+ (your version: run this to check)
npm --version     # Should be v11+
```

### 4. **Android SDK Components**

Ensure these are installed (if using Android Studio, they install automatically):
- Android SDK Platform (API 26+)
- Android SDK Build-Tools (latest)
- Android Emulator (optional)

```powershell
# Check what's installed
sdkmanager --list

# If needed, install specific component
sdkmanager "platforms;android-34"
sdkmanager "build-tools;34.0.0"
```

## Build Options

### **Build Type 1: Debug APK** (Recommended for Testing)

Perfect for development, testing, and internal distribution.

**Advantages:**
- Faster build time
- Can run on physical devices/emulators
- Easier to debug
- Can be sideloaded (installed manually)

**Command:**
```powershell
.\build-apk.ps1 -BuildType debug

# Or use batch script (prompts for choice)
.\build-apk.bat

# Or manual step-by-step
npm run build:prod
npx cap sync android
cd android
gradlew.bat assembleDebug
```

**Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

**Install on Device:**
```powershell
adb install "android\app\build\outputs\apk\debug\app-debug.apk"
adb shell am start -n com.crypto.scanner/.MainActivity
```

### **Build Type 2: Release APK** (For Distribution)

For submitting to Google Play Store or distributing to users.

**Advantages:**
- Smaller file size (optimized)
- Better performance
- Secure for production
- Required for app store submission

**Build Command:**
```powershell
.\build-apk.ps1 -BuildType release

# Or manual
cd android
gradlew.bat assembleRelease
```

**Important:** Release APKs must be digitally signed. See [Signing](#signing-release-apk) section.

## Complete Build Walkthrough

### Using PowerShell Script (Recommended)

```powershell
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading

# Basic usage (debug build)
.\build-apk.ps1

# Release build
.\build-apk.ps1 -BuildType release

# Auto-install after building
.\build-apk.ps1 -BuildType debug -Install

# Skip Angular build if already built
.\build-apk.ps1 -SkipBuild
```

### Using Batch Script

```batch
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading
build-apk.bat

# Then select option [1] for debug or [2] for release
```

### Manual Step-by-Step

```powershell
# Step 1: Build Angular production bundle
npm run build:prod
# Output: CryptoAlgoTrading/dist/browser/

# Step 2: Sync Angular build with Capacitor
npx cap sync android
# Copies web assets to Android

# Step 3: Build APK
cd android

# Debug build
gradlew.bat assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# OR Release build
gradlew.bat assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

## Installing & Testing APK

### 1. Prerequisites for Installation

**Connect Android Device:**
```powershell
# Enable USB Debugging on device:
# Settings → Developer Options → USB Debugging (toggle ON)

# Connect device via USB cable

# Verify connection
adb devices
# Should show device with status "device"
```

### 2. Install APK

**Via Gradle:**
```powershell
cd android
gradlew.bat installDebug
```

**Via ADB (Android Debug Bridge):**
```powershell
adb install "D:\GitRepos\AlgoTrading\CryptoAlgoTrading\android\app\build\outputs\apk\debug\app-debug.apk"

# Wait for completion message:
# "Success"
```

### 3. Launch App

```powershell
# Start the app
adb shell am start -n com.crypto.scanner/.MainActivity

# View logs (helpful for debugging)
adb logcat

# Stop logs
Ctrl + C

# Clear logs
adb logcat -c
```

### 4. Test Functionality

- Open the app
- Test all key features (charts, orders, P&L)
- Check network connectivity
- Verify data loading
- Test error handling

## Signing Release APK

Required for Google Play Store submission.

### Step 1: Create Keystore

```powershell
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading

# Create keystore (one-time)
keytool -genkey -v -keystore crypto-algo-trading.keystore `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -alias crypto-algo-trading
```

**When prompted, enter:**
```
Keystore password: [strong password, e.g., P@ss123Algo]
Re-enter password: [same password]
First and last name: Algo Trading
Organizational unit: Development
Organization: Your Organization
City: Your City
State: Your State
Country code: US
Certificate fingerprint: (press Enter - will be auto-generated)
```

**Output:** `crypto-algo-trading.keystore` file created in project root

⚠️ **IMPORTANT:** Keep this file and password secure! Store in a safe location.

### Step 2: Configure Gradle for Signing

Create file: `android/gradle.properties`

```properties
RELEASE_STORE_FILE=../crypto-algo-trading.keystore
RELEASE_STORE_PASSWORD=P@ss123Algo
RELEASE_KEY_ALIAS=crypto-algo-trading
RELEASE_KEY_PASSWORD=P@ss123Algo
```

⚠️ **Security Note:** Don't commit this file with real passwords to version control!

### Step 3: Build Signed Release APK

```powershell
cd android

# Build and sign
gradlew.bat assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

**Verify Signature:**
```powershell
jarsigner -verify -verbose -certs "app\build\outputs\apk\release\app-release.apk"
```

## Troubleshooting

### Error: "JAVA_HOME not set"
```powershell
# Set Java path
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-21", "User")
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
echo $env:JAVA_HOME
```

### Error: "ANDROID_HOME not set"
```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\YourUsername\AppData\Local\Android\Sdk", "User")
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
echo $env:ANDROID_HOME
```

### Error: "SDK version mismatch"
**File:** `android/app/build.gradle`

```gradle
android {
    compileSdkVersion 34
    targetSdkVersion 34
    minSdkVersion 26
}
```

Update versions to match your installed SDK.

### Error: "Cannot find gradlew"
```powershell
# Verify you're in android folder
ls gradlew.bat

# If not found, Android folder may be missing
# Re-sync: npx cap sync android
```

### Error: "Build failed - no APK"
```powershell
# Clean and rebuild
cd android
gradlew.bat clean assembleDebug

# Check for detailed error messages
# If still failing, check:
# - JAVA_HOME and ANDROID_HOME set correctly
# - Enough disk space (2 GB minimum)
# - No spaces in project path
```

### App Crashes After Installation
```powershell
# View device logs
adb logcat

# Look for error messages starting with package name: com.crypto.scanner

# Uninstall and reinstall
adb uninstall com.crypto.scanner
adb install "path/to/apk"
```

## Publishing to Google Play Store

### 1. Create Google Play Account
- Visit: https://play.google.com/console
- Sign in with Google account
- Pay $25 USD one-time registration fee
- Accept developer agreement

### 2. Create App Listing
- Add app name: "Algo Trading"
- Set category: Finance
- Add description, screenshots, icon
- Fill in all required fields

### 3. Prepare Release
- Build and sign release APK (see [Signing](#signing-release-apk))
- Create APK bundle (optional but recommended)

### 4. Upload to Google Play
```
Google Play Console 
→ Your App 
→ Releases 
→ Create new release 
→ Browse and select: app-release.apk 
→ Add release notes 
→ Review and publish
```

### 5. Submit for Review
- Typical review time: 3-24 hours
- Google performs automated and manual testing
- Address any issues if rejected

## Project Structure

```
CryptoAlgoTrading/
├── src/
│   └── app/                    # Angular application
├── android/                    # Capacitor Android project
│   ├── app/
│   │   ├── build/              # Build output directory
│   │   │   └── outputs/apk/    # APK files generated here
│   │   └── build.gradle        # Android app configuration
│   ├── build.gradle            # Root Gradle configuration
│   └── gradlew.bat             # Gradle wrapper script
├── dist/                       # Angular build output
├── angular.json                # Angular configuration
├── capacitor.config.json       # Capacitor configuration
├── package.json                # Node.js dependencies
├── APK_BUILD_GUIDE.md          # Detailed build documentation
├── build-apk.ps1              # PowerShell build script
└── build-apk.bat              # Batch build script
```

## Configuration Files

### capacitor.config.json
Controls app name, ID, permissions, and network settings:

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

**To change:**
- App ID: Change `appId` (e.g., `com.mycompany.algotrading`)
- App name: Change `appName`
- Permissions: Add to `plugins` section

### android/app/build.gradle
Android build configuration:

```gradle
android {
    compileSdkVersion 34
    targetSdkVersion 34
    minSdkVersion 26

    defaultConfig {
        applicationId "com.crypto.scanner"
        versionCode 1
        versionName "1.0.0"
    }
}
```

**To change:**
- Version: Update `versionCode` and `versionName`
- App ID: UPDATE `applicationId`

## Environment Variables

Add to PowerShell profile for permanent setup:

```powershell
# Edit profile
notepad $PROFILE

# Add these lines
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"

# Reload profile
. $PROFILE
```

## Performance Tips

- **Build Caching:** Gradle caches builds. Use `gradlew clean` if rebuild needed
- **Production Build:** Use `npm run build:prod` only, not regular `build`
- **Release APK:** Significantly smaller and faster than debug APK
- **SDK Updates:** Keep Android SDK Build Tools updated for best performance

## Additional Resources

- **Capacitor Docs:** https://capacitorjs.com/docs/android
- **Android Development:** https://developer.android.com
- **Google Play Console:** https://play.google.com/console
- **APK Signing:** https://developer.android.com/studio/publish/app-signing
- **Gradle Documentation:** https://gradle.org/docs

## Support & Debugging

For issues, check:
1. **Logs:** `adb logcat` for runtime errors
2. **Build Output:** PowerShell/Batch script output for compile errors
3. **Prerequisites:** Verify all tools installed and environment variables set
4. **Clean Build:** Try `gradlew.bat clean` then rebuild

---

**Version:** 1.0  
**Last Updated:** 2024  
**Compatible With:** Angular 21+, Capacitor 5.7+, Android 8.0+
