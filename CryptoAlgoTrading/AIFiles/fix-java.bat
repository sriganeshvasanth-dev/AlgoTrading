@echo off
REM ============================================================================
REM INSTALL/FIX JAVA ENVIRONMENT
REM ============================================================================
REM This script helps you setup Java and fix the "java not found" error
REM ============================================================================

cd /d "%~dp0"

cls
echo.
echo ============================================================================
echo   JAVA INSTALLATION HELPER
echo ============================================================================
echo.

REM Check if Java is already installed
java -version >nul 2>&1
if errorlevel 1 (
    echo [!] Java not found
    echo.
    echo This script will help you install Java (JDK) for your APK build.
    echo.
    echo Required: Java 11 or later (Java 11, 17, or 21 recommended)
    echo.
    goto menu
) else (
    echo [✓] Java found!
    echo.
    java -version
    echo.
    echo Java is already installed and accessible.
    echo You can now run: build-apk-simple.bat
    echo.
    pause
    exit /b 0
)

:menu
echo.
echo What would you like to do?
echo.
echo 1. Open Oracle Java download page (install manually)
echo 2. Check for existing Java installation
echo 3. Help me set JAVA_HOME environment variable
echo 4. Verify Java installation after manual install
echo 5. Exit
echo.
set /p CHOICE="Enter your choice (1-5): "

if "%CHOICE%"=="1" goto download
if "%CHOICE%"=="2" goto check_install
if "%CHOICE%"=="3" goto set_javahome
if "%CHOICE%"=="4" goto verify
if "%CHOICE%"=="5" exit /b 0
goto menu

:download
echo.
echo Opening Oracle Java downloads...
echo.
echo Download page: https://www.oracle.com/java/technologies/downloads/
echo.
echo Steps:
echo 1. Choose: "Windows x64 Installer" (for 64-bit Windows)
echo 2. Download the .exe file
echo 3. Run the installer
echo 4. Click "Next" and follow the wizard
echo 5. Let it install to default location
echo 6. Click "Finish"
echo.
echo After installation, run this script again to set JAVA_HOME.
echo.
start https://www.oracle.com/java/technologies/downloads/
pause
goto menu

:check_install
echo.
echo Checking for Java installations...
echo.

if exist "C:\Program Files\Java" (
    echo Found Java folder:
    echo.
    dir "C:\Program Files\Java" /B
    echo.
) else (
    echo No Java folder found in: C:\Program Files\Java
    echo.
)

echo Checking system PATH for java.exe...
where java >nul 2>&1
if errorlevel 1 (
    echo   Java not found in PATH
) else (
    echo   Found java.exe
    where java
)

echo.
pause
goto menu

:set_javahome
echo.
echo Setting JAVA_HOME environment variable...
echo.

REM Check if Java exists
if not exist "C:\Program Files\Java" (
    echo ERROR: Java folder not found!
    echo Please install Java first from: https://www.oracle.com/java/technologies/downloads/
    echo.
    pause
    goto menu
)

echo Found Java installations:
dir "C:\Program Files\Java" /B
echo.

set /p JAVA_FOLDER="Enter the Java folder name (e.g., jdk-11.0.20): "

if not exist "C:\Program Files\Java\%JAVA_FOLDER%" (
    echo ERROR: Folder not found: C:\Program Files\Java\%JAVA_FOLDER%
    echo.
    pause
    goto menu
)

echo.
echo Setting JAVA_HOME to: C:\Program Files\Java\%JAVA_FOLDER%
echo.

REM Set JAVA_HOME
setx JAVA_HOME "C:\Program Files\Java\%JAVA_FOLDER%"
if errorlevel 1 (
    echo ERROR: Failed to set JAVA_HOME
    echo.
    pause
    goto menu
)

echo [✓] JAVA_HOME set successfully!
echo.

REM Add to PATH
echo Adding java to PATH...
setx PATH "%PATH%;%JAVA_HOME%\bin" >nul 2>&1

echo [✓] PATH updated!
echo.
echo Please close and reopen Command Prompt to apply changes.
echo Then verify with: java -version
echo.
pause
goto menu

:verify
echo.
echo Verifying Java installation...
echo.

java -version >nul 2>&1
if errorlevel 1 (
    echo [!] Java not found!
    echo.
    echo Try:
    echo 1. Close and reopen Command Prompt completely
    echo 2. Run: java -version
    echo 3. If still not found, go back to step 3 to set JAVA_HOME
    echo.
    pause
    goto menu
) else (
    echo [✓] Java is working!
    echo.
    echo Version:
    java -version
    echo.
    echo You can now run: build-apk-simple.bat
    echo.
    pause
    exit /b 0
)
