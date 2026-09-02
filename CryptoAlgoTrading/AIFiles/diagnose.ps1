# Quick Diagnostic Script for Crypto Scanner Build
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Crypto Scanner - Build Diagnostics  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Source files
Write-Host "[CHECK 1] Source Files..." -ForegroundColor Yellow

$sourceFiles = @(
    "angular.json",
    "src\assets\config.json",
    "capacitor.config.ts",
    "android",
    "package.json"
)

foreach ($file in $sourceFiles) {
    if (Test-Path $file) {
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $file" -ForegroundColor Red
    }
}
Write-Host ""

# Check 2: Node modules
Write-Host "[CHECK 2] Dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  [OK] node_modules folder exists" -ForegroundColor Green

    $capacitorCore = Test-Path "node_modules\@capacitor\core"
    $capacitorAndroid = Test-Path "node_modules\@capacitor\android"
    $angular = Test-Path "node_modules\@angular\core"

    if ($capacitorCore) { 
        Write-Host "  [OK] @capacitor/core" -ForegroundColor Green 
    } else { 
        Write-Host "  [MISSING] @capacitor/core" -ForegroundColor Red 
    }

    if ($capacitorAndroid) { 
        Write-Host "  [OK] @capacitor/android" -ForegroundColor Green 
    } else { 
        Write-Host "  [MISSING] @capacitor/android" -ForegroundColor Red 
    }

    if ($angular) { 
        Write-Host "  [OK] @angular/core" -ForegroundColor Green 
    } else { 
        Write-Host "  [MISSING] @angular/core" -ForegroundColor Red 
    }
} else {
    Write-Host "  [MISSING] node_modules - Run: npm install" -ForegroundColor Red
}
Write-Host ""

# Check 3: Environment variables
Write-Host "[CHECK 3] Environment Variables..." -ForegroundColor Yellow
$androidHome = $env:ANDROID_HOME
$javaHome = $env:JAVA_HOME

if ($androidHome) {
    Write-Host "  [OK] ANDROID_HOME: $androidHome" -ForegroundColor Green
    if (Test-Path $androidHome) {
        Write-Host "       Path exists" -ForegroundColor Green
    } else {
        Write-Host "       Path does not exist!" -ForegroundColor Red
    }
} else {
    Write-Host "  [WARN] ANDROID_HOME not set" -ForegroundColor Yellow
}

if ($javaHome) {
    Write-Host "  [OK] JAVA_HOME: $javaHome" -ForegroundColor Green
} else {
    Write-Host "  [WARN] JAVA_HOME not set" -ForegroundColor Yellow
}
Write-Host ""

# Check 4: Build output structure
Write-Host "[CHECK 4] Previous Build Output..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Write-Host "  [OK] dist folder exists" -ForegroundColor Green

    $browserFolder = Test-Path "dist\CryptoCurrencyScanner\browser"
    $assetsFolder = Test-Path "dist\CryptoCurrencyScanner\browser\assets"
    $configFile = Test-Path "dist\CryptoCurrencyScanner\browser\assets\config.json"

    if ($browserFolder) { 
        Write-Host "       [OK] browser folder" -ForegroundColor Green 
    } else { 
        Write-Host "       [NOT FOUND] browser folder" -ForegroundColor Gray 
    }

    if ($assetsFolder) { 
        Write-Host "       [OK] assets folder" -ForegroundColor Green 
    } else { 
        Write-Host "       [NOT FOUND] assets folder" -ForegroundColor Gray 
    }

    if ($configFile) { 
        Write-Host "       [OK] config.json" -ForegroundColor Green 
    } else { 
        Write-Host "       [NOT FOUND] config.json" -ForegroundColor Gray 
    }
} else {
    Write-Host "  [INFO] No previous build found (run npm run build)" -ForegroundColor Gray
}
Write-Host ""

# Check 5: Gradle wrapper
Write-Host "[CHECK 5] Gradle..." -ForegroundColor Yellow
if (Test-Path "android\gradlew.bat") {
    Write-Host "  [OK] gradlew.bat exists" -ForegroundColor Green
} else {
    Write-Host "  [MISSING] gradlew.bat" -ForegroundColor Red
}

if (Test-Path "android\app\build.gradle") {
    Write-Host "  [OK] build.gradle exists" -ForegroundColor Green
} else {
    Write-Host "  [MISSING] build.gradle" -ForegroundColor Red
}
Write-Host ""

# Recommendations
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         RECOMMENDATIONS              " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$hasIssues = $false

if (-not (Test-Path "node_modules")) {
    Write-Host "1. Install dependencies:" -ForegroundColor Yellow
    Write-Host "   npm install" -ForegroundColor White
    $hasIssues = $true
}

if (-not $androidHome) {
    Write-Host "2. Set ANDROID_HOME (for APK build):" -ForegroundColor Yellow
    Write-Host "   Set as environment variable to your Android SDK location" -ForegroundColor White
    $hasIssues = $true
}

if (-not (Test-Path "dist\CryptoCurrencyScanner\browser\assets\config.json")) {
    Write-Host "3. Build Angular app first:" -ForegroundColor Yellow
    Write-Host "   npm run build --configuration=production" -ForegroundColor White
    $hasIssues = $true
}

if (-not $hasIssues) {
    Write-Host "[OK] Everything looks good! Ready to build." -ForegroundColor Green
    Write-Host ""
    Write-Host "Run APK build with:" -ForegroundColor Cyan
    Write-Host "  .\build-apk.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
