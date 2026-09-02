# Quick Reference - APK Commands

## 🚀 Installation (Choose One)

### Quick Install (Recommended)
```powershell
adb install CryptoScanner-Debug.apk
```

### Reinstall Over Existing
```powershell
adb install -r CryptoScanner-Debug.apk
```

### Uninstall First, Then Install
```powershell
adb uninstall com.ionicframework.cryptocurrencyscanner
adb install CryptoScanner-Debug.apk
```

---

## 📱 Launch & Control

### Launch App
```powershell
adb shell am start -n com.ionicframework.cryptocurrencyscanner/.MainActivity
```

### Force Stop App
```powershell
adb shell am force-stop com.ionicframework.cryptocurrencyscanner
```

### Clear App Data
```powershell
adb shell pm clear com.ionicframework.cryptocurrencyscanner
```

### Uninstall App
```powershell
adb uninstall com.ionicframework.cryptocurrencyscanner
```

---

## 🔍 Device & Debugging

### List Connected Devices
```powershell
adb devices
```

### Restart ADB Server
```powershell
adb kill-server
adb start-server
adb devices
```

### Show Device Info
```powershell
adb shell getprop ro.build.version.release
adb shell getprop ro.product.model
adb shell getprop ro.serialno
```

---

## 📊 Logs & Debugging

### View All Logs (Real-time)
```powershell
adb logcat
```

### Filter App Logs
```powershell
adb logcat | findstr "CryptoCurrency"
```

### View Errors Only
```powershell
adb logcat | findstr "ERROR"
```

### Show Logs with Timestamps
```powershell
adb logcat -v time | findstr "CryptoCurrency"
```

### Save Logs to File
```powershell
adb logcat > app_logs.txt
```

### Clear Logs
```powershell
adb logcat -c
```

### View System Logs (Android System Only)
```powershell
adb logcat *:S *:E  # Only errors
adb logcat AndroidRuntime:E  # Only runtime errors
```

---

## 📦 File Operations

### Push File to Device
```powershell
adb push C:\path\to\file.txt /sdcard/Download/
```

### Pull File from Device
```powershell
adb pull /sdcard/Download/file.txt C:\path\to\
```

### List Files on Device
```powershell
adb shell ls -l /sdcard/Download/
```

### Remove File from Device
```powershell
adb shell rm /sdcard/Download/file.txt
```

---

## 🔧 App Management

### List All Installed Packages
```powershell
adb shell pm list packages
```

### Check If App Installed
```powershell
adb shell pm list packages | findstr "cryptocurrencyscanner"
```

### Get App Info
```powershell
adb shell dumpsys package com.ionicframework.cryptocurrencyscanner
```

### Grant Permissions
```powershell
adb shell pm grant com.ionicframework.cryptocurrencyscanner android.permission.CAMERA
adb shell pm grant com.ionicframework.cryptocurrencyscanner android.permission.ACCESS_FINE_LOCATION
```

### Revoke Permissions
```powershell
adb shell pm revoke com.ionicframework.cryptocurrencyscanner android.permission.CAMERA
```

---

## 🔋 Battery & Performance

### Check Battery Status
```powershell
adb shell dumpsys batterystats
```

### Disable Battery Optimization for App
```powershell
adb shell cmd battery dexopt disable android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
```

### Check Running Processes
```powershell
adb shell ps | findstr "cryptocurrencyscanner"
```

### Monitor Real-time Memory Usage
```powershell
adb shell dumpsys meminfo com.ionicframework.cryptocurrencyscanner
```

---

## 🔌 Emulator Commands (For Testing)

### List Emulator Instances
```powershell
emulator -list-avds
```

### Start Emulator
```powershell
emulator -avd Pixel_API_30
```

### Install on Emulator
```powershell
adb install CryptoScanner-Debug.apk
```

---

## 🏗️ Rebuild APK

### From Project Root
```powershell
cd C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner
.\build-apk.ps1
```

### Manual Steps (If Script Fails)
```powershell
# Build Angular
npm run build

# Sync Capacitor
npx cap sync android

# Build APK
cd android
.\gradlew assembleDebug
cd ..
```

---

## 🐛 Troubleshooting Commands

### Verify ADB Connection
```powershell
adb devices
adb shell echo "Connection OK"
```

### Check USB Connection Mode
```powershell
adb shell getprop sys.usb.config
```

### Restart Device ADB Daemon
```powershell
adb kill-server
adb devices  # Restarts automatically
```

### Fix "Device Offline"
```powershell
adb usb           # Connect via USB
# or
adb tcpip 5555   # Connect via WiFi
adb connect <device-ip>:5555
```

### Clean Gradle Cache (If Build Fails)
```powershell
cd android
.\gradlew clean
cd ..
```

---

## ✅ Verification Commands

### Confirm APK Exists
```powershell
Test-Path "CryptoScanner-Debug.apk"
Get-Item "CryptoScanner-Debug.apk" | Select FullName, @{Name="Size";Expression={$_.Length/1MB}}
```

### Verify Installation
```powershell
adb shell pm list packages | findstr "cryptocurrencyscanner"
adb shell pm dump com.ionicframework.cryptocurrencyscanner | findstr "versionName"
```

### Check App Startup
```powershell
adb shell am start -n com.ionicframework.cryptocurrencyscanner/.MainActivity
adb logcat | findstr "START"
```

---

## 📝 Note

Replace `CryptoScanner-Debug.apk` with the actual file path if APK is in a different directory.

For more info: `adb help`

---

**Last Updated**: 2026-08-31  
**APK Size**: 4.12 MB  
**Build Type**: Debug
