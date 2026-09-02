# Simple test script
Write-Host "Testing PowerShell scripts..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if config exists
Write-Host "1. Source config.json exists: " -NoNewline
if (Test-Path "src\assets\config.json") {
    Write-Host "YES" -ForegroundColor Green
} else {
    Write-Host "NO" -ForegroundColor Red
}

# Test 2: Check if node_modules exists
Write-Host "2. Dependencies installed: " -NoNewline
if (Test-Path "node_modules") {
    Write-Host "YES" -ForegroundColor Green
} else {
    Write-Host "NO - Run: npm install" -ForegroundColor Red
}

# Test 3: Check if Android platform exists
Write-Host "3. Android platform ready: " -NoNewline
if (Test-Path "android\gradlew.bat") {
    Write-Host "YES" -ForegroundColor Green
} else {
    Write-Host "NO" -ForegroundColor Red
}

# Test 4: Check ANDROID_HOME
Write-Host "4. ANDROID_HOME set: " -NoNewline
if ($env:ANDROID_HOME) {
    Write-Host "YES ($env:ANDROID_HOME)" -ForegroundColor Green
} else {
    Write-Host "NO (Optional for browser, required for APK)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  Run: .\build-apk.ps1" -ForegroundColor White
Write-Host ""
