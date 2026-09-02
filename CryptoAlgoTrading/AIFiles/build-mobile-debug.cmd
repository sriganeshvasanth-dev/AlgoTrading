@echo off
echo ========================================
echo   Mobile APK Builder with Debug Mode
echo ========================================
echo.

echo [1/7] Checking config files...
if not exist "src\assets\config.json" (
    echo ERROR: src\assets\config.json not found!
    exit /b 1
)
echo   [OK] Config file exists

echo.
echo [2/7] Cleaning old builds...
if exist "dist" rmdir /s /q "dist"
if exist "android\app\build" rmdir /s /q "android\app\build"
echo   [OK] Cleaned

echo.
echo [3/7] Building Angular...
call npm run build --configuration=production
if errorlevel 1 (
    echo ERROR: Angular build failed!
    exit /b 1
)
echo   [OK] Angular built

echo.
echo [4/7] Verifying build...
if not exist "dist\CryptoCurrencyScanner\browser\index.html" (
    echo ERROR: Build output missing!
    exit /b 1
)
if not exist "dist\CryptoCurrencyScanner\browser\assets\config.json" (
    echo WARNING: Copying config manually...
    xcopy "src\assets\config.json" "dist\CryptoCurrencyScanner\browser\assets\" /Y
)
echo   [OK] Verified

echo.
echo [5/7] Syncing Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Capacitor sync failed!
    exit /b 1
)
echo   [OK] Synced

echo.
echo [6/7] Building APK...
cd android
call gradlew assembleDebug
if errorlevel 1 (
    cd ..
    echo ERROR: APK build failed!
    exit /b 1
)
cd ..
echo   [OK] APK built

echo.
echo [7/7] Copying APK...
copy "android\app\build\outputs\apk\debug\app-debug.apk" "CryptoScanner-Debug.apk" /Y
if errorlevel 1 (
    echo ERROR: Failed to copy APK!
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! APK Ready!
echo ========================================
echo.
echo APK: CryptoScanner-Debug.apk
echo.
echo Next Steps:
echo   1. Transfer APK to your mobile
echo   2. Install the APK
echo   3. Open Debug menu (wrench icon)
echo   4. Test Config, Products, Positions
echo   5. Copy logs if errors occur
echo.
