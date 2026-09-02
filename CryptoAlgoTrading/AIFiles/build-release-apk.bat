@echo off
REM ============================================================================
REM BUILD RELEASE APK FOR GOOGLE PLAY STORE
REM ============================================================================
REM Builds a signed release APK for app store submission
REM
REM Prerequisites:
REM   1. Java, Node.js, Android SDK installed
REM   2. Created keystore file (run: create-keystore.bat first)
REM ============================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================================================
echo   RELEASE APK BUILD
echo ============================================================================
echo.

REM Check keystore
if not exist "release.keystore" (
    echo [ERROR] Keystore file not found: release.keystore
    echo.
    echo You need to create a keystore file first:
    echo   1. Run: create-keystore.bat
    echo   2. Then run this script again
    echo.
    exit /b 1
)
echo [✓] Keystore file found

REM Quick prerequisite check
echo.
echo [1] Checking prerequisites...
java -version >nul 2>&1 || (echo ERROR: Java not found! && exit /b 1)
node --version >nul 2>&1 || (echo ERROR: Node.js not found! && exit /b 1)
npm --version >nul 2>&1 || (echo ERROR: npm not found! && exit /b 1)
echo [✓] Prerequisites OK

REM Step 1: Build Angular
echo.
echo [2] Building Angular...
call npm install
if errorlevel 1 (echo [ERROR] npm install failed! && exit /b 1)
call npm run build:prod
if errorlevel 1 (echo [ERROR] Angular build failed! && exit /b 1)
if not exist "dist\CryptoCurrencyScanner\browser\index.html" (echo [ERROR] Build output not found! && exit /b 1)
echo [✓] Angular build complete

REM Step 2: Sync to Capacitor
echo.
echo [3] Syncing to Android...
call npx cap sync android
if errorlevel 1 (echo [ERROR] Capacitor sync failed! && exit /b 1)
if not exist "android\app\src\main\assets\public\index.html" (echo [ERROR] Sync verification failed! && exit /b 1)
echo [✓] Capacitor sync complete

REM Step 3: Build Release APK
echo.
echo [4] Building Release APK...
cd android

echo [4a] Running Gradle clean...
call gradlew.bat clean
if errorlevel 1 (echo [ERROR] Gradle clean failed! && cd .. && exit /b 1)

echo [4b] Building release APK with signature...
call gradlew.bat assembleRelease -Pandroid.injected.signing.store.file=..\release.keystore -Pandroid.injected.signing.store.password=android -Pandroid.injected.signing.key.alias=release -Pandroid.injected.signing.key.password=android
if errorlevel 1 (
    echo [ERROR] Gradle release build failed!
    echo.
    echo Possible reasons:
    echo   - Keystore password is wrong
    echo   - Keystore is corrupt
    echo.
    echo Try again:
    echo   1. Delete release.keystore
    echo   2. Run: create-keystore.bat
    echo   3. Run: build-release-apk.bat
    cd ..
    exit /b 1
)

cd ..
echo [✓] Release APK build complete

REM Verify APK
echo.
echo [5] Verifying Release APK...
if not exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo [ERROR] Release APK not found!
    exit /b 1
)

for %%A in ("android\app\build\outputs\apk\release\app-release.apk") do (
    set SIZE=%%~zA
    set/a SIZE_MB=SIZE / 1048576
    if SIZE_MB==0 set/a SIZE_MB=1
)

echo [✓] Release APK verified: !SIZE_MB! MB

REM Success
echo.
echo ============================================================================
echo RELEASE APK BUILD SUCCESSFUL!
echo ============================================================================
echo.
echo Release APK: android\app\build\outputs\apk\release\app-release.apk
echo Size: !SIZE_MB! MB
echo.
echo Next steps for Google Play Store:
echo.
echo 1. Increase version in capacitor.config.ts:
echo    "version": "1.0.1"  (was "1.0.0")
echo.
echo 2. Test the APK on a device:
echo    adb install -r "android\app\build\outputs\apk\release\app-release.apk"
echo.
echo 3. Go to Google Play Console:
echo    https://play.google.com/console
echo.
echo 4. Create new release
echo    - Upload app-release.apk
echo    - Fill in release notes
echo    - Submit for review
echo.
echo ============================================================================
echo.

pause
