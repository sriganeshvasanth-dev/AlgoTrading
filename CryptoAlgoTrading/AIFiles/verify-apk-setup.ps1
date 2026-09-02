#!/usr/bin/env pwsh
# APK Build Setup Verification Script
# Run this before building APK to check all prerequisites

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Crypto Currency Scanner - APK Build Environment Verification      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Function to check command availability
function Check-Command([string]$cmd, [string]$name) {
    try {
        $result = & $cmd --version 2>$null
        Write-Host "✅ $name installed" -ForegroundColor Green
        Write-Host "   $result" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "❌ $name NOT installed" -ForegroundColor Red
        return $false
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "CHECKING REQUIRED TOOLS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

$allGood = $true

# Check Node.js
$allGood = (Check-Command "node" "Node.js") -and $allGood

# Check npm
$allGood = (Check-Command "npm" "npm") -and $allGood

# Check Java
try {
    $java = & java -version 2>&1
    Write-Host "✅ Java installed" -ForegroundColor Green
    Write-Host "   $($java[0])" -ForegroundColor Gray
} catch {
    Write-Host "❌ Java NOT installed" -ForegroundColor Red
    $allGood = $false
}

# Check Android SDK
$androidSdkPath = "$env:USERPROFILE\AppData\Local\Android\Sdk"
if (Test-Path $androidSdkPath) {
    Write-Host "✅ Android SDK found" -ForegroundColor Green
    Write-Host "   $androidSdkPath" -ForegroundColor Gray
} else {
    Write-Host "❌ Android SDK NOT found" -ForegroundColor Red
    Write-Host "   Expected at: $androidSdkPath" -ForegroundColor Gray
    $allGood = $false
}

# Check Gradle
$gradleWrapperPath = ".\android\gradlew.bat"
if (Test-Path $gradleWrapperPath) {
    Write-Host "✅ Gradle wrapper found" -ForegroundColor Green
    Write-Host "   $gradleWrapperPath" -ForegroundColor Gray
} else {
    Write-Host "❌ Gradle wrapper NOT found" -ForegroundColor Red
    $allGood = $false
}

# Check ADB
try {
    $adb = & adb version 2>&1
    Write-Host "✅ ADB (Android Debug Bridge) installed" -ForegroundColor Green
    Write-Host "   $($adb[0])" -ForegroundColor Gray

    # List connected devices
    Write-Host ""
    Write-Host "Connected Android devices:" -ForegroundColor Cyan
    $devices = & adb devices
    foreach ($device in $devices) {
        if ($device -and $device -notlike "List*") {
            Write-Host "   $device" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ ADB NOT installed" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "CHECKING PROJECT FILES" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

# Check package.json
if (Test-Path "package.json") {
    Write-Host "✅ package.json found" -ForegroundColor Green
} else {
    Write-Host "❌ package.json NOT found" -ForegroundColor Red
    $allGood = $false
}

# Check capacitor.config.ts
if (Test-Path "capacitor.config.ts") {
    Write-Host "✅ capacitor.config.ts found" -ForegroundColor Green
} else {
    Write-Host "❌ capacitor.config.ts NOT found" -ForegroundColor Red
    $allGood = $false
}

# Check android folder
if (Test-Path "android") {
    Write-Host "✅ android/ folder found" -ForegroundColor Green

    if (Test-Path "android/app/build.gradle") {
        Write-Host "✅ android/app/build.gradle found" -ForegroundColor Green
    } else {
        Write-Host "❌ android/app/build.gradle NOT found" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "❌ android/ folder NOT found" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "RESULT" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

if ($allGood) {
    Write-Host "✅ ALL REQUIREMENTS MET - Ready to build APK!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. npm run build:prod" -ForegroundColor Gray
    Write-Host "2. npx cap sync android" -ForegroundColor Gray
    Write-Host "3. npm run open:android (or: cd android && gradlew.bat assembleDebug)" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ MISSING REQUIREMENTS - Cannot build APK yet" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install the missing components and try again." -ForegroundColor Yellow
}

Write-Host ""
