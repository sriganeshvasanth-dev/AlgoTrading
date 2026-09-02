@echo off
REM ============================================================================
REM APK BUILD SCRIPT FOR CRYPTO CURRENCY SCANNER
REM ============================================================================
REM This batch file automates the APK build process for the Crypto Currency
REM Scanner Angular + Capacitor application.
REM
REM Usage:
REM   build-debug-apk.bat        - Build debug APK
REM   build-debug-apk.bat release - Build release APK
REM   build-debug-apk.bat clean   - Clean all build artifacts
REM
REM ============================================================================

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Build type parameter
set "BUILD_TYPE=debug"
if not "%1"=="" set "BUILD_TYPE=%1"

REM ============================================================================
REM UTILITY FUNCTIONS
REM ============================================================================

:print_header
cls
echo.
echo ============================================================================
echo   CRYPTO CURRENCY SCANNER - APK BUILD SCRIPT
echo ============================================================================
echo.
goto :eof

:print_step
echo.
echo [*] %~1
goto :eof

:print_success
echo [✓] %~1
goto :eof

:print_error
echo [!] ERROR: %~1
goto :eof

:print_warning
echo [!] WARNING: %~1
goto :eof

:check_prerequisites
echo.
echo ============================================================================
echo CHECKING PREREQUISITES
echo ============================================================================
echo.

REM Check Java
call :print_step "Checking Java..."
java -version >nul 2>&1
if errorlevel 1 (
    call :print_error "Java not found! Please install JDK 11 or later."
    echo.
    echo   Download: https://www.oracle.com/java/technologies/downloads/
    echo   Then set JAVA_HOME environment variable
    exit /b 1
) else (
    call :print_success "Java found"
)

REM Check Node.js
call :print_step "Checking Node.js..."
node --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Node.js not found! Please install Node.js 16 or later."
    echo.
    echo   Download: https://nodejs.org/
    exit /b 1
) else (
    call :print_success "Node.js found"
)

REM Check npm
call :print_step "Checking npm..."
npm --version >nul 2>&1
if errorlevel 1 (
    call :print_error "npm not found!"
    exit /b 1
) else (
    call :print_success "npm found"
)

REM Check adb
call :print_step "Checking Android SDK (adb)..."
adb version >nul 2>&1
if errorlevel 1 (
    call :print_warning "adb not found in PATH (optional for now)"
    echo   You may need to add ANDROID_HOME\platform-tools to PATH
) else (
    call :print_success "Android SDK found"
)

REM Check project files
call :print_step "Checking project files..."
if not exist "package.json" (
    call :print_error "package.json not found!"
    exit /b 1
)
call :print_success "package.json found"

if not exist "capacitor.config.ts" (
    call :print_error "capacitor.config.ts not found!"
    exit /b 1
)
call :print_success "capacitor.config.ts found"

if not exist "angular.json" (
    call :print_error "angular.json not found!"
    exit /b 1
)
call :print_success "angular.json found"

if not exist "android\app\build.gradle" (
    call :print_error "android\app\build.gradle not found!"
    echo   Capacitor Android project not initialized
    exit /b 1
)
call :print_success "Android project found"

echo.
call :print_success "All prerequisites met!"
goto :eof

:clean_build
echo.
echo ============================================================================
echo CLEANING BUILD ARTIFACTS
echo ============================================================================
echo.

call :print_step "Removing dist directory..."
if exist "dist" (
    rmdir /s /q "dist" >nul 2>&1
    call :print_success "dist directory removed"
) else (
    echo   (dist directory not found - skipping)
)

call :print_step "Removing node_modules..."
if exist "node_modules" (
    rmdir /s /q "node_modules" >nul 2>&1
    call :print_success "node_modules directory removed"
) else (
    echo   (node_modules directory not found - skipping)
)

call :print_step "Removing Android build directory..."
if exist "android\app\build" (
    rmdir /s /q "android\app\build" >nul 2>&1
    call :print_success "Android build directory removed"
) else (
    echo   (android\app\build not found - skipping)
)

call :print_step "Removing Gradle cache..."
if exist "android\.gradle" (
    rmdir /s /q "android\.gradle" >nul 2>&1
    call :print_success "Gradle cache removed"
) else (
    echo   (gradle cache not found - skipping)
)

echo.
call :print_success "Clean complete!"
goto :eof

:build_angular
echo.
echo ============================================================================
echo STEP 1: BUILD ANGULAR
echo ============================================================================
echo.

call :print_step "Installing npm dependencies..."
call npm install
if errorlevel 1 (
    call :print_error "npm install failed!"
    exit /b 1
)
call :print_success "Dependencies installed"

echo.
call :print_step "Building Angular production bundle..."
echo   This may take 2-3 minutes on first build...
echo.

