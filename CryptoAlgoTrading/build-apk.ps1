#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Algo Trading - Android APK Build Script (PowerShell)

.DESCRIPTION
    This script automates the complete build process for creating an Android APK
    from the Algo Trading Angular application using Capacitor.

.PARAMETER BuildType
    Either 'debug' or 'release'. Defaults to 'debug'.

.PARAMETER SkipBuild
    Skip the Angular build step if already built.

.PARAMETER SkipSync
    Skip the Capacitor sync step.

.PARAMETER Install
    Automatically install the APK on a connected device after building.

.EXAMPLE
    .\build-apk.ps1 -BuildType debug
    .\build-apk.ps1 -BuildType release -Install $false

.NOTES
    Requires:
    - Node.js 18+
    - npm 11+
    - Java JDK 11+
    - Android SDK (ANDROID_HOME environment variable set)
#>

param(
    [ValidateSet('debug', 'release')]
    [string]$BuildType = 'debug',

    [switch]$SkipBuild,

    [switch]$SkipSync,

    [switch]$Install
)

# Set strict error handling
$ErrorActionPreference = 'Stop'
$WarningPreference = 'Continue'

# Colors for console output
$Colors = @{
    Success = 'Green'
    Error   = 'Red'
    Warning = 'Yellow'
    Info    = 'Cyan'
    Detail  = 'Blue'
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor $Colors.Detail
    Write-Host $Message -ForegroundColor $Colors.Detail
    Write-Host ("=" * 80) -ForegroundColor $Colors.Detail
    Write-Host ""
}

function Write-Step {
    param(
        [int]$StepNumber,
        [int]$TotalSteps,
        [string]$Message
    )
    Write-Host "[$StepNumber/$TotalSteps] $Message" -ForegroundColor $Colors.Warning
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $Colors.Success
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $Colors.Error
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor $Colors.Detail
}

# ============================================================================
# Step 1: Verify Prerequisites
# ============================================================================
Write-Header "Algo Trading - Android APK Build"

Write-Step 1 5 "Verifying Prerequisites..."

# Check Node.js
try {
    $nodeVersion = & node --version 2>$null
    Write-Success "Node.js $nodeVersion found"
} catch {
    Write-Error-Custom "Node.js not found. Please install Node.js 18+ and ensure it's in PATH."
    exit 1
}

# Check npm
try {
    $npmVersion = & npm --version 2>$null
    Write-Success "npm $npmVersion found"
} catch {
    Write-Error-Custom "npm not found. Please install npm and ensure it's in PATH."
    exit 1
}

# Check Java
try {
    $javaVersion = & java -version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Success "Java found: $javaVersion"
} catch {
    Write-Error-Custom "Java not found. Please install JDK 11+ and ensure JAVA_HOME is set."
    exit 1
}

# Check Android SDK
if ([string]::IsNullOrEmpty($env:ANDROID_HOME)) {
    Write-Error-Custom "ANDROID_HOME not set. Please set the ANDROID_HOME environment variable."
    exit 1
}
Write-Success "Android SDK found: $env:ANDROID_HOME"

# ============================================================================
# Step 2: Build Production Bundle
# ============================================================================
if (-not $SkipBuild) {
    Write-Step 2 5 "Building Production Angular Bundle..."

    try {
        & npm run build:prod
        Write-Success "Production bundle built successfully"
    } catch {
        Write-Error-Custom "Angular build failed!"
        exit 1
    }
} else {
    Write-Info "Skipping Angular build (--SkipBuild specified)"
}

# ============================================================================
# Step 3: Sync with Capacitor
# ============================================================================
if (-not $SkipSync) {
    Write-Step 3 5 "Syncing with Capacitor..."

    try {
        & npx cap sync android
        Write-Success "Capacitor sync completed"
    } catch {
        Write-Error-Custom "Capacitor sync failed!"
        exit 1
    }
} else {
    Write-Info "Skipping Capacitor sync (--SkipSync specified)"
}

# ============================================================================
# Step 4: Build APK
# ============================================================================
Write-Step 4 5 "Building Android APK ($BuildType)..."

$projectRoot = Get-Location
$androidDir = Join-Path $projectRoot "android"
$apkOutputDir = Join-Path $androidDir "app\build\outputs\apk"

if (-not (Test-Path $androidDir)) {
    Write-Error-Custom "Android directory not found at: $androidDir"
    exit 1
}

Push-Location $androidDir

try {
    if ($BuildType -eq 'debug') {
        Write-Info "Building DEBUG APK..."
        & .\gradlew.bat assembleDebug
        $apkPath = Join-Path $apkOutputDir "debug\app-debug.apk"
    } else {
        Write-Info "Building RELEASE APK..."
        & .\gradlew.bat assembleRelease
        $apkPath = Join-Path $apkOutputDir "release\app-release.apk"
    }
} catch {
    Write-Error-Custom "APK build failed!"
    Write-Host ""
    Write-Host "Troubleshooting tips:" -ForegroundColor $Colors.Warning
    Write-Host "  - Ensure JAVA_HOME is set correctly"
    Write-Host "  - Ensure ANDROID_HOME is set correctly"
    Write-Host "  - Check that Android SDK Build Tools are installed"
    Write-Host "  - Try: gradlew.bat clean assemble$($BuildType.Substring(0,1).ToUpper())$($BuildType.Substring(1))"
    Pop-Location
    exit 1
}

Pop-Location

# ============================================================================
# Step 5: Verify APK
# ============================================================================
Write-Step 5 5 "Verifying APK..."

if (Test-Path $apkPath) {
    Write-Success "APK generated successfully!"
    Write-Host ""
    Write-Host "APK Location:" -ForegroundColor $Colors.Detail
    Write-Host "  $apkPath"

    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "APK Size:" -ForegroundColor $Colors.Detail
    Write-Host "  $($apkSize.ToString('F2')) MB"
    Write-Host ""
} else {
    Write-Error-Custom "APK file not found at expected location!"
    Write-Host "Expected: $apkPath"
    exit 1
}

# ============================================================================
# Step 6: Optional - Install on Device
# ============================================================================
if ($Install) {
    Write-Step "Installing APK on connected device..."

    try {
        & adb install $apkPath
        Write-Success "APK installed successfully"
        Write-Info "Launching app..."
        & adb shell am start -n com.crypto.scanner/.MainActivity
        Write-Success "App launched"
    } catch {
        Write-Error-Custom "Failed to install or launch app on device"
        Write-Host "Make sure a device is connected and USB debugging is enabled"
    }
}

# ============================================================================
# Summary
# ============================================================================
Write-Header "Build Process Completed Successfully!"

Write-Host "Next Steps:" -ForegroundColor $Colors.Warning
Write-Host ""
Write-Host "For Testing:" -ForegroundColor $Colors.Detail
Write-Host "  adb install ""$apkPath"""
Write-Host "  adb shell am start -n com.crypto.scanner/.MainActivity"
Write-Host ""
Write-Host "For Deployment to Google Play:" -ForegroundColor $Colors.Detail
Write-Host "  1. Sign the APK with your keystore"
Write-Host "  2. Upload to Google Play Console"
Write-Host "  3. Complete store listing and submit for review"
Write-Host ""
Write-Host "For more information, see: APK_BUILD_GUIDE.md" -ForegroundColor $Colors.Info
Write-Host ""

Set-Location $projectRoot
