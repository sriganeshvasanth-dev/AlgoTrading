@echo off
echo ========================================
echo   CryptoScanner Mobile APK Builder
echo   Updated with New API Credentials
echo ========================================
echo.
echo API Key: gbnHnK6baTLfger016WR2qIIYSQJzn
echo.
echo IMPORTANT: Before using the app on mobile:
echo   1. Log in to Delta Exchange
echo   2. Go to Settings - API Management
echo   3. Find this API key
echo   4. Enable "Allow all IPs" or add your mobile IP
echo   5. Save changes
echo.
pause

echo.
echo [Step 1/7] Checking configuration...
if not exist "src\assets\config.json" (
    echo ERROR: Config file missing!
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
    exit /b 1
)
echo   [OK] Angular build successful

echo.
echo [Step 4/7] Verifying build output...
if not exist "dist\CryptoCurrencyScanner\browser\index.html" (
    echo ERROR: Build output incomplete!
    exit /b 1
)
if not exist "dist\CryptoCurrencyScanner\browser\assets\config.json" (
    echo WARNING: Copying config manually...
    if not exist "dist\CryptoCurrencyScanner\browser\assets" mkdir "dist\CryptoCurrencyScanner\browser\assets"
    copy "src\assets\config.json" "dist\CryptoCurrencyScanner\browser\assets\config.json" /Y
)
echo   [OK] Build output verified

echo.
echo [Step 5/7] Syncing Capacitor...
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
    echo ERROR: APK build failed!
    exit /b 1
)
echo   [OK] APK build successful

echo.
echo [Step 7/7] Copying APK...
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
echo NEW API CREDENTIALS INCLUDED:
echo   API Key: gbnHnK6baTLfger016WR2qIIYSQJzn
echo.
echo CRITICAL NEXT STEP:
echo   Before the app will work on mobile, you MUST:
echo   1. Go to https://www.delta.exchange
echo   2. Login to your account
echo   3. Settings - API Management
echo   4. Find API key: gbnHnK6baTLfger016WR2qIIYSQJzn
echo   5. Edit IP restrictions
echo   6. Select "Allow all IPs" or add your mobile IP
echo   7. SAVE the changes
echo.
echo Without IP whitelisting, you'll see error:
echo   "ip_not_whitelisted_for_api_key"
echo.
echo FIXES INCLUDED:
echo   - Table header overlap fixed
echo   - Enhanced error logging
echo   - Optimized mobile layout
echo   - Debug page for troubleshooting
echo.
echo INSTALLATION:
echo   1. Transfer CryptoScanner-Debug.apk to phone
echo   2. Install (enable Unknown Sources if needed)
echo   3. Open app and test:
echo      - Debug page - Test Config
echo      - Debug page - Test Products
echo      - Debug page - Test Positions
echo.
echo If Test Positions shows "ip_not_whitelisted":
echo   - You forgot to whitelist IP in Delta Exchange!
echo   - Go do Step 6 above
echo   - No need to rebuild - just refresh app
echo.
