# 📱 Crypto Currency Scanner - APK Build Guide

This guide explains how to build and generate an APK file for the Crypto Currency Scanner Android app.

## Prerequisites

Before building the APK, ensure you have the following installed on your system:

### 1. **Android SDK & Android Studio**
   - Download: https://developer.android.com/studio
   - Install Android Studio (includes SDK, emulator, Android tools)
   - Set up Android SDK environment variable:
     ```powershell
     # Add to your system environment variables:
     ANDROID_HOME = C:\Users\{YourUsername}\AppData\Local\Android\sdk
     # Add to PATH: %ANDROID_HOME%\platform-tools
     ```

### 2. **Java Development Kit (JDK)**
   - Required: JDK 11 or higher
   - Download: https://www.oracle.com/java/technologies/downloads/#java11
   - Set up JAVA_HOME environment variable:
     ```powershell
     # Add to system environment variables:
     JAVA_HOME = C:\Program Files\Java\jdk-11.x.x
     # Add to PATH: %JAVA_HOME%\bin
     ```

### 3. **Node.js & npm**
   - Required: Node.js 16 or higher
   - Download: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

### 4. **Gradle** (Optional - Android Studio includes it)
   - Usually bundled with Android Studio
   - Or install separately if needed

## Environment Setup

### Windows PowerShell Setup

```powershell
# Check if environment variables are set
$env:ANDROID_HOME
$env:JAVA_HOME

# Add them temporarily in PowerShell session if needed:
$env:ANDROID_HOME = "C:\Users\{YourUsername}\AppData\Local\Android\sdk"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-11.x.x"
```

### Verify Setup

```powershell
# Check Java installation
java -version
javac -version

# Check Android SDK
"$env:ANDROID_HOME\platform-tools\adb.exe" version

# Check Gradle (should show version)
cd $ANDROID_SDK\tools
gradle --version
```

## Building the APK

### Step 1: Build the Angular Application (Production)

```powershell
# Navigate to project root
cd C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner\

# Clean build output (optional)
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# Build Angular app for production
npm run build:prod
```

This creates:
- `dist/CryptoCurrencyScanner/browser/` - Production build output
- This is the web content that will be embedded in the APK

### Step 2: Sync with Capacitor

```powershell
# Sync the web build with Android project
npx cap sync android
```

This command:
- Copies the web build to the Android project
- Updates Android dependencies
- Prepares the Android project for compilation

### Step 3: Build the APK

You have two options:

#### Option A: Build via Android Studio (Recommended for first-time)

```powershell
# Open the Android project in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for the build to complete (~5-10 minutes)
4. APK will be generated at: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Option B: Build via Gradle Command Line (Faster)

```powershell
# Navigate to android directory
cd android

# Build debug APK (faster, suitable for testing)
.\gradlew.bat build

# Or build release APK (optimized for production)
.\gradlew.bat assembleRelease
```

**Generated APK locations:**
- Debug APK: `android\app\build\outputs\apk\debug\app-debug.apk`
- Release APK: `android\app\build\outputs\apk\release\app-release.apk`

### Step 4: Locate the APK File

```powershell
# List generated APK files
Get-ChildItem -Path "android\app\build\outputs\apk\" -Recurse -Filter "*.apk"
```

**Output will show:**
- `app-debug.apk` (~20-30 MB) - For development/testing
- `app-release.apk` (~15-20 MB) - For production (requires signing)

## Installation & Testing

### Install on Physical Android Device

```powershell
# Connect your Android device via USB
# Enable USB Debugging on the device (Settings > Developer Options > USB Debugging)

# Install the APK
adb install "android\app\build\outputs\apk\debug\app-debug.apk"

# Or reinstall if already installed
adb install -r "android\app\build\outputs\apk\debug\app-debug.apk"
```

### Install on Android Emulator

```powershell
# Start emulator (from Android Studio or command line)
emulator -avd Nexus_5_API_30

# Install APK
adb install "android\app\build\outputs\apk\debug\app-debug.apk"

# Launch the app
adb shell am start -n com.crypto.scanner/.MainActivity
```

### Run/View Logs

```powershell
# View real-time logs
adb logcat -c
adb logcat | findstr "CryptoScanner"

# List installed apps
adb shell pm list packages | findstr "crypto"

