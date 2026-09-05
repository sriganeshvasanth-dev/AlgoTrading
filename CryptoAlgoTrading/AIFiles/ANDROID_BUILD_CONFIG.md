# Android Build Optimization Configuration

## AndroidManifest.xml - Battery & Scheduler Optimization

The following configuration should be verified in `android/app/src/main/AndroidManifest.xml`:

### Application Tag Optimization
```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config"
    <!-- Doze Mode Optimization -->
    android:enableOnBackInvokedCallback="true">
```

### Required Scheduler Permissions
```xml
<!-- Core networking -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Scheduler & Background Execution -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM_PERMISSION" />

<!-- Notifications & User Feedback -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.ACCESS_NOTIFICATION_POLICY" />

<!-- Battery Optimization (Optional but recommended) -->
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

### Boot Receiver for Scheduler Persistence
```xml
<!-- Must be present to reschedule tasks on device restart -->
<receiver
    android:name="com.getcapacitor.localnotifications.NotificationBootReceiverKt"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
    </intent-filter>
</receiver>

<!-- Optional: Shutdown receiver to clean up before shutdown -->
<receiver
    android:name="com.getcapacitor.localnotifications.NotificationBootReceiverKt"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.ACTION_SHUTDOWN" />
    </intent-filter>
</receiver>
```

---

## build.gradle Configuration

### Minimum Configuration
```gradle
android {
    namespace "com.crypto.scanner"
    compileSdk 34  // Target latest Android API

    defaultConfig {
        applicationId "com.crypto.scanner"
        minSdk 24  // Android 7.0 (minimum for Capacitor)
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            debuggable true
            minifyEnabled false
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }
}

dependencies {
    // Capacitor core
    implementation 'com.getcapacitor:android:5.4.0'

    // Capacitor plugins
    implementation 'com.getcapacitor.community:local-notifications:5.0.0'

    // AndroidX (required)
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.core:core:1.12.0'
    implementation 'androidx.legacy:legacy-support-v4:1.0.0'
    implementation 'androidx.versionedparcelable:versionedparcelable:1.1.1'

    // Workmanager for advanced scheduling (optional)
    implementation 'androidx.work:work-runtime:2.8.1'
}
```

---

## Doze Mode Handling

Android 6.0+ introduced Doze Mode to save battery. When device is idle/screen off, resource usage is restricted.

### Impact on Scheduler
- ❌ Exact alarms may be delayed by 10+ minutes
- ❌ Network requests may be delayed  
- ❌ Wake lock might not prevent deep sleep

### Solution: Request Battery Optimization Exemption

Add to config (optional but recommended):
```xml
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

Then request user permission in app:
```typescript
import { Battery } from '@capacitor/device';

async requestBatteryOptimizationExemption() {
  try {
    if (this.isNative()) {
      const info = await Battery.getBatteryInfo();
      console.log('🔋 Battery level:', info.level);

      // Show user prompt to add app to battery optimization whitelist
      console.log('Please add Algo Trading to battery optimization exceptions for reliable scheduling');
    }
  } catch (error) {
    console.error('Failed to get battery info:', error);
  }
}
```

---

## Network Configuration (network_security_config.xml)

Location: `android/app/src/main/res/xml/network_security_config.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow cleartext traffic to Delta API (development only) -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">api.india.delta.exchange</domain>
    </domain-config>

    <!-- For production, use HTTPS only -->
    <domain-config>
        <domain includeSubdomains="true">api.production.exchange</domain>
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </domain-config>
</network-security-config>
```

---

## ProGuard Configuration for Release APK

Location: `android/app/proguard-rules.pro`

```proguard
# Capacitor
-keep class com.getcapacitor.** { *; }
-keep public class com.getcapacitor.plugins.** { *; }

# Keep annotation classes
-keep class android.support.annotation.** { *; }
-keep class androidx.annotation.** { *; }

# Keep local notifications
-keep public class com.getcapacitor.community.localnotifications.** { *; }

# Angular/TypeScript (via proguard-android-optimize.txt)
-keep class ng.** { *; }

# Preserve line numbers for crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Optimization
-optimizationpasses 5
-dontusemixedcaseclassnames
-verbose
```

---

## gradle.properties Settings

Location: `android/gradle.properties`

```properties
# Gradle settings
org.gradle.jvmargs=-Xmx2048m

# Android settings
android.useAndroidX=true
android.enableJetifier=true

# Capacitor
capacitor.project.type=app
capacitor.android.minVersionCode=1
capacitor.android.minVersionName=1.0.0

# Build optimization
android.minSdkVersion=24
android.targetSdkVersion=34
android.compileSdkVersion=34
```

---

## Installation & Deployment

### Debug Build
```bash
cd android
./gradlew clean assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Release Build
```bash
cd android
./gradlew clean assembleRelease

# Manual signing (if not configured in gradle)
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore my-app.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  my-key-alias

# Align APK
zipalign -v 4 \
  app-release-unsigned.apk \
  app-release-aligned.apk

# Final APK
mv app-release-aligned.apk my-app-release.apk
```

---

## Testing on Physical Device

### Prerequisites
1. Enable Developer Mode: Settings > About Phone > Build Number (tap 7 times)
2. Enable USB Debugging: Settings > Developer Options > USB Debugging
3. Connect via USB and accept trust prompt

### Deploy & Test
```bash
# List connected devices
adb devices

# Install APK
adb install -r app-debug.apk

# View logs
adb logcat | grep -E "crypto|scheduler|task"

# Clear app data
adb shell pm clear com.crypto.scanner

# Uninstall
adb uninstall com.crypto.scanner
```

### Emulator Alternative
```bash
# Create emulator image
sdkmanager "system-images;android-34;google_apis;x86_64"
avdmanager create avd -n TestDevice -k "system-images;android-34;google_apis;x86_64"

# Launch emulator
emulator -avd TestDevice

# Deploy
adb install app-debug.apk
```

---

## Common Build Issues & Solutions

### Issue: "SCHEDULE_EXACT_ALARM not declared"
**Cause**: Missing permission in AndroidManifest.xml
**Fix**: Add `<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />`

### Issue: "App crashes on Android 12+"
**Cause**: Missing POST_NOTIFICATIONS permission
**Fix**: Add `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />`

### Issue: "WakeLock does not prevent sleep"
**Cause**: Device in deep Doze mode
**Fix**: Request battery optimization exemption

### Issue: "Capacitor plugin not found"
**Cause**: Missing `npx cap sync`
**Fix**: Run `npx cap sync && npx cap open android`

### Issue: "Large APK size"
**Cause**: Debug build includes symbols
**Fix**: Use `assembleRelease` and enable ProGuard

---

## Performance Checklist

- [ ] All required permissions in AndroidManifest.xml
- [ ] Boot receiver configured for task persistence
- [ ] Capacitor plugins installed and synced
- [ ] Network security config for API access
- [ ] ProGuard enabled for release builds
- [ ] Gradle optimization settings configured
- [ ] Tested on Android 7.0+ devices
- [ ] Tested background execution
- [ ] Tested device restart scenario
- [ ] Verified no excessive battery drain
- [ ] Release APK signed and aligned

