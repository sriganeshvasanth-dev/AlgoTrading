# Simple Build Script - No fancy formatting
# Just the essential commands

Write-Host "Step 1: Check source files"
if (-not (Test-Path "src\assets\config.json")) {
    Write-Host "ERROR: src\assets\config.json not found"
    exit 1
}
Write-Host "OK - Source files found"

Write-Host ""
Write-Host "Step 2: Clean old builds"
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "android\app\build") { Remove-Item -Recurse -Force "android\app\build" }
Write-Host "OK - Cleaned"

Write-Host ""
Write-Host "Step 3: Build Angular"
npm run build --configuration=production
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed"
    exit 1
}
Write-Host "OK - Angular built"

Write-Host ""
Write-Host "Step 4: Check dist output"
if (-not (Test-Path "dist\CryptoCurrencyScanner\browser\assets\config.json")) {
    Write-Host "WARNING: Copying config manually"
    New-Item -ItemType Directory -Force -Path "dist\CryptoCurrencyScanner\browser\assets" | Out-Null
    Copy-Item "src\assets\config.json" -Destination "dist\CryptoCurrencyScanner\browser\assets\config.json"
}
Write-Host "OK - Config in dist"

Write-Host ""
Write-Host "Step 5: Sync Capacitor"
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Capacitor sync failed"
    exit 1
}
Write-Host "OK - Synced"

Write-Host ""
Write-Host "Step 6: Build APK"
Set-Location android
.\gradlew assembleDebug
$result = $LASTEXITCODE
Set-Location ..

if ($result -ne 0) {
    Write-Host "ERROR: APK build failed"
    exit 1
}
Write-Host "OK - APK built"

Write-Host ""
Write-Host "Step 7: Copy APK"
if (Test-Path "android\app\build\outputs\apk\debug\app-debug.apk") {
    Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" -Destination "CryptoScanner.apk"
    Write-Host "SUCCESS! APK: CryptoScanner.apk"
} else {
    Write-Host "ERROR: APK not found"
}
