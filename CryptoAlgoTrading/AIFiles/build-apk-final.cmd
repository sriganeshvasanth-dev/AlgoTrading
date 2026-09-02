@echo off
echo ========================================
echo   CryptoScanner Mobile APK Builder
echo   With Enhanced Debugging and Logging
echo ========================================
echo.

echo [Step 1/7] Checking configuration...
if not exist "src\assets\config.json" (
    echo ERROR: Config file missing!
    echo Please create src\assets\config.json with your Delta API credentials
    exit /b 1
)
echo   [OK] Config file found

echo.
echo [Step 2/7] Cleaning previous builds...
if exist "dist" (
    rmdir /s /q "dist"
    echo   [OK] Removed dist folder
)
if exist "android\app\build" (
    rmdir /s /q "android\app\build"
    echo   [OK] Removed Android build cache
)

echo.
echo [Step 3/7] Building Angular production bundle...
echo   This may take 1-2 minutes...
call npm run build --configuration=production
if errorlevel 1 (
    echo ERROR: Angular build failed!
    echo Check the error messages above
    exit /b 1
)
echo   [OK] Angular build successful

echo.
echo [Step 4/7] Verifying build output...
if not exist "dist\CryptoCurrencyScanner\browser\index.html" (
    echo ERROR: Build output is incomplete!
    exit /b 1
)
if not exist "dist\CryptoCurrencyScanner\browser\assets\config.json" (
    echo WARNING: Config not in build output, copying manually...
    if not exist "dist\CryptoCurrencyScanner\browser\assets" mkdir "dist\CryptoCurrencyScanner\browser\assets"
    copy "src\assets\config.json" "dist\CryptoCurrencyScanner\browser\assets\config.json" /Y
)
echo   [OK] Build output verified

echo.
echo [Step 5/7] Syncing Capacitor Android platform...
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Capacitor sync failed!
    exit /b 1
)
echo   [OK] Capacitor synced

echo.
echo [Step 6/7] Building Android APK...
echo   This may take 2-3 minutes...
cd android
call gradlew assembleDebug
set BUILD_RESULT=%errorlevel%
cd ..
if %BUILD_RESULT% neq 0 (
    echo ERROR: Android APK build failed!
    exit /b 1
)
echo   [OK] APK build successful

echo.
echo [Step 7/7] Copying APK to root...
if not exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo ERROR: APK file not found!
    exit /b 1
)
copy "android\app\build\outputs\apk\debug\app-debug.apk" "CryptoScanner-Debug.apk" /Y
if errorlevel 1 (
    echo ERROR: Failed to copy APK!
    exit /b 1
)

echo.
echo ========================================
echo   BUILD SUCCESSFUL!
echo ========================================
echo.
echo APK File: CryptoScanner-Debug.apk
for %%F in (CryptoScanner-Debug.apk) do echo APK Size: %%~zF bytes
echo.
echo RECENT FIXES:
echo   - Enhanced mobile debugging with Debug page
echo   - Fixed positions API to return all data
echo   - Optimized mobile layout and table sizing
echo   - Fixed table header alignment on mobile
echo   - Reduced stat card sizes for better mobile fit
echo   - Added comprehensive error logging
echo.
echo NEXT STEPS:
echo   1. Transfer APK to your Android device
echo   2. Install the APK (enable "Unknown sources" if needed)
echo   3. Open the app and tap Debug (wrench icon)
echo   4. Use test buttons to diagnose any issues:
echo      - Test Config: Verify configuration loads
echo      - Test Products: Check API connectivity
echo      - Test Positions: Verify authentication
echo   5. Check logs in Debug page if Scanner/Positions show issues
echo.
echo If you see "0 positions" in the logs, it means:
echo   - Your API credentials are valid
echo   - The API call worked
echo   - You currently have no open positions
echo.
echo If positions API fails, check the Debug logs for:
echo   - Authentication errors (401/403)
echo   - Network errors (timeout/connection refused)
echo   - API response structure issues
echo.
