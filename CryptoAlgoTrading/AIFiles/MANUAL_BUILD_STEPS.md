# Step-by-Step Manual Build Instructions

If the automated `build-apk.ps1` script fails, follow these manual steps:

## Prerequisites Check

Run the diagnostic script first:
```powershell
.\diagnose.ps1
```

This will tell you what's missing or needs fixing.

---

## Step-by-Step Build Process

### Step 1: Verify Config File Exists
```powershell
# Check if source config exists
Test-Path src\assets\config.json

# Should return: True
```

If False, create the file:
```powershell
New-Item -ItemType Directory -Force -Path src\assets
@"
{
  "delta": {
    "apiKey": "YOUR_API_KEY",
    "apiSecret": "YOUR_API_SECRET",
    "baseUrl": "https://api.india.delta.exchange",
    "usdToInr": 85
  }
}
"@ | Out-File -FilePath src\assets\config.json -Encoding UTF8
```

---

### Step 2: Install Dependencies (If Needed)
```powershell
# Check if node_modules exists
if (-not (Test-Path node_modules)) {
    npm install
}
```

---

### Step 3: Build Angular Application
```powershell
# Clean previous build
if (Test-Path dist) {
    Remove-Item -Recurse -Force dist
}

# Build for production
npm run build --configuration=production

# Wait for build to complete...
# Check for SUCCESS message
```

**Expected Output**:
```
✔ Building...
✔ Browser application bundle generation complete.
Build at: ...
✔ Copying assets...
✔ Build complete.
```

---

### Step 4: Verify Assets Were Copied
```powershell
# Check if config.json is in dist
$distConfig = "dist\CryptoCurrencyScanner\browser\assets\config.json"
Test-Path $distConfig

# Should return: True
```

**If False** (config not copied), copy manually:
```powershell
# Create assets directory
New-Item -ItemType Directory -Force -Path "dist\CryptoCurrencyScanner\browser\assets"

# Copy config
Copy-Item "src\assets\config.json" -Destination "dist\CryptoCurrencyScanner\browser\assets\config.json" -Force

# Verify
Test-Path "dist\CryptoCurrencyScanner\browser\assets\config.json"
# Should now return: True
```

---

### Step 5: Sync Capacitor
```powershell
# This copies the Angular build to android/app/src/main/assets
npx cap sync android
```

**Expected Output**:
```
✔ Copying web assets from dist\CryptoCurrencyScanner\browser to android\app\src\main\assets\public
✔ Copying native bridge
✔ Updating Android plugins
✔ Syncing complete
```

**Verify sync worked**:
```powershell
# Check if web assets were copied
Test-Path "android\app\src\main\assets\public\assets\config.json"
# Should return: True
```

---

### Step 6: Build Android APK

#### Option A: Using Android Studio (Recommended for first build)
```powershell
# Open Android project in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to finish (bottom status bar)
2. Click: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for build to complete
4. Click "locate" link in notification
5. APK is in: `android\app\build\outputs\apk\debug\app-debug.apk`

#### Option B: Using Command Line
```powershell
# Navigate to android folder
cd android

# Clean previous build (optional)
.\gradlew clean

# Build debug APK
.\gradlew assembleDebug

# Return to project root
cd ..
```

**Expected Output**:
```
> Task :app:assembleDebug
BUILD SUCCESSFUL in 1m 23s
```

**APK Location**:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

---

### Step 7: Copy APK to Easy Location
```powershell
# Copy to project root
Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" -Destination "CryptoScanner.apk" -Force

# Get file info
Get-Item CryptoScanner.apk | Select-Object Name, Length, FullName
```

---

## Troubleshooting Each Step

### Build Step Fails

**Error**: `Cannot find module '@angular/core'`
```powershell
npm install
```

**Error**: `Building... Failed`
```powershell
# Check for TypeScript errors
npm run build 2>&1 | Select-String "error"

# Fix any TypeScript errors shown
# Then rebuild
npm run build --configuration=production
```

---

### Config Not in Dist

**Problem**: `dist\...\assets\config.json` doesn't exist after build

**Solution**:
```powershell
# Check angular.json has correct assets config
Get-Content angular.json | Select-String -Pattern "assets" -Context 5

