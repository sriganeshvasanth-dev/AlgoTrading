@echo off
REM ============================================================================
REM INSTALL APK ON DEVICE OR EMULATOR
REM ============================================================================
REM Quickly installs the built APK to a connected Android device
REM ============================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================================================
echo   INSTALL APK ON DEVICE
echo ============================================================================
echo.

REM Check adb
echo [1] Checking Android SDK...
adb version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] adb not found!
    echo.
    echo Please add Android SDK to your PATH:
    echo   ANDROID_HOME\platform-tools
    echo.
    echo Or set environment variable ANDROID_HOME and try again.
    exit /b 1
)
echo [✓] Android SDK found

REM List devices
echo.
echo [2] Connected devices:
adb devices
echo.

echo [3] Checking for APK...
if not exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo [!] Debug APK not found!
    echo.
    echo Did you build it first? Run:
    echo   build-apk-simple.bat
    echo.
    exit /b 1
)
echo [✓] APK found: app-debug.apk

REM Install
echo.
echo [4] Installing APK...
echo    This may take a minute...
echo.
adb install -r "android\app\build\outputs\apk\debug\app-debug.apk"

if errorlevel 1 (
    echo.
    echo [ERROR] Installation failed!
    echo.
    echo Possible reasons:
    echo   - No device connected (run: adb devices)
    echo   - USB debugging not enabled on device
    echo   - App already running (uninstall first)
    echo.
    echo Try:
    echo   adb uninstall com.crypto.scanner
    echo   adb install -r "android\app\build\outputs\apk\debug\app-debug.apk"
    echo.
    exit /b 1
)

echo.
echo [✓] Installation successful!

REM Launch app
:ask_launch
echo.
set /p LAUNCH="Do you want to launch the app now? (y/n): "
if /i "!LAUNCH!"=="y" (
    echo.
    echo [5] Launching app...
    adb shell am start -n com.crypto.scanner/.MainActivity

    echo.
    echo [6] Showing live logs (Ctrl+C to stop):
    timeout /t 2 > nul
    adb logcat | findstr "com.crypto.scanner"
) else (
    echo.
    echo To launch manually, run:
    echo   adb shell am start -n com.crypto.scanner/.MainActivity
    echo.
    echo To view logs:
    echo   adb logcat | findstr "com.crypto.scanner"
    echo.
    echo To uninstall:
    echo   adb uninstall com.crypto.scanner
)

echo.
echo ============================================================================
echo INSTALL COMPLETE
echo ============================================================================
echo.

pause
