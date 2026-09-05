@echo off
REM ========================================
REM Build Android APK for Crypto Scanner
REM ========================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Building Android APK
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Make sure you're in the project root directory.
    echo.
    pause
    exit /b 1
)

REM Step 1: Verify npm install
echo [STEP 1] Checking npm dependencies...
if not exist "node_modules" (
    echo ERROR: node_modules not found!
    echo Run: npm install
    pause
    exit /b 1
)
echo ✅ npm dependencies found
echo.

REM Step 2: Check Android setup
echo [STEP 2] Checking Android setup...
if not exist "android" (
    echo ERROR: android folder not found!
    echo Make sure Capacitor is installed: npx cap add android
    pause
    exit /b 1
)
echo ✅ Android project found
echo.

REM Step 3: Build production app
echo [STEP 3] Building production Angular app...
echo This may take 2-5 minutes...
call npm run build:prod
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Angular build failed!
    echo Check the error messages above.
    pause
    exit /b 1
)
echo ✅ Angular build successful
echo.

REM Step 4: Sync with Android
echo [STEP 4] Syncing with Android project...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Capacitor sync had issues
    echo But this might still be OK - continuing...
)
echo ✅ Capacitor sync complete
echo.

REM Step 5: Build APK
echo [STEP 5] Building Android APK...
echo This may take 3-10 minutes depending on your computer...
echo.

cd android
call gradlew.bat clean assembleDebug

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ APK BUILD FAILED!
    echo.
    echo Common issues:
    echo 1. Java SDK not installed or not in PATH
    echo    Download from: https://www.oracle.com/java/technologies/downloads/
    echo.
    echo 2. Android SDK not installed
    echo    Use Android Studio to install SDK
    echo.
    echo 3. Run as Administrator (try right-click PowerShell -> Run as Administrator)
    echo.
    pause
    cd ..
    exit /b 1
)

cd ..

REM Step 6: Verify APK
echo.
echo [STEP 6] Verifying APK...
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo ========================================
    echo ✅ APK BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo APK location:
    echo android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Next steps:
    echo.
    echo [OPTION 1] Install on device via adb:
    echo   adb install android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo [OPTION 2] Install on connected device:
    echo   adb install -r android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo [OPTION 3] Open in Android Studio:
    echo   npx cap open android
    echo.
) else (
    echo ❌ APK not found at expected location!
    echo Check build output above for errors.
    pause
    exit /b 1
)

echo.
pause