# Should show:
# "assets": [
#   { "glob": "**/*", "input": "public" },
#   { "glob": "**/*", "input": "src/assets", "output": "/assets" }
# ]

# If missing, angular.json needs fixing
# Then rebuild
npm run build --configuration=production
```

---

### Capacitor Sync Fails

**Error**: `capacitor.config.ts not found`
```powershell
# Verify config exists
Test-Path capacitor.config.ts

# If missing, recreate
npx cap init "Crypto Scanner" "com.crypto.scanner" --web-dir="dist/CryptoCurrencyScanner/browser"
```

**Error**: `Unable to find target with hash string 'android-34'`
```powershell
# Install Android SDK 34
# Open Android Studio > SDK Manager > SDK Platforms
# Check "Android 14.0 (API 34)"
# Click OK to install
```

---

### Gradle Build Fails

**Error**: `ANDROID_HOME not set`
```powershell
# Set environment variable
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk', 'User')

# Restart PowerShell
# Try again
cd android
.\gradlew assembleDebug
```

**Error**: `Could not find or load main class org.gradle.wrapper.GradleWrapperMain`
```powershell
# Reinstall Android platform
npx cap add android
```

**Error**: Gradle daemon issues
```powershell
cd android
.\gradlew --stop
.\gradlew clean
.\gradlew assembleDebug
cd ..
```

---

## Quick Reference: All Commands

```powershell
# Full manual build (copy/paste all)
npm run build --configuration=production
npx cap sync android
cd android
.\gradlew assembleDebug
cd ..
Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" -Destination "CryptoScanner.apk" -Force
Write-Host "APK Location: $((Get-Item CryptoScanner.apk).FullName)"
```

---

## Verify Build Success

### Check APK was created
```powershell
$apk = Get-Item "android\app\build\outputs\apk\debug\app-debug.apk" -ErrorAction SilentlyContinue
if ($apk) {
    Write-Host "✓ APK created successfully!" -ForegroundColor Green
    Write-Host "Size: $([math]::Round($apk.Length / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "Location: $($apk.FullName)" -ForegroundColor White
} else {
    Write-Host "✗ APK not found!" -ForegroundColor Red
}
```

### Check config.json is in APK
```powershell
# Verify config was included in Android assets
Test-Path "android\app\src\main\assets\public\assets\config.json"
# Should return: True
```

---

## Install APK on Phone

### Method 1: Manual Transfer
1. Copy `CryptoScanner.apk` to your phone (USB, email, cloud, etc.)
2. Open the APK file on your phone
3. Allow "Install from unknown sources" if prompted
4. Click "Install"

### Method 2: ADB (USB Debug)
```powershell
# Enable USB Debugging on phone first
# Settings > Developer Options > USB Debugging

# Connect phone via USB
# Check device connected
adb devices

# Install APK
adb install -r CryptoScanner.apk

# -r flag allows reinstall/update
```

---

## Success Checklist

- [ ] `src\assets\config.json` exists
- [ ] `npm run build` completed successfully
- [ ] `dist\CryptoCurrencyScanner\browser\assets\config.json` exists
- [ ] `npx cap sync android` completed
- [ ] `android\app\src\main\assets\public\assets\config.json` exists
- [ ] `.\gradlew assembleDebug` completed (BUILD SUCCESSFUL)
- [ ] `android\app\build\outputs\apk\debug\app-debug.apk` created
- [ ] APK installs on phone
- [ ] App opens without crashing
- [ ] Positions page loads data

---

## If All Else Fails

1. Delete and recreate Android platform:
```powershell
Remove-Item -Recurse -Force android
npm run build --configuration=production
npx cap add android
npx cap sync android
npx cap open android
# Build in Android Studio
```

2. Check specific build errors:
```powershell
# Run with verbose logging
cd android
.\gradlew assembleDebug --info
cd ..
```

3. Get help:
```powershell
# Capacitor doctor
npx cap doctor

# Check Capacitor version
npx cap --version

# Check Android setup
cd android
.\gradlew tasks
cd ..
```

---

## Need More Help?

- **Config issues**: Check `CONFIGURATION_GUIDE.md`
- **Full APK guide**: Check `BUILD_APK_GUIDE.md`
- **Testing**: Check `TESTING_CHECKLIST.md`
- **Run diagnostics**: `.\diagnose.ps1`
