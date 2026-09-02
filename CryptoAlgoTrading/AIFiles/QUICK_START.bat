@echo off
REM Quick Start: Mobile Background Scheduler Setup
REM This script installs all required dependencies and verifies setup

echo.
echo ========================================
echo Mobile Background Scheduler - Quick Setup
echo ========================================
echo.

REM Step 1: Install npm dependencies
echo [STEP 1] Installing npm dependencies...
echo This includes Capacitor plugins for mobile background scheduling
echo.

call npm install @capacitor/local-notifications @capacitor/app --save
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed
    echo.
    echo SOLUTIONS:
    echo 1. Make sure you have Node.js ^>= 18 installed (https://nodejs.org)
    echo 2. Delete node_modules folder and try again: rmdir node_modules /s /q
    echo 3. Clear npm cache: npm cache clean --force
    echo.
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

REM Step 2: Sync with Android project
echo [STEP 2] Syncing Capacitor files with Android project...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: cap sync failed
    echo This is OK if you haven't set up Android yet
    echo You can run this later: npx cap sync android
)

echo ✅ Capacitor sync complete
echo.

REM Step 3: Verify service file
echo [STEP 3] Verifying BackgroundSchedulerService...
if exist "src\app\core\services\background-scheduler.service.ts" (
    echo ✅ BackgroundSchedulerService found at:
    echo    src\app\core\services\background-scheduler.service.ts
) else (
    echo ❌ ERROR: BackgroundSchedulerService not found
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. For WEB BROWSER (no additional setup needed):
echo    npm start
echo.
echo 2. For MOBILE APK:
echo    - Update AndroidManifest.xml with permissions (see guide)
echo    - Run: npm run build:android
echo.
echo 3. To use the service in your components:
echo    See BACKGROUND_SCHEDULER_INTEGRATION_GUIDE.md
echo.
pause
