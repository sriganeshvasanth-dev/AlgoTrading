#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Quick APK Build Script for Crypto Currency Scanner
.DESCRIPTION
    Automates the complete process of building an APK from Angular source code
.EXAMPLE
    .\build-apk-quick.ps1
#>

param(
    [ValidateSet("debug", "release")]
    [string]$BuildType = "debug",

    [switch]$OpenAndroidStudio,
    [switch]$InstallOnDevice
)

$ErrorActionPreference = "Stop"
$InformationPreference = "Continue"

# Colors
$Green = @{ ForegroundColor = "Green" }
$Yellow = @{ ForegroundColor = "Yellow" }
$Cyan = @{ ForegroundColor = "Cyan" }
$Red = @{ ForegroundColor = "Red" }

Write-Host "`n" -NoNewline
Write-Host "╔════════════════════════════════════════════════════════╗" @Cyan
Write-Host "║  🚀 Crypto Currency Scanner - APK Build Script        ║" @Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" @Cyan
Write-Host ""

# Step 1: Check prerequisites
Write-Host "📋 Checking Prerequisites..." @Yellow

$Prerequisites = @(
    @{ Name = "Java"; Command = "java"; Version = "-version" },
    @{ Name = "Node.js"; Command = "node"; Version = "--version" },
    @{ Name = "npm"; Command = "npm"; Version = "--version" }
)

$AllAvailable = $true
foreach ($Prereq in $Prerequisites) {
    if (Get-Command $Prereq.Command -ErrorAction SilentlyContinue) {
        $Version = & $Prereq.Command $Prereq.Version 2>&1 | Select-Object -First 1
        Write-Host "   ✅ $($Prereq.Name): $Version" @Green
    } else {
        Write-Host "   ❌ $($Prereq.Name): NOT FOUND" @Red
        $AllAvailable = $false
    }
}

if (-not $AllAvailable) {
    Write-Host "`n⚠️  Please install missing prerequisites before continuing." @Red
    Write-Host "    See APK_BUILD_GUIDE.md for installation instructions." @Red
    exit 1
}

Write-Host ""

# Step 2: Confirm build action
Write-Host "⚙️  Build Configuration:" @Yellow
Write-Host "   Build Type: $BuildType" @Cyan
Write-Host "   Location: $PWD" @Cyan
Write-Host ""

$Confirm = Read-Host "Continue with build? (y/n)"
if ($Confirm -ne "y") {
    Write-Host "Build cancelled." @Yellow
    exit 0
}

# Step 3: Clean
Write-Host "`n🧹 Cleaning previous builds..." @Yellow
Write-Host "   Removing dist/" -NoNewline
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Write-Host " ✓" @Green

Write-Host "   Removing android/app/build/" -NoNewline
Remove-Item -Recurse -Force android/app/build -ErrorAction SilentlyContinue
Write-Host " ✓" @Green

Write-Host "   Removing node_modules/.cache/" -NoNewline
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
Write-Host " ✓" @Green

# Step 4: Build Angular
Write-Host -NoNewline "`n📦 Building Angular application..."
$StartTime = Get-Date
try {
    npm run build:prod 2>&1 | Out-Null
    $Duration = (Get-Date) - $StartTime
    Write-Host " ✓ ($($Duration.TotalSeconds)s)" @Green
} catch {
    Write-Host " ✗" @Red
    Write-Host "❌ Angular build failed!" @Red
    exit 1
}

# Step 5: Sync Capacitor
Write-Host -NoNewline "🔄 Syncing with Capacitor..."
$StartTime = Get-Date
try {
    npx cap sync android 2>&1 | Out-Null
    $Duration = (Get-Date) - $StartTime
    Write-Host " ✓ ($($Duration.TotalSeconds)s)" @Green
} catch {
    Write-Host " ✗" @Red
    Write-Host "❌ Capacitor sync failed!" @Red
    exit 1
}

# Step 6: Build APK via Gradle
Write-Host -NoNewline "`n🚀 Building APK with Gradle..."
$StartTime = Get-Date
try {
    Push-Location android

    if ($BuildType -eq "debug") {
        .\gradlew.bat assembleDebug 2>&1 | Out-Null
        $ApkType = "debug"
    } else {
        .\gradlew.bat assembleRelease 2>&1 | Out-Null
        $ApkType = "release"
    }

    Pop-Location
    $Duration = (Get-Date) - $StartTime
    Write-Host " ✓ ($($Duration.TotalSeconds)s)" @Green
} catch {
    Write-Host " ✗" @Red
    Write-Host "❌ Gradle build failed!" @Red
    Write-Host "   Try: cd android && .\gradlew.bat clean && popd" @Yellow
    exit 1
}

# Step 7: Verify APK
Write-Host -NoNewline "🎯 Locating APK file..."
$ApkPath = Get-ChildItem -Path "android/app/build/outputs/apk/$ApkType/" -Filter "*.apk" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

if ($ApkPath) {
    $SizeMb = [math]::Round($ApkPath.Length / 1MB, 2)
    Write-Host " ✓" @Green
    Write-Host ""
    Write-Host "✨ BUILD SUCCESSFUL!" @Green
    Write-Host ""
    Write-Host "📄 APK Details:" @Cyan
    Write-Host "   Path: $($ApkPath.FullName)" @White
    Write-Host "   Size: $SizeMb MB" @White
    Write-Host "   Type: $(if ($BuildType -eq 'debug') { 'Debug (for testing)' } else { 'Release (signed - for store)' })" @White
    Write-Host ""
    Write-Host "📱 Next Steps:" @Cyan

    if ($InstallOnDevice) {
        Write-Host "   Installing on device..." @Yellow
        adb install -r $ApkPath.FullName
        Write-Host "   ✅ Installation complete" @Green
    } else {
        Write-Host "   To install on device: adb install -r `"$($ApkPath.FullName)`"" @White
        Write-Host "   To install on emulator: adb install -r `"$($ApkPath.FullName)`"" @White
    }

    if ($OpenAndroidStudio) {
        Write-Host "   Opening Android Studio..." @Yellow
        npx cap open android
    } else {
        Write-Host "   To open in Android Studio: npx cap open android" @White
    }

} else {
    Write-Host " ✗" @Red
    Write-Host "❌ APK file not found after build!" @Red
    Write-Host "   Check: android/app/build/outputs/apk/$ApkType/" @Yellow
    exit 1
}

Write-Host "`n"