call npm run build:prod
if errorlevel 1 (
    call :print_error "Angular build failed!"
    echo.
    echo   Check the error messages above for details
    exit /b 1
)
call :print_success "Angular build completed"

echo.
call :print_step "Verifying Angular output..."
if not exist "dist\CryptoCurrencyScanner\browser\index.html" (
    call :print_error "Angular output not found at expected location!"
    exit /b 1
)
call :print_success "Angular output verified"

goto :eof

:sync_capacitor
echo.
echo ============================================================================
echo STEP 2: SYNC TO CAPACITOR ANDROID
echo ============================================================================
echo.

call :print_step "Syncing web assets to Android project..."
call npx cap sync android
if errorlevel 1 (
    call :print_error "Capacitor sync failed!"
    exit /b 1
)
call :print_success "Capacitor sync completed"

echo.
call :print_step "Verifying web assets copied..."
if not exist "android\app\src\main\assets\public\index.html" (
    call :print_error "Web assets not found in Android project!"
    exit /b 1
)
call :print_success "Web assets verified in Android project"

goto :eof

:build_gradle
echo.
echo ============================================================================
echo STEP 3: BUILD WITH GRADLE
echo ============================================================================
echo.

cd android

call :print_step "Running Gradle clean..."
call gradlew.bat clean
if errorlevel 1 (
    call :print_error "Gradle clean failed!"
    cd ..
    exit /b 1
)
call :print_success "Gradle clean completed"

echo.
call :print_step "Building %BUILD_TYPE% APK..."
echo   This may take 3-5 minutes on first build...
echo.

if "!BUILD_TYPE!"=="release" (
    call gradlew.bat assembleRelease
    if errorlevel 1 (
        call :print_error "Gradle build (release) failed!"
        cd ..
        exit /b 1
    )
    call :print_success "Release APK build completed"
) else (
    call gradlew.bat assembleDebug
    if errorlevel 1 (
        call :print_error "Gradle build (debug) failed!"
        cd ..
        exit /b 1
    )
    call :print_success "Debug APK build completed"
)

cd ..

goto :eof

:find_apk
echo.
echo ============================================================================
echo LOCATING APK FILE
echo ============================================================================
echo.

if "!BUILD_TYPE!"=="release" (
    set "APK_PATH=android\app\build\outputs\apk\release\app-release.apk"
) else (
    set "APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk"
)

if not exist "!APK_PATH!" (
    call :print_error "APK file not found at expected location:"
    echo   Expected: !APK_PATH!
    exit /b 1
)

REM Get file size
if exist "!APK_PATH!" (
    for %%A in ("!APK_PATH!") do set SIZE=%%~zA
    set/a SIZE_MB=SIZE / 1048576
    if SIZE_MB==0 set/a SIZE_MB=1
)

call :print_success "APK file found!"
echo.
echo   Location: !APK_PATH!
echo   Size: !SIZE_MB! MB
echo.

goto :eof

:print_instructions
echo.
echo ============================================================================
echo BUILD COMPLETED SUCCESSFULLY!
echo ============================================================================
echo.
echo Your APK is ready:
echo   %APK_PATH%
echo.
echo Next steps:
echo.
echo 1. INSTALL ON DEVICE:
echo    adb install -r "%APK_PATH%"
echo.
echo 2. LAUNCH APP:
echo    adb shell am start -n com.crypto.scanner/.MainActivity
echo.
echo 3. VIEW LOGS:
echo    adb logcat ^| findstr "com.crypto.scanner"
echo.
echo 4. UNINSTALL:
echo    adb uninstall com.crypto.scanner
echo.
echo ============================================================================
goto :eof

:handle_clean
echo.
echo ============================================================================
echo BUILD CLEANUP
echo ============================================================================
echo.

call :clean_build
echo.
echo Cleanup complete! To build the APK again, run:
echo   build-debug-apk.bat
echo.
goto :eof

:main
call :print_header

REM Check if clean mode
if "!BUILD_TYPE!"=="clean" (
    call :handle_clean
    exit /b 0
)

REM Check prerequisites
call :check_prerequisites
if errorlevel 1 exit /b 1

REM Build steps
call :build_angular
if errorlevel 1 exit /b 1

call :sync_capacitor
if errorlevel 1 exit /b 1

call :build_gradle
if errorlevel 1 exit /b 1

call :find_apk
if errorlevel 1 exit /b 1

call :print_instructions

echo.
echo ============================================================================
echo SUMMARY
echo ============================================================================
echo.
echo Build Type:    %BUILD_TYPE%
echo APK Path:      %APK_PATH%
echo Build Status:  SUCCESS
echo.
echo ============================================================================
echo.

exit /b 0

REM ============================================================================
REM START HERE
REM ============================================================================
call :main
