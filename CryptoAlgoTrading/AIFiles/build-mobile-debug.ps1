# Build APK with Mobile Debugging
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mobile APK Builder with Debug Mode" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check config
Write-Host "[1/7] Checking config files..." -ForegroundColor Yellow
if (-not (Test-Path "src\assets\config.json")) {
    Write-Host "ERROR: src\assets\config.json not found!" -ForegroundColor Red
    Write-Host "Please create the config file first." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Config file exists" -ForegroundColor Green

# Step 2: Clean builds
Write-Host ""
Write-Host "[2/7] Cleaning old builds..." -ForegroundColor Yellow
if (Test-Path "dist") { 
    Remove-Item -Recurse -Force "dist" 
    Write-Host "  [OK] Removed dist" -ForegroundColor Green
}
if (Test-Path "android\app\build") { 
    Remove-Item -Recurse -Force "android\app\build" 
    Write-Host "  [OK] Removed android build" -ForegroundColor Green
}

# Step 3: Build Angular
Write-Host ""
Write-Host "[3/7] Building Angular (production)..." -ForegroundColor Yellow
npm run build --configuration=production
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Angular build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Angular build successful" -ForegroundColor Green

# Step 4: Verify dist
Write-Host ""
Write-Host "[4/7] Verifying build output..." -ForegroundColor Yellow
if (-not (Test-Path "dist\CryptoCurrencyScanner\browser\index.html")) {
    Write-Host "ERROR: Build output missing!" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "dist\CryptoCurrencyScanner\browser\assets\config.json")) {
    Write-Host "WARNING: Config not in dist, copying manually..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path "dist\CryptoCurrencyScanner\browser\assets" | Out-Null
    Copy-Item "src\assets\config.json" -Destination "dist\CryptoCurrencyScanner\browser\assets\config.json"
}
Write-Host "  [OK] Build output verified" -ForegroundColor Green

# Step 5: Sync Capacitor
Write-Host ""
Write-Host "[5/7] Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Capacitor sync failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Capacitor synced" -ForegroundColor Green

# Step 6: Build APK
Write-Host ""
Write-Host "[6/7] Building Android APK..." -ForegroundColor Yellow
Write-Host "  (This may take a few minutes...)" -ForegroundColor Gray
Set-Location android
.\gradlew assembleDebug
$buildResult = $LASTEXITCODE
Set-Location ..

if ($buildResult -ne 0) {
    Write-Host "ERROR: APK build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] APK build successful" -ForegroundColor Green

# Step 7: Copy APK
Write-Host ""
Write-Host "[7/7] Copying APK..." -ForegroundColor Yellow
$apkSource = "android\app\build\outputs\apk\debug\app-debug.apk"
$apkDest = "CryptoScanner-Debug.apk"

if (Test-Path $apkSource) {
    Copy-Item $apkSource -Destination $apkDest -Force
    $apkSize = (Get-Item $apkDest).Length / 1MB

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  SUCCESS! APK Ready!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "APK Location: $apkDest" -ForegroundColor White
    Write-Host "APK Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Transfer APK to your mobile device" -ForegroundColor White
    Write-Host "  2. Install the APK" -ForegroundColor White
    Write-Host "  3. Open Debug menu to view logs" -ForegroundColor White
    Write-Host "  4. Navigate to Scanner -> Debug (🔧)" -ForegroundColor White
    Write-Host ""
    Write-Host "  Debug page provides:" -ForegroundColor Yellow
    Write-Host "    - Test Config button" -ForegroundColor White
    Write-Host "    - Test Products button" -ForegroundColor White
    Write-Host "    - Test Positions button" -ForegroundColor White
    Write-Host "    - Live log viewer" -ForegroundColor White
    Write-Host "    - Copy logs feature" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "ERROR: APK file not found at $apkSource" -ForegroundColor Red
    exit 1
}
