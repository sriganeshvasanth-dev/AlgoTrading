@echo off
cd /d "%~dp0"

echo.
echo ============================================================================
echo   CRYPTO CURRENCY SCANNER - QUICK BUILD
echo ============================================================================
echo.

echo [1] Checking prerequisites...
java -version >nul 2>&1
if errorlevel 1 echo ERROR: Java not found! && exit /b 1
echo   [OK] Java

node --version >nul 2>&1
if errorlevel 1 echo ERROR: Node.js not found! && exit /b 1
echo   [OK] Node.js

call npm --version >nul 2>&1
if errorlevel 1 echo ERROR: npm not found! && exit /b 1
echo   [OK] npm

echo.
echo [2] Building Angular...
call npm install
if errorlevel 1 echo ERROR: npm install failed! && exit /b 1
call npm run build:prod
if errorlevel 1 echo ERROR: Angular build failed! && exit /b 1
echo [OK] Angular build complete

echo.
echo [3] Syncing to Android...
call npx cap sync android
if errorlevel 1 echo ERROR: Capacitor sync failed! && exit /b 1
echo [OK] Capacitor sync complete

echo.
echo [4] Building APK...
cd android
call gradlew.bat clean
if errorlevel 1 echo ERROR: Gradle clean failed! && cd .. && exit /b 1
call gradlew.bat assembleDebug
if errorlevel 1 echo ERROR: Gradle build failed! && cd .. && exit /b 1
cd ..
echo [OK] Build complete

echo.
echo ============================================================================
echo BUILD SUCCESSFUL!
echo ============================================================================
echo APK: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Next: install-apk.bat
echo ============================================================================
echo.
pause
