@echo off
REM ============================================================================
REM Algo Trading - Android APK Build Script
REM This script automates the complete build process for Android APK
REM ============================================================================

setlocal enabledelayedexpansion

REM Get script directory
cd /d "%~dp0"
set "PROJECT_ROOT=%cd%"

echo.
echo ============================================================================
echo       Algo Trading - Android APK Build Script
echo ============================================================================
echo.

REM ============================================================================
REM Step 1: Verify Prerequisites
REM ============================================================================
echo [1/5] Verifying Prerequisites...

REM Check Node.js
for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VERSION=%%i
if "%NODE_VERSION%"=="" (
    echo ERROR: Node.js not found. Please install Node.js 18+ and ensure it's in PATH.
    pause
    exit /b 1
)
echo [OK] Node.js %NODE_VERSION% found

REM Check npm
for /f "tokens=*" %%i in ('npm --version 2^>nul') do set NPM_VERSION=%%i
if "%NPM_VERSION%"=="" (
    echo ERROR: npm not found. Please install npm and ensure it's in PATH.
    pause
    exit /b 1
)
echo [OK] npm %NPM_VERSION% found

REM Check Java
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java not found. Please install JDK 11+ and ensure JAVA_HOME is set.
    pause
    exit /b 1
)
echo [OK] Java found

REM Check Android SDK
if "%ANDROID_HOME%"=="" (
    echo ERROR: ANDROID_HOME not set. Please set the ANDROID_HOME environment variable.
    pause
    exit /b 1
)
echo [OK] Android SDK found: %ANDROID_HOME%

echo.

REM ============================================================================
REM Step 2: Build Production Bundle
REM ============================================================================
echo [2/5] Building Production Angular Bundle...
call npm run build:prod
if errorlevel 1 (
    echo ERROR: Angular build failed!
    pause
    exit /b 1
)
echo [OK] Production bundle built successfully
echo.

REM ============================================================================
REM Step 3: Sync with Capacitor
REM ============================================================================
echo [3/5] Syncing with Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)
echo [OK] Capacitor sync completed
echo.

REM ============================================================================
REM Step 4: Build APK
REM ============================================================================
echo [4/5] Building Android APK...
cd /d "%PROJECT_ROOT%\android"

REM Ask user for build type
echo.
echo Choose build type:
echo [1] Debug APK (for testing)
echo [2] Release APK (for distribution)
echo.
set /p BUILD_TYPE="Enter choice (1 or 2): "

if "%BUILD_TYPE%"=="1" (
    echo Building DEBUG APK...
    call gradlew.bat assembleDebug
    set "APK_PATH=%PROJECT_ROOT%\android\app\build\outputs\apk\debug\app-debug.apk"
) else if "%BUILD_TYPE%"=="2" (
    echo Building RELEASE APK...
    call gradlew.bat assembleRelease
    set "APK_PATH=%PROJECT_ROOT%\android\app\build\outputs\apk\release\app-release.apk"
) else (
    echo Invalid choice. Building debug APK by default.
    call gradlew.bat assembleDebug
    set "APK_PATH=%PROJECT_ROOT%\android\app\build\outputs\apk\debug\app-debug.apk"
)

if errorlevel 1 (
    echo ERROR: APK build failed!
    echo.
    echo Troubleshooting tips:
    echo - Ensure JAVA_HOME is set correctly
    echo - Ensure ANDROID_HOME is set correctly
    echo - Check that Android SDK Build Tools are installed
    echo - Try: gradlew.bat clean assembleDebug
    pause
    exit /b 1
)

echo [OK] APK build completed
echo.

REM ============================================================================
REM Step 5: Verify APK
REM ============================================================================
echo [5/5] Verifying APK...

if exist "%APK_PATH%" (
    echo [OK] APK generated successfully!
    echo.
    echo APK Location:
    echo %APK_PATH%
    echo.
    for /f "tokens=*" %%A in ('powershell -Command "(Get-Item '%APK_PATH%').length / 1MB"') do set "APK_SIZE=%%A"
    echo APK Size: approximately !APK_SIZE! MB
    echo.
) else (
    echo ERROR: APK file not found at expected location!
    echo Expected: %APK_PATH%
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo Build Process Completed Successfully!
echo ============================================================================
echo.
echo Next Steps:
echo.
echo For Testing:
echo   adb install "%APK_PATH%"
echo   adb shell am start -n com.crypto.scanner/.MainActivity
echo.
echo For Deployment to Google Play:
echo   1. Sign the APK with your keystore
echo   2. Upload to Google Play Console
echo   3. Complete store listing and submit for review
echo.
echo For more information, see: MOBILE_BUILD_README.md
echo.

cd /d "%PROJECT_ROOT%"
pause
