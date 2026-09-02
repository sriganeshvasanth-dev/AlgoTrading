# CryptoCurrencyScanner - Quick Installation Guide

## 📱 Your Mobile APK is Ready!

**File**: `CryptoScanner-Debug.apk` (4.12 MB)  
**Location**: `C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner\`

---

## Method 1: Install via USB Cable (Recommended)

### Prerequisites
- Android device with USB debugging enabled
- Android SDK Platform Tools installed
- USB cable

### Steps

1. **Enable USB Debugging on Phone**
   - Go to Settings → Developer Options → USB Debugging
   - Tap "Allow" when prompted on phone

2. **Connect Phone via USB**
   - Plug phone into computer

3. **Install APK**
   ```powershell
   adb install CryptoScanner-Debug.apk
   ```

4. **Verify Installation**
   ```powershell
   adb shell pm list packages | grep cryptocurrencyscanner
   ```

5. **Launch App**
   ```powershell
   adb shell am start -n com.ionicframework.cryptocurrencyscanner/.MainActivity
   ```

---

## Method 2: Manual Installation

### Steps

1. **Copy APK to Phone**
   - Connect phone to computer via USB
   - Enable file transfer mode on phone
   - Drag `CryptoScanner-Debug.apk` to phone's Downloads folder

2. **Install from Phone**
   - Open file manager on phone
   - Navigate to Downloads
   - Tap `CryptoScanner-Debug.apk`
   - Tap "Install"
   - Tap "Open" when installation completes

3. **Grant Permissions**
   - App will request permissions
   - Tap "Allow" for notifications and other required permissions

---

## Method 3: Android Studio Installation

1. **Open Android Studio**
2. **Open Device Manager**
   - Tools → Device Manager
   - Select your device or start emulator
3. **Drag APK File**
   - Drag `CryptoScanner-Debug.apk` onto emulator window
   - APK will install automatically

---

## Troubleshooting

### APK Installation Failed

**Error: "App not installed"**
```powershell
# Uninstall existing version first
adb uninstall com.ionicframework.cryptocurrencyscanner

# Then reinstall
adb install CryptoScanner-Debug.apk
```

**Error: "Device offline"**
```powershell
# Restart ADB
adb kill-server
adb devices  # Will reconnect

# Then try install again
adb install CryptoScanner-Debug.apk
```

### USB Debugging Not Working

1. Check if USB mode is set to "File Transfer" (not Charge Only)
2. Install Android USB drivers for your device
3. Run: `adb kill-server` then `adb devices`

### App Crashes on Launch

Check logs:
```powershell
adb logcat | grep -i "error"
```

---

## Post-Installation Setup

1. **Enter API Credentials**
   - Open app
   - Go to Settings
   - Enter your Delta Exchange API credentials
   - Save configuration

2. **Configure Trading Rules**
   - Set position sizing
   - Set risk/reward ratio
   - Set candle lookback period
   - Configure scheduler timing

3. **Test Bracket Orders**
   - Go to Positions
   - Open existing position
   - Click "Place Target & Stop Loss"
   - Verify order placement works

4. **Enable Background Scheduler** (Optional)
   - Go to Settings → Scheduler
   - Enable automatic trading
   - Set schedule times
   - App will run trades even when locked/idle

---

## Important Notes

### Permissions Required
- **Notifications**: For background task alerts
- **Network**: For API communication
- **Storage**: For configuration backup

### API Configuration
The app reads config from local storage initially. Set your API keys in Settings to start trading.

### Battery Optimization
Android may kill background tasks. To prevent this:
1. Go to Settings → Battery → Battery Usage
2. Find "Crypto Scanner"
3. Select "Don't restrict" or "Unrestricted"

### First Run
- Allow all permission prompts
- Add api credentials in settings
- Verify connectivity to exchange

---

## Reinstalling over Existing Version

```powershell
adb install -r CryptoScanner-Debug.apk
```

The `-r` flag allows reinstalling without uninstalling first.

---

## Uninstalling

```powershell
adb uninstall com.ionicframework.cryptocurrencyscanner
```

Or simply long-press app icon on phone and select Uninstall.

---

## View App Logs

```powershell
# View all logs
adb logcat

# Filter for app logs only
adb logcat | findstr "CryptoCurrency"

# Save logs to file
adb logcat > logs.txt

# Real-time logs with timestamps
adb logcat -v time | findstr "CryptoCurrency"
```

---

## Build a New APK

When you make code changes and need to rebuild:

```powershell
cd C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner
.\build-apk.ps1
```

This will:
- Compile latest Angular code
- Sync with Capacitor
- Build new APK
- Copy to project root

---

## Support

If you encounter issues:

1. Check the APK_BUILD_SUMMARY.md for detailed build information
2. Run `adb logcat` to see detailed error messages
3. Verify Android SDK is properly installed
4. Ensure ANDROID_HOME environment variable is set

---

**Happy Trading! 🚀📈**
