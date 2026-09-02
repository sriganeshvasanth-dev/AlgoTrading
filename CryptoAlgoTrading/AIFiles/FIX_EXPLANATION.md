# PowerShell Script Fix - Explained

## What Was Wrong

The original `build-apk.ps1` script was checking for `config.json` in the WRONG place at the WRONG time:

### Original Logic (BROKEN):
```powershell
# Step 1: Clean builds
# Step 2: Build Angular → creates dist/...
# Step 3: Check if dist/CryptoCurrencyScanner/browser/assets/config.json exists
```

### Problem:
The script was checking the **DIST** folder for `config.json`, but was looking **AFTER** the build. If the build didn't copy the file correctly, it would try to copy from `src/assets` - but it was too late to verify the SOURCE file existed in the first place!

---

## What Was Fixed

### New Logic (FIXED):
```powershell
# Step 1: Check if src/assets/config.json exists (SOURCE) ← NEW!
# Step 2: Clean builds
# Step 3: Build Angular
# Step 4: Verify dist/.../config.json exists (OUTPUT) ← MOVED!
# Step 5: Sync Capacitor
# Step 6: Build APK
```

### Key Changes:

1. **Added Step 1** - Verify source file exists BEFORE doing anything:
   ```powershell
   $sourceConfig = "src\assets\config.json"
   if (-not (Test-Path $sourceConfig)) {
       Write-Host "ERROR: Source config.json not found"
       exit 1
   }
   ```

2. **Better error messaging**:
   ```powershell
   Write-Host "ERROR: Source config.json not found at: $sourceConfig"
   Write-Host "Please ensure src\assets\config.json exists"
   ```

3. **Changed step numbering**: From 5 steps to 6 steps (added source verification)

---

## Why This Matters

Your error showed the script was checking:
```
$configPath = "dist\CryptoCurrencyScanner\browser\assets\config.json"
```

But your file was at:
```
C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner\src\assets\config.json
```

The script should:
1. ✅ Check **source** exists first (`src\assets\config.json`)
2. ✅ Build Angular (which copies source → dist)
3. ✅ Check **dist** has the file (`dist/.../assets/config.json`)
4. ✅ Continue with APK build

---

## How to Use Now

### Option 1: Use Fixed Script
```powershell
.\build-apk.ps1
```

Now it will:
- ✅ Check source file exists first
- ✅ Show clear error if missing
- ✅ Verify output after build
- ✅ Copy manually if needed

---

### Option 2: Diagnose First
```powershell
.\diagnose.ps1
```

This new script checks:
- ✅ All source files exist
- ✅ Dependencies installed
- ✅ Environment variables set
- ✅ Previous builds (if any)

Shows exactly what's wrong and how to fix it!

---

### Option 3: Manual Build
If scripts still have issues, follow step-by-step:

See: **[MANUAL_BUILD_STEPS.md](MANUAL_BUILD_STEPS.md)**

This guide walks through each command individually so you can see exactly where any problem occurs.

---

## Updated Build Process Flow

```
START
  ↓
[CHECK] src/assets/config.json exists? 
  ↓ NO → ERROR: Create the file first!
  ↓ YES
[CLEAN] Remove dist/ and android/app/build/
  ↓
[BUILD] npm run build --configuration=production
  ↓
[VERIFY] dist/.../assets/config.json exists?
  ↓ NO → Copy from src/assets
  ↓ YES
[SYNC] npx cap sync android
  ↓
[APK] gradlew assembleDebug
  ↓
[COPY] APK → CryptoScanner-Debug.apk
  ↓
SUCCESS ✓
```

---

## Expected Output Now

When you run `.\build-apk.ps1`, you should see:

```
========================================
  Crypto Scanner - APK Build Script
========================================

[1/6] Verifying source files...
      ✓ Source config.json found

[2/6] Cleaning previous builds...
      Clean complete!

[3/6] Building Angular application...
      Angular build complete!

[4/6] Verifying assets in dist...
      ✓ config.json copied to dist

[5/6] Syncing Capacitor with Android...
      Capacitor sync complete!

[6/6] Building Android APK...
      APK build complete!

========================================
         BUILD SUCCESSFUL! ✓
========================================

APK Location:
  C:\Users\...\CryptoScanner-Debug.apk

APK Size: 7.23 MB

Installation:
  Option 1: Copy APK to phone and install manually
  Option 2: Use ADB:
           adb install CryptoScanner-Debug.apk
```

---

## If You Still Get Errors

### Error at Step 1: "Source config.json not found"
**Fix**: The file is missing. Create it:

```powershell
# Create the file
@"
{
  "delta": {
    "apiKey": "YOUR_API_KEY_HERE",
    "apiSecret": "YOUR_API_SECRET_HERE",
    "baseUrl": "https://api.india.delta.exchange",
    "usdToInr": 85
  }
}
"@ | Out-File -FilePath src\assets\config.json -Encoding UTF8 -Force

# Verify
Test-Path src\assets\config.json
# Should return: True
```

---

### Error at Step 3: "Angular build failed"
**Fix**: Check dependencies or syntax errors

```powershell
# Install/update dependencies
npm install

# Check for TypeScript errors
npm run build

# Fix any errors shown, then retry
```

---

### Error at Step 6: "APK build failed" or "ANDROID_HOME not set"
**Fix**: Android Studio needs to be installed and environment set

```powershell
# Set ANDROID_HOME (replace USERNAME)
[System.Environment]::SetEnvironmentVariable(
    'ANDROID_HOME',
    'C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk',
    'User'
)

# Close and reopen PowerShell
# Try again
.\build-apk.ps1
```

---

## Quick Test: Is My Setup Ready?

Run this in PowerShell:

```powershell
# Test 1: Source file
Write-Host "Source config: $(Test-Path src\assets\config.json)"

# Test 2: Dependencies
Write-Host "Node modules: $(Test-Path node_modules)"

# Test 3: Capacitor
Write-Host "Capacitor: $(Test-Path capacitor.config.ts)"

# Test 4: Android
Write-Host "Android: $(Test-Path android)"

# Test 5: Environment
Write-Host "ANDROID_HOME: $($env:ANDROID_HOME)"
```

**Expected Output**:
```
Source config: True
Node modules: True
Capacitor: True
Android: True
ANDROID_HOME: C:\Users\...\Sdk
```

If any show `False` or empty, that's what needs fixing!

---

## Summary

✅ **What was fixed**: Script now checks source file first, not just output
✅ **What to do**: Run `.\build-apk.ps1` - should work now
✅ **If still fails**: Run `.\diagnose.ps1` to see exactly what's wrong
✅ **Manual option**: Use [MANUAL_BUILD_STEPS.md](MANUAL_BUILD_STEPS.md) for step-by-step

The fix ensures the script validates the SOURCE files exist before trying to build!
