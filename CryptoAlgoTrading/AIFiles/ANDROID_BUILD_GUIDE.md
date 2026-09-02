# Convert CryptoCurrencyScanner to Android APK

## Prerequisites

Before starting, ensure you have:
1. **Android SDK** - Download from Android Studio
2. **Java Development Kit (JDK) 11+** - Java SDK for building
3. **Node.js & npm** - Already installed
4. **Git** - For version control

## Step 1: Install Ionic CLI (Run in Terminal/Command Prompt)

```bash
npm install -g @ionic/cli
```

## Step 2: Install Capacitor in Your Project

Navigate to your project folder and run:

```bash
cd C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner
npm install @capacitor/core @capacitor/cli @capacitor/android
```

## Step 3: Initialize Capacitor

```bash
npx cap init
```

When prompted:
- **App name:** CryptoCurrencyScanner
- **App ID:** com.crypto.scanner (must be unique)
- **Directory:** (press Enter for default)

## Step 4: Create Capacitor Configuration File

Create `capacitor.config.ts` in the root directory:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.crypto.scanner',
  appName: 'Crypto Scanner',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
    },
  },
};

export default config;
```

## Step 5: Add Android Platform

```bash
npx cap add android
```

This creates an `android/` folder with the Android project.

## Step 6: Build Angular App for Production

```bash
npm run build
```

This creates optimized files in the `dist/` folder.

## Step 7: Copy Web Assets to Android

```bash
npx cap copy android
```

## Step 8: Generate APK

There are two ways to build the APK:

### Option A: Using Android Studio (Recommended for first-timers)

1. Open Android Studio
2. Select "Open an Existing Project"
3. Navigate to: `C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner\android`
4. Click "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"
5. Wait for build to complete
6. APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option B: Using Command Line

```bash
cd android
gradlew assembleDebug
```

APK will be at: `app/build/outputs/apk/debug/app-debug.apk`

## Step 9: Install on Android Phone

**Debug APK (for testing):**
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

**Release APK (for distribution):**

First, generate keystore:
```bash
keytool -genkey -v -keystore crypto-scanner.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias crypto-scanner
```

Then build release APK: Update `android/app/build.gradle` with the keystore info and run:
```bash
gradlew assembleRelease
```

APK will be at: `app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### 1. Gradle Build Fails
- Ensure Android SDK is installed
- Check ANDROID_SDK_ROOT environment variable is set
- Run: `gradlew clean` then try again

### 2. App Won't Connect to API
- Add to `capacitor.config.ts`:
```typescript
server: {
  cleartext: true,
  allowInsecure: ['api.india.delta.exchange']
}
```

### 3. App Crashes on Launch
- Check logcat: `adb logcat | grep CryptoCurrencyScanner`
- Ensure API endpoint is accessible from mobile device
- Clear app cache: `adb shell pm clear com.crypto.scanner`

## APK Installation on Android

1. **Enable Unknown Sources:**
   - Settings → Security → Unknown Sources

2. **Transfer APK to phone:**
   - Via USB cable
   - Via email
   - Via cloud storage

3. **Install:**
   - Open file manager
   - Tap the APK file
   - Install

## Environment Setup

Add to your Windows Environment Variables:

```
ANDROID_SDK_ROOT=C:\Users\YourUsername\AppData\Local\Android\Sdk
ANDROID_HOME=%ANDROID_SDK_ROOT%
JAVA_HOME=C:\Program Files\Java\jdk-11.x.x (or your JDK path)
```

Then restart your terminal.

## Next Steps

After APK is generated:
1. Test on Android device
2. For distribution, sign the APK with your keystore
3. Upload to Google Play Store or distribute via APK link

## Support

If you encounter issues:
1. Check Android Studio logs
2. Review Capacitor documentation: https://capacitorjs.com/docs/android
3. Check Ionic documentation: https://ionicframework.com/docs
