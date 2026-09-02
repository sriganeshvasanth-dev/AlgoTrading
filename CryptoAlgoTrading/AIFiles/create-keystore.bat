@echo off
REM ============================================================================
REM CREATE KEYSTORE FOR RELEASE APK SIGNING
REM ============================================================================
REM Creates a keystore file needed for signing release APKs
REM This only needs to be done once!
REM ============================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================================================
echo   CREATE RELEASE KEYSTORE
echo ============================================================================
echo.

REM Check if keystore already exists
if exist "release.keystore" (
    echo [!] Keystore file already exists: release.keystore
    echo.
    set /p USE_EXISTING="Do you want to use the existing keystore? (y/n): "
    if /i "!USE_EXISTING!"=="y" (
        echo [✓] Using existing keystore
        goto :help
    ) else (
        echo.
        set /p BACKUP="Create a backup? (y/n): "
        if /i "!BACKUP!"=="y" (
            copy release.keystore release.keystore.backup
            echo [✓] Backup created: release.keystore.backup
        )
        del release.keystore
        echo [✓] Old keystore deleted
    )
)

REM Check Java
echo.
echo [1] Checking Java installation...
java -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java not found!
    echo.
    echo Please install Java 11 or later:
    echo   https://www.oracle.com/java/technologies/downloads/
    exit /b 1
)
echo [✓] Java found

REM Create keystore
echo.
echo [2] Creating keystore file...
echo.
echo This will generate a keystore file for signing your release APK.
echo.
echo You will be asked for:
echo   - Keystore password (remember this!)
echo   - Key password (same or different)
echo   - Your name, organization, etc.
echo.
echo Example values:
echo   First and last name: Your Name
echo   Organization unit: Development
echo   Organization: My Company
echo   City: San Francisco
echo   State: California
echo   Country: US
echo.

keytool -genkey -v -keystore release.keystore -keyalg RSA -keysize 2048 -validity 365 -alias release

if errorlevel 1 (
    echo [ERROR] Failed to create keystore!
    exit /b 1
)

echo.
echo [✓] Keystore created successfully!

REM Verify keystore
echo.
echo [3] Verifying keystore...
keytool -list -v -keystore release.keystore -alias release
if errorlevel 1 (
    echo [ERROR] Failed to verify keystore!
    exit /b 1
)

echo [✓] Keystore verified!

:help
echo.
echo ============================================================================
echo KEYSTORE CREATION COMPLETE
echo ============================================================================
echo.
echo Your keystore file is ready: release.keystore
echo.
echo IMPORTANT: PASSWORD REMINDER
echo.
echo During the keytool process, you entered:
echo   - Keystore password (master password for all keys)
echo   - Key password (password for the "release" key)
echo.
echo You will need these passwords when building the release APK.
echo The default values used in build-release-apk.bat are:
echo   - Keystore password: android
echo   - Key password: android
echo   - Key alias: release
echo.
echo If you used different values, edit: build-release-apk.bat
echo   Line: call gradlew.bat assembleRelease -Pandroid.injected.signing...
echo.
echo NEXT STEPS:
echo.
echo 1. Keep release.keystore safe!
echo    (this is your key to sign all future releases)
echo.
echo 2. Backup this file:
echo    copy release.keystore release.keystore.backup
echo    Store in a safe location!
echo.
echo 3. Build your release APK:
echo    build-release-apk.bat
echo.
echo 4. Test it on a device:
echo    adb install -r android\app\build\outputs\apk\release\app-release.apk
echo.
echo 5. Upload to Google Play Console:
echo    https://play.google.com/console
echo.
echo ============================================================================
echo.

pause
