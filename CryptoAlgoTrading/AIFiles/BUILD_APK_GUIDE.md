# Build Android APK for Crypto Scanner

## Prerequisites

### 1. Install Android Studio
- Download from: https://developer.android.com/studio
- Install Android SDK Platform 34 (or latest)
- Install Android SDK Build-Tools
- Accept Android SDK licenses

### 2. Set Environment Variables (Windows)
```powershell
# Add to System Environment Variables:
ANDROID_HOME = C:\Users\YourUsername\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Android\Android Studio\jbr

# Add to PATH:
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
%JAVA_HOME%\bin
```

## Build Steps

### Step 1: Build Angular App
```powershell
cd "C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner"
npm run build --configuration=production
```

### Step 2: Sync Capacitor
```powershell
npx cap sync android
```

### Step 3: Build APK

#### Option A: Using Capacitor CLI (Opens Android Studio)
```powershell
npx cap open android
```
Then in Android Studio:
1. Wait for Gradle sync to complete
2. Click "Build" > "Build Bundle(s) / APK(s)" > "Build APK(s)"
3. APK will be in: `android\app\build\outputs\apk\debug\app-debug.apk`

#### Option B: Using Gradle Command Line
```powershell
cd android
.\gradlew assembleDebug
```
APK location: `android\app\build\outputs\apk\debug\app-debug.apk`

#### Option C: Build Release APK (Signed)
```powershell
cd android
.\gradlew assembleRelease
```
APK location: `android\app\build\outputs\apk\release\app-release-unsigned.apk`

### Step 4: Install APK on Device
```powershell
# Via ADB (Android Debug Bridge)
adb install android\app\build\outputs\apk\debug\app-debug.apk

# Or copy the APK file to your phone and install manually
```

## Quick Build Script

Create a file `build-apk.ps1`:
```powershell
# Build Angular app
Write-Host "Building Angular application..."
npm run build --configuration=production

# Sync Capacitor
Write-Host "Syncing Capacitor..."
npx cap sync android

# Build APK
Write-Host "Building Android APK..."
cd android
.\gradlew assembleDebug
cd ..

# Copy APK to easy location
Write-Host "Copying APK..."
Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" -Destination "CryptoScanner.apk"

Write-Host "APK built successfully: CryptoScanner.apk"
```

Run with:
```powershell
.\build-apk.ps1
```

## Troubleshooting

### Config File Not Loading
The assets configuration has been fixed in `angular.json`. After building, verify:
- `dist/CryptoCurrencyScanner/browser/assets/config.json` exists
- Rebuild if missing: `npm run build`

### Gradle Build Fails
```powershell
# Clean build
cd android
.\gradlew clean

# Try build again
.\gradlew assembleDebug
```

### Android SDK Not Found
1. Open Android Studio
2. Go to: Tools > SDK Manager
3. Install:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Command-line Tools
4. Accept licenses:
   ```powershell
   cd %ANDROID_HOME%\cmdline-tools\latest\bin
   .\sdkmanager --licenses
   ```

### JAVA_HOME Error
Ensure JDK is installed:
```powershell
java -version
```
If not found, Android Studio includes JBR (JetBrains Runtime):
```
JAVA_HOME = C:\Program Files\Android\Android Studio\jbr
```

## APK Size Optimization (Optional)

### Enable ProGuard (Release Build)
Edit `android\app\build.gradle`:
```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Generate Signed Release APK

1. Generate keystore:
```powershell
keytool -genkey -v -keystore crypto-scanner.keystore -alias crypto-scanner -keyalg RSA -keysize 2048 -validity 10000
```

2. Configure signing in `android\app\build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('crypto-scanner.keystore')
            storePassword 'your_password'
            keyAlias 'crypto-scanner'
            keyPassword 'your_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

3. Build signed APK:
```powershell
cd android
.\gradlew assembleRelease
```

## Testing

### Test on Emulator
```powershell
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_5_API_34

# Install APK
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

### Test on Physical Device
1. Enable Developer Options on phone:
   - Settings > About Phone > Tap Build Number 7 times
2. Enable USB Debugging:
   - Settings > Developer Options > USB Debugging
3. Connect phone via USB
4. Install APK:
```powershell
adb devices  # Verify device connected
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

## Current Build Status

✅ Capacitor configured
✅ Android platform added
✅ Config file issue fixed in angular.json
✅ Positions display logic fixed
✅ Build scripts ready

## Next Steps After Build

1. Test positions loading on mobile
2. Test scanner functionality
3. Test order placement
4. Verify config.json is accessible
5. Test dark/light theme on mobile
6. Test responsive layout at various screen sizes

## Support

If build fails:
1. Check all prerequisites are installed
2. Verify environment variables are set
3. Run `npx cap doctor` to diagnose issues
4. Check error messages in terminal
5. Look for solutions in Capacitor docs: https://capacitorjs.com/docs/android
