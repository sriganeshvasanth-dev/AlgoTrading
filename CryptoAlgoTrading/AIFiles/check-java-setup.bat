@echo off
REM ============================================================================
REM JAVA DIAGNOSTIC TOOL - Check What's Wrong
REM ============================================================================

cls
echo.
echo ============================================================================
echo   JAVA DIAGNOSTIC CHECKER
echo ============================================================================
echo.

echo [1] Checking if Java is installed and accessible...
echo.

REM Try to run java
java -version 2>nul
if errorlevel 1 (
    echo [X] Java NOT found!
    echo.
    goto java_missing
) else (
    echo [✓] Java found!
    echo.
    java -version
    echo.
    goto java_found
)

:java_missing
echo ERROR: Java is not accessible
echo.
echo This means either:
echo 1. Java is not installed
echo 2. Java is installed but not in PATH
echo 3. JAVA_HOME environment variable is not set
echo.
echo ============================================================================
echo WHAT TO DO:
echo ============================================================================
echo.
echo Option A: Install Java (if not installed)
echo   1. Download: https://www.oracle.com/java/technologies/downloads/
echo   2. Run installer (Windows x64)
echo   3. Use default path: C:\Program Files\Java\
echo.
echo Option B: Set JAVA_HOME (if Java is installed but not found)
echo   1. Open Command Prompt as Administrator
echo   2. Check Java folder: dir "C:\Program Files\Java"
echo   3. Run this command (replace with your folder):
echo      setx JAVA_HOME "C:\Program Files\Java\jdk-11.0.20"
echo   4. Close and reopen Command Prompt
echo.
echo Option C: Add Java to PATH
echo   1. Open Command Prompt as Administrator
echo   2. Run:
echo      setx PATH "%PATH%;C:\Program Files\Java\jdk-11.0.20\bin"
echo   3. Close and reopen Command Prompt
echo.
echo After fixing, try again:
echo   set-java-path.bat
echo   (or)
echo   build-apk-simple.bat
echo.
pause
exit /b 1

:java_found
echo [2] Checking Java version...
echo.
for /f "tokens=2" %%i in ('java -version 2^>^&1 ^| find "version"') do set JAVA_VERSION=%%i
echo Java version detected: %JAVA_VERSION%
echo.

echo [3] Checking JAVA_HOME environment variable...
echo.
if "%JAVA_HOME%"=="" (
    echo [!] JAVA_HOME is not set
    echo.
    echo Run this to fix:
    echo   setx JAVA_HOME "C:\Program Files\Java\jdk-11.0.20"
    echo.
) else (
    echo [✓] JAVA_HOME is set to:
    echo   %JAVA_HOME%
    echo.
)

echo [4] Checking where java.exe is located...
echo.
where java
echo.

echo [5] Checking gradle...
echo.
if exist "android\gradlew.bat" (
    echo [✓] Gradle found at: android\gradlew.bat
) else (
    echo [X] Gradle not found!
)
echo.

echo [6] Checking Angular configuration...
echo.
if exist "angular.json" (
    echo [✓] Angular config found
) else (
    echo [X] Angular config not found!
)
echo.
if exist "package.json" (
    echo [✓] Package.json found
) else (
    echo [X] Package.json not found!
)
echo.

echo ============================================================================
echo SUMMARY
echo ============================================================================
echo.
echo If you see [✓] for everything above, try building:
echo   build-apk-simple.bat
echo.
echo If you see [X] for Java, your Java is not properly configured.
echo See the instructions above to fix it.
echo.

pause
