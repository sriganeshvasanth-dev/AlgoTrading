@echo off
ECHO.
ECHO ========================================
ECHO  CryptoCurrencyScanner APK Builder
ECHO ========================================
ECHO.
ECHO Prerequisites:
ECHO  - Android SDK installed
ECHO  - Java JDK 11+ installed
ECHO  - ANDROID_SDK_ROOT environment variable set
ECHO.
ECHO Steps:
ECHO 1. Install Capacitor packages
ECHO 2. Initialize Capacitor
ECHO 3. Add Android platform
ECHO 4. Build Production Angular app
ECHO 5. Sync to Android
ECHO 6. Open Android Studio
ECHO.

cd /d "%CD%"

REM Step 1
echo Step 1: Installing Capacitor packages...
call npm install @capacitor/core @capacitor/cli @capacitor/android --save
if %ERRORLEVEL% neq 0 (
    echo Error: npm install failed
    pause
    exit /b 1
)

REM Note: Capacitor should already be initialized from capacitor.config.ts

REM Step 2
echo.
echo Step 2: Adding Android platform (if not already added)...
call npx cap add android
REM Ignore errors if already exists

REM Step 3
echo.
echo Step 3: Building production Angular app...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Error: build failed
    pause
    exit /b 1
)

REM Step 4
echo.
echo Step 4: Syncing to Android...
call npx cap sync android
if %ERRORLEVEL% neq 0 (
    echo Error: cap sync failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Build Complete!
echo ========================================
echo.
echo APK Location:
echo   Debug: android\app\build\outputs\apk\debug\app-debug.apk
echo   Release: android\app\build\outputs\apk\release\app-release.apk
echo.
echo Next Steps:
echo 1. Open Android Studio
echo 2. Open: android\ folder
echo 3. Click Build menu
echo 4. Select "Build APK(s)"
echo 5. APK will be generated in the above locations
echo.
echo Or run from command line:
echo   cd android
echo   gradlew assembleDebug
echo.
pause
