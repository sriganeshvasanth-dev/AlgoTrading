@echo off
REM ============================================================================
REM SIMPLE JAVA FIX - ONE COMMAND SETUP
REM ============================================================================
REM Run this to quickly setup Java after manual installation
REM Usage: set-java-path.bat
REM ============================================================================

echo.
echo ============================================================================
echo   SIMPLE JAVA PATH SETUP
echo ============================================================================
echo.

REM Check if Java is already working
java -version >nul 2>&1
if not errorlevel 1 (
    echo [✓] Java is already working!
    echo.
    java -version
    echo.
    echo You can now run: build-apk-simple.bat
    echo.
    pause
    exit /b 0
)

echo [!] Java not found in PATH
echo.
echo This script will help you add Java to Windows PATH
echo.
echo First, you need to install Java from:
echo https://www.oracle.com/java/technologies/downloads/
echo.
echo After installing, come back and run this script.
echo.

echo Looking for Java installation...
echo.

if exist "C:\Program Files\Java" (
    echo Found Java folder!
    echo.
    dir "C:\Program Files\Java" /B
    echo.
    echo Which Java version is installed? (Enter folder name from above)
    echo Example: jdk-11.0.20 or jdk-17.0.8
    echo.
    set /p JAVA_FOLDER="Enter folder name: "

    if exist "C:\Program Files\Java\%JAVA_FOLDER%" (
        echo.
        echo Setting JAVA_HOME to: C:\Program Files\Java\%JAVA_FOLDER%
        echo.

        REM Set JAVA_HOME
        setx JAVA_HOME "C:\Program Files\Java\%JAVA_FOLDER%"

        REM Add to PATH
        setx PATH "%PATH%;C:\Program Files\Java\%JAVA_FOLDER%\bin"

        echo [✓] Java path configured!
        echo.
        echo IMPORTANT: Close this window and open a NEW Command Prompt
        echo Then run: java -version
        echo Then run: build-apk-simple.bat
        echo.
        pause
        exit /b 0
    ) else (
        echo ERROR: Folder not found
        echo.
        pause
        exit /b 1
    )
) else (
    echo ERROR: Java not installed in default location
    echo.
    echo 1. Download Java from: https://www.oracle.com/java/technologies/downloads/
    echo 2. Run the installer (Windows x64 Installer)
    echo 3. Use default installation path
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)
