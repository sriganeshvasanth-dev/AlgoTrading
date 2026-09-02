#!/usr/bin/env powershell
# CryptoCurrencyScanner - APK Generation Setup Script
# This script automates the Capacitor setup for mobile APK generation

# Colors for output
$colors = @{
    Success = 'Green'
    Warning = 'Yellow'
    Error = 'Red'
    Info = 'Cyan'
}

function Write-Status {
    param([string]$Message, [string]$Type = 'Info')
    Write-Host $Message -ForegroundColor $colors[$Type]
}

Write-Status "╔════════════════════════════════════════════════════════╗" Info
Write-Status "║  CryptoCurrencyScanner - APK Generation Setup          ║" Info
Write-Status "╚════════════════════════════════════════════════════════╝" Info

# Check prerequisites
Write-Status "`n[Step 1/5] Checking Prerequisites..." Info

$checks = @{
    'Node.js' = { node --version }
    'npm' = { npm --version }
    'Git' = { git --version }
}

foreach ($check in $checks.GetEnumerator()) {
    try {
        & $check.Value | Out-Null
        Write-Status "✓ $($check.Name) is installed" Success
    } catch {
        Write-Status "✗ $($check.Name) is NOT installed" Error
    }
}

# Verify project structure
Write-Status "`n[Step 2/5] Verifying Project Structure..." Info

$projectPath = 'C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner\'
$requiredFiles = @('package.json', 'angular.json', 'src/main.ts')

foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $projectPath $file
    if (Test-Path $fullPath) {
        Write-Status "✓ Found: $file" Success
    } else {
        Write-Status "✗ Missing: $file" Error
    }
}

# Install Capacitor
Write-Status "`n[Step 3/5] Installing Capacitor..." Info

try {
    Push-Location $projectPath

    Write-Status "Installing @capacitor/core..." Info
    npm install @capacitor/core --no-save

    Write-Status "Installing @capacitor/cli..." Info
    npm install --save-dev @capacitor/cli

    Pop-Location
    Write-Status "✓ Capacitor installed successfully" Success
} catch {
    Write-Status "✗ Failed to install Capacitor: $_" Error
    exit 1
}

# Initialize Capacitor
Write-Status "`n[Step 4/5] Initializing Capacitor Project..." Info

try {
    Push-Location $projectPath

    # Create capacitor.config.ts
    $capacitorConfig = @'
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cryptoscanner.app',
  appName: 'CryptoCurrencyScanner',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999'
    }
  }
};

export default config;
'@

    $capacitorConfig | Out-File -FilePath 'capacitor.config.ts' -Encoding UTF8
    Write-Status "✓ Created capacitor.config.ts" Success

    Pop-Location
} catch {
    Write-Status "✗ Failed to initialize Capacitor: $_" Error
    exit 1
}

# Build Angular app
Write-Status "`n[Step 5/5] Building Angular Application..." Info

try {
    Push-Location $projectPath

    Write-Status "Running: npm run build..." Info
    npm run build

    Pop-Location
    Write-Status "✓ Angular build completed" Success
} catch {
    Write-Status "✗ Build failed: $_" Warning
    Write-Status "You can manually run: npm run build" Info
}

# Summary
Write-Status "`n╔════════════════════════════════════════════════════════╗" Success
Write-Status "║  Setup Complete! Next Steps:                           ║" Success
Write-Status "╚════════════════════════════════════════════════════════╝" Success

Write-Status @"
1. Install Android Studio & Android SDK:
   → https://developer.android.com/studio

2. Install Java JDK 11+:
   → https://www.oracle.com/java/technologies/downloads/

3. Add Android platform to your project:
   npx cap add android

4. Sync web files:
   npx cap sync android

5. Build APK:
   npx cap run android

6. Or open in Android Studio:
   npx cap open android

For detailed help, see: APK_GENERATION_GUIDE.md
"@ Info

Write-Status "`nSetup script finished!" Success
