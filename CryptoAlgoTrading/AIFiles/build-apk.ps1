# Crypto Scanner - Android APK Build Script
# Run this script from the project root directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Crypto Scanner - APK Build Script   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify source config.json exists
Write-Host "[1/6] Verifying source files..." -ForegroundColor Yellow
$sourceConfig = "src\assets\config.json"
if (-not (Test-Path $sourceConfig)) {
    Write-Host "      ERROR: Source config.json not found at: $sourceConfig" -ForegroundColor Red
    Write-Host "      Please ensure src\assets\config.json exists" -ForegroundColor Yellow
    exit 1
}
Write-Host "      [OK] Source config.json found" -ForegroundColor Green
Write-Host ""

# Step 2: Clean previous builds
Write-Host "[2/6] Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build" -ErrorAction SilentlyContinue
}
Write-Host "      [OK] Clean complete" -ForegroundColor Green
Write-Host ""

# Step 3: Build Angular application
Write-Host "[3/6] Building Angular application..." -ForegroundColor Yellow
npm run build --configuration=production
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ERROR: Angular build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "      [OK] Angular build complete" -ForegroundColor Green
Write-Host ""

# Step 4: Verify config.json was copied to dist
Write-Host "[4/6] Verifying assets in dist..." -ForegroundColor Yellow
$distConfig = "dist\CryptoCurrencyScanner\browser\assets\config.json"
if (Test-Path $distConfig) {
    Write-Host "      [OK] config.json copied to dist" -ForegroundColor Green
} else {
    Write-Host "      [WARN] config.json not in dist, copying manually..." -ForegroundColor Yellow
    $distAssetsDir = "dist\CryptoCurrencyScanner\browser\assets"
    if (-not (Test-Path $distAssetsDir)) {
        New-Item -ItemType Directory -Force -Path $distAssetsDir | Out-Null
    }
    Copy-Item $sourceConfig -Destination $distConfig -Force
    Write-Host "      [OK] config.json copied manually" -ForegroundColor Green
}
Write-Host ""

# Step 5: Sync Capacitor
Write-Host "[5/6] Syncing Capacitor with Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ERROR: Capacitor sync failed!" -ForegroundColor Red
    exit 1
}
Write-Host "      [OK] Capacitor sync complete" -ForegroundColor Green
Write-Host ""

# Step 6: Build Android APK
Write-Host "[6/6] Building Android APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleDebug
$buildResult = $LASTEXITCODE
Set-Location ..

if ($buildResult -ne 0) {
    Write-Host "      ERROR: APK build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  - Ensure Android Studio is installed" -ForegroundColor White
    Write-Host "  - Set ANDROID_HOME environment variable" -ForegroundColor White
    Write-Host "  - Run: cd android; .\gradlew clean" -ForegroundColor White
    exit 1
}

Write-Host "      [OK] APK build complete" -ForegroundColor Green
Write-Host ""

# Copy APK to easy location
$apkSource = "android\app\build\outputs\apk\debug\app-debug.apk"
$apkDest = "CryptoScanner-Debug.apk"

if (Test-Path $apkSource) {
    Copy-Item $apkSource -Destination $apkDest -Force
    $apkSize = (Get-Item $apkDest).Length / 1MB

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "         BUILD SUCCESSFUL!             " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "APK Location:" -ForegroundColor Yellow
    Write-Host "  $((Get-Item $apkDest).FullName)" -ForegroundColor White
    Write-Host ""
    Write-Host "APK Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Installation:" -ForegroundColor Yellow
    Write-Host "  Option 1: Copy APK to phone and install manually" -ForegroundColor White
    Write-Host "  Option 2: Use ADB:" -ForegroundColor White
    Write-Host "           adb install $apkDest" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "ERROR: APK file not found!" -ForegroundColor Red
    Write-Host "Expected: $apkSource" -ForegroundColor White
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
