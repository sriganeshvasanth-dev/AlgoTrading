# ⚙️ Android SDK Configuration Guide

## Current Status
✅ Node.js v24.16.0 - Ready
✅ npm 11.13.0 - Ready  
✅ Java - Ready
❌ ANDROID_HOME - **Needs Setup**

## Quick Fix: Set ANDROID_HOME Environment Variable

### Option 1: Android Studio (Easiest)

**Step 1: Install Android Studio**
1. Download from: https://developer.android.com/studio
2. Run the installer
3. Complete the setup wizard
4. Choose "Standard Installation"
5. Android SDK is installed automatically to:
   ```
   C:\Users\[YourUsername]\AppData\Local\Android\Sdk
   ```

**Step 2: Set Environment Variable**

Open PowerShell as Administrator and run:

```powershell
# Set the ANDROID_HOME variable
[Environment]::SetEnvironmentVariable(
  "ANDROID_HOME", 
  "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk", 
  "User"
)

# Verify it's set
echo $env:ANDROID_HOME

# If not showing, restart PowerShell and try again
```

### Option 2: Command Line Tools Only (Lightweight)

**Step 1: Download Command Line Tools**
1. Go to: https://developer.android.com/studio#command-tools
2. Download "Command line tools only"
3. Extract to: `C:\Android\cmdline-tools`

**Step 2: Download SDK Components**

```powershell
# Set paths
$env:ANDROID_SDK_ROOT = "C:\Android\Sdk"
$env:ANDROID_HOME = "C:\Android\Sdk"

# Add to PATH
$env:PATH += ";C:\Android\Sdk\platform-tools;C:\Android\Sdk\tools"

# Download required SDK components
C:\Android\cmdline-tools\bin\sdkmanager.bat "platforms;android-34"
C:\Android\cmdline-tools\bin\sdkmanager.bat "build-tools;34.0.0"
```

**Step 3: Set Environment Variable**

```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Android\Sdk", "User")
```

## Verify Installation

```powershell
# Test ANDROID_HOME is set
echo $env:ANDROID_HOME

# Test ADB tool
adb --version

# Test SDK Manager
sdkmanager --list
```

Expected output:
```
Android SDK Platform-Tools version 35.0.0
Platform Packages:
  platforms;android-34
  build-tools;34.0.0
```

## Add to PATH (If Needed)

If `adb` command is not recognized:

```powershell
# Permanently add to PATH
[Environment]::SetEnvironmentVariable(
  "PATH",
  "$env:PATH;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools",
  "User"
)

# Verify
adb --version
```

## Restart and Test

After setting environment variables:

1. **Close all PowerShell/Command Prompt windows**
2. **Open new PowerShell window**
3. **Run the build script again:**

```powershell
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading
.\build-apk.ps1
```

Or with batch script:

```cmd
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading
build-apk.bat
```

## Troubleshooting

### "adb: command not found"
```powershell
# Add Android platform tools to PATH
$env:PATH += ";$env:ANDROID_HOME\platform-tools"

# Test
adb --version
```

### "ANDROID_HOME still not set"
```powershell
# Verify it was set
Get-Item env:ANDROID_HOME

# If not showing, manually set
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk", "User")

# Restart PowerShell
```

### "SDK version mismatch"
```powershell
# List installed SDK versions
sdkmanager --list

# Install missing version (e.g., API 26)
sdkmanager "platforms;android-26"
sdkmanager "build-tools;26.0.3"
```

## What to Install (Minimum)

- **Platform**: Android 8.0+ (API 26+)
- **Build Tools**: Latest version
- **Platform Tools**: For `adb` command
- **Emulator** (optional): For testing without device

## Next Steps

Once ANDROID_HOME is set:

```powershell
# Build Debug APK
.\build-apk.ps1 -BuildType debug

# Or use batch script
build-apk.bat
```

## Android Studio Alternative Method

If you have Android Studio open:

1. **File** → **Settings** (on Windows)
2. **Appearance & Behavior** → **System Settings** → **Android SDK**
3. Note the SDK location (e.g., `C:\Users\YourUsername\AppData\Local\Android\Sdk`)
4. Set ANDROID_HOME to that location:

```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\YourUsername\AppData\Local\Android\Sdk", "User")
```

---

**Once ANDROID_HOME is set, run the build script:**

```powershell
cd D:\GitRepos\AlgoTrading\CryptoAlgoTrading
.\build-apk.ps1
```

The build will automatically:
1. ✅ Build production Angular bundle
2. ✅ Sync with Capacitor
3. ✅ Generate APK file
4. ✅ Verify the output APK

**Happy building! 🚀**