# Uninstall app
adb uninstall com.crypto.scanner
```

## Release Build (Production)

For app store submission, you need to create a **signed release APK**:

### Step 1: Create Keystore (One-time only)

```powershell
# Generate keystore file
keytool -genkey -v -keystore my-release-key.keystore `
  -keyalg RSA -keysize 2048 -validity 365 -alias my-key-alias

# You'll be prompted for:
# - Keystore password
# - Key password
# - Name, Organization, City, State, Country info
# - Confirm key name and password
```

### Step 2: Configure Gradle Signing

Edit `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('path/to/my-release-key.keystore')
            storePassword 'your-keystore-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-key-password'
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 3: Build Signed Release APK

```powershell
cd android
.\gradlew.bat assembleRelease
```

**Output:** `android\app\build\outputs\apk\release\app-release.apk` (Signed & optimized)

## Troubleshooting

### Common Issues & Solutions

#### Issue: "ANDROID_HOME not found"
```powershell
# Set permanently
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\...\AppData\Local\Android\sdk", "User")

# Verify
$env:ANDROID_HOME
```

#### Issue: "Gradle build failed"
```powershell
# Clean gradle cache
cd android
rm -Recurse -Force .gradle
.\gradlew.bat clean
.\gradlew.bat build
```

#### Issue: "Unable to locate gradle"
```powershell
# Use gradle wrapper instead
cd android
.\gradlew.bat build  # Uses./gradlew (wrapper) instead of gradle command
```

#### Issue: "Build tools version not installed"
- Open Android Studio → SDK Manager
- Install the required build-tools version shown in error
- Commonly: "Build Tools 34.0.0" or similar

#### Issue: "Emulator won't start"
```powershell
# List available AVDs
emulator -list-avds

# Force start with specific memory
emulator -avd Nexus_5_API_30 -memory 2048
```

#### Issue: "App crashes on startup"
```powershell
# View detailed error logs
adb logcat | findstr "E/"

# Check if API is blocking requests
# Edit capacitor.config.ts allowInsecure list if needed
```

## Complete Build Script

Create `build-apk.ps1`:

```powershell
#!/usr/bin/env pwsh

Write-Host "🔨 Crypto Currency Scanner - APK Build Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Java not found. Please install JDK 11+" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Step 1: Clean old build
Write-Host "`n🧹 Cleaning old build..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android/app/build -ErrorAction SilentlyContinue

# Step 2: Build Angular
Write-Host "`n📦 Building Angular app..." -ForegroundColor Yellow
npm run build:prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Angular build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Angular build completed" -ForegroundColor Green

# Step 3: Sync with Capacitor
Write-Host "`n🔄 Syncing with Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Capacitor sync completed" -ForegroundColor Green

# Step 4: Build APK
Write-Host "`n🚀 Building APK with Gradle..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Gradle build failed" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "✅ APK build completed" -ForegroundColor Green

# Step 5: Locate APK
Write-Host "`n🎯 Locating APK file..." -ForegroundColor Yellow
$apkPath = Get-ChildItem -Path "android/app/build/outputs/apk/debug/" -Filter "*.apk" -Recurse | Select-Object -First 1
if ($apkPath) {
    Write-Host "✅ APK ready at: $($apkPath.FullName)" -ForegroundColor Green
    Write-Host "   Size: $([math]::Round($apkPath.Length / 1MB, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "❌ APK file not found" -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ Build complete! You can now install the APK." -ForegroundColor Green
Write-Host "`n💡 To install on device:" -ForegroundColor Cyan
Write-Host "   adb install `"$($apkPath.FullName)`"" -ForegroundColor White
```

Run it:
```powershell
.\build-apk.ps1
```

## Summary

**Quick Build Steps:**
1. `npm run build:prod` - Build Angular
2. `npx cap sync android` - Sync to Android
3. `cd android && .\gradlew.bat build` - Build APK
4. Use APK from `android/app/build/outputs/apk/debug/app-debug.apk`

**Typical build time:** 5-10 minutes depending on your system

**APK file sizes:**
- Debug: ~20-30 MB
- Release: ~15-20 MB

## Additional Resources

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Android Studio Documentation](https://developer.android.com/studio/intro)
- [Android Build Tools](https://developer.android.com/studio/releases/build-tools)
- [Google Play Console](https://play.google.com/console)

---

**Questions?** Check the logs or run with verbose mode:
```powershell
.\gradlew.bat build --info
```
