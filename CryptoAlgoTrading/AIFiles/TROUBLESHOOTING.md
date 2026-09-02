# 🔧 APK Build Troubleshooting Guide

## Prerequisites Not Installed

### Error: "java: The term 'java' is not recognized"

**Cause:** JDK not installed or not in PATH

**Solution:**
1. Download JDK 11+: https://www.oracle.com/java/technologies/downloads/
2. Install JDK
3. Set JAVA_HOME:
   ```powershell
   # Add to system environment variables
   New-Item -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" -Name JAVA_HOME -Value "C:\Program Files\Java\jdk-11.x.x" -Force

   # Or for current user
   [Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-11.x.x", "User")

   # Verify
   java -version
   ```

4. Add to PATH:
   ```powershell
   $JavaBin = [Environment]::GetEnvironmentVariable("JAVA_HOME", "User") + "\bin"
   $CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
   [Environment]::SetEnvironmentVariable("PATH", "$CurrentPath;$JavaBin", "User")
   ```

### Error: "adb: The term 'adb' is not recognized"

**Cause:** Android SDK's platform-tools not in PATH

**Solution:**
```powershell
# Set ANDROID_HOME
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:USERPROFILE\AppData\Local\Android\sdk", "User")

# Add platform-tools to PATH
$AndroidPath = [Environment]::GetEnvironmentVariable("ANDROID_HOME", "User") + "\platform-tools"
$CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
[Environment]::SetEnvironmentVariable("PATH", "$CurrentPath;$AndroidPath", "User")

# Verify
adb version
```

### Error: "npm: command not found"

**Cause:** Node.js not installed

**Solution:**
1. Download Node.js 16+: https://nodejs.org/
2. Run installer
3. Verify:
   ```powershell
   node --version
   npm --version
   ```

---

## Angular Build Problems

### Error: "Cannot find module '@angular/...'"

**Cause:** Dependencies not installed

**Solution:**
```powershell
# Reinstall dependencies
rm -Recurse -Force node_modules
npm install

# Clear npm cache if needed
npm cache clean --force
npm install
```

### Error: "Build optimizer error" or "AoT compilation error"

**Cause:** TypeScript/compilation errors in source

**Solution:**
```powershell
# Check for obvious errors
npm run build:prod -- --verbose

# Or manually compile
ng build --configuration production --verbose
```

Look for the specific error and fix it in the source code.

### Error: "dist/CryptoCurrencyScanner/browser not found"

**Cause:** Build output directory doesn't exist

**Solution:**
```powershell
# Full clean rebuild
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npm run build:prod

# Verify output
Get-ChildItem -Path "dist/CryptoCurrencyScanner/browser" -Recurse | Measure-Object | Select-Object -ExpandProperty Count
```

---

## Capacitor Sync Issues

### Error: "Cannot find capacitor config"

**Cause:** capacitor.config.ts missing or misconfigured

**Solution:**
```powershell
# Verify file exists
Test-Path capacitor.config.ts

# Check content
Get-Content capacitor.config.ts

# Reinitialize if needed
npx cap init

# Then sync again
npx cap sync android
```

### Error: "WebDir not found"

**Cause:** Build output path doesn't exist in capacitor.config.ts

**Solution:**
1. First build Angular: `npm run build:prod`
2. Then check capacitor.config.ts:
   ```typescript
   webDir: 'dist/CryptoCurrencyScanner/browser'  // Should match Angular output
   ```
3. Verify directory exists:
   ```powershell
   Test-Path "dist/CryptoCurrencyScanner/browser/index.html"
   ```

---

## Gradle Build Issues

### Error: "Could not find com.android.tools.build:gradle"

**Cause:** Gradle can't download dependencies (network or corruption)

**Solution:**
```powershell
cd android

# Clear gradle cache
Remove-Item -Recurse -Force ".gradle" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "build" -ErrorAction SilentlyContinue

# Rebuild
.\gradlew.bat clean
.\gradlew.bat build

cd ..
```

### Error: "Build tools version not installed"

**Cause:** Required Android SDK build-tools not installed

**Solution:**
1. Open Android Studio
2. Go to **Tools** → **SDK Manager**
3. Click **SDK Tools** tab
4. Install the required build-tools version shown in error
5. Or install latest:
   ```powershell
   # Using sdkmanager
   $SDK = [Environment]::GetEnvironmentVariable("ANDROID_HOME", "User")
   & "$SDK\cmdline-tools\latest\bin\sdkmanager.bat" "build-tools;34.0.0"
   ```

### Error: "Compilation of Java classes failed"

**Cause:** Java compilation error in Capacitor plugin code

**Solution:**
```powershell
# Get more details
cd android
.\gradlew.bat build --info 2>&1 | Tee-Object -FilePath build-error.log

# Look for "error:" in log and fix Java code
# Common: Check android/app/src/main/java/
```

### Error: "JAVA_HOME not set or invalid"

**Cause:** Gradle can't find Java

**Solution:**
```powershell
# Set JAVA_HOME
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-11.x.x", "Machine")

# Restart PowerShell and verify
$env:JAVA_HOME
java -version

# Then retry build
cd android
.\gradlew.bat build
cd ..
```

### Error: "Gradle sync failed in Android Studio"

**Cause:** Gradle version mismatch or cached issues

**Solution:**
1. In Android Studio: **File** → **Invalidate Caches** → **Invalidate and Restart**
2. Wait for sync to complete
3. If still fails:
   ```powershell
   cd android
   ./gradlew.bat clean
   cd ..
   ```
4. If on wrong JDK in Android Studio:
   - **File** → **Project Structure** → **SDK Location**
   - Set correct JDK and Gradle paths

---

## APK Not Generated

### "APK file not found after build"

**Causes & Solutions:**

1. **Build actually failed silently**
   ```powershell
   cd android
   .\gradlew.bat build --info  # See detailed logs
   cd ..
   ```

2. **Wrong output path**
   ```powershell
   # Find all APKs
   Get-ChildItem -Path "android" -Filter "*.apk" -Recurse
   ```

3. **Gradle build incomplete**
   ```powershell
   cd android
   Remove-Item -Recurse -Force build
   .\gradlew.bat assembleDebug  # Explicit debug build
   cd ..
   ```

4. **Insufficient disk space**
   - Ensure at least 5GB free space
   - Clear gradle cache: `Remove-Item -Recurse -Force $env:USERPROFILE\.gradle`

---

## Runtime Issues (App Crashes)

### App Crashes on Launch

1. **Check device logs:**
   ```powershell
   adb logcat -c
   adb logcat | findstr "E/"
   ```

2. **Look for permission errors:**
   ```powershell
   adb logcat | findstr "permission"
   ```

3. **Check capacitor config:**
   ```powershell
   # Verify allowInsecure domains
   Get-Content capacitor.config.ts

   # Update if needed for API endpoints:
   # allowInsecure: ['api.india.delta.exchange', 'api.example.com']
   ```

4. **Check web content loaded:**
   ```powershell
   adb shell "ls -la /data/data/com.crypto.scanner/files/www/"
   adb shell "cat /data/data/com.crypto.scanner/files/www/index.html" | head -20
   ```

### App Freezes/Stuck on Loading

**Cause:** Long-running synchronous operations on main thread

**Solution:**
1. Check API calls are async
2. Enable verbose logging:
   ```typescript
   // In app.component.ts
   ngOnInit() {
     console.log('App initialized');
     // Check what happens here
   }
   ```

3. Check device performance:
   ```powershell
   adb shell "dumpsys meminfo com.crypto.scanner"
   ```

### Network Requests Not Working

1. **Check allowInsecure config:**
   ```powershell
   # Edit capacitor.config.ts
   allowInsecure: ['api.india.delta.exchange']  # Add your API domain
   ```

2. **Verify Certificate Pinning:**
   ```powershell
   # For HTTPS APIs, check certificate:
   # Usually works out of the box with Capacitor
   ```

3. **Test connectivity:**
   ```powershell
   adb shell ping google.com
   ```

---

## Performance & Optimization

### APK Too Large (>50 MB)

**Solutions:**

1. **Enable ProGuard/R8 obfuscation:**
   ```gradle
   // android/app/build.gradle
   buildTypes {
       release {
           minifyEnabled true
           proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
       }
   }
   ```

2. **Remove debug symbols:**
   ```powershell
   # In android studio build settings
   ```

3. **Optimize assets:**
   - Compress images before adding to assets/
   - Remove unused dependencies

### Build Takes Too Long

```powershell
# Speed up gradle builds
cd android

# Enable parallel builds
.\gradlew.bat build -x test --parallel --daemon

# Use gradle cache
.\gradlew.bat build --build-cache

# Increase gradle memory (if you have it)
# Edit gradle.properties:
# org.gradle.jvmargs=-Xmx4096m
```

---

## Clean Rebuild Procedure

If nothing else works, do a complete clean rebuild:

```powershell
Write-Host "🧹 Performing complete clean rebuild..."

# 1. Clean everything
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android/app/build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android/.gradle -ErrorAction SilentlyContinue

# 2. Reinstall npm packages
npm install

# 3. Clear gradle
cd android
.\gradlew.bat clean
cd ..

# 4. Rebuild from scratch
npm run build:prod
npx cap sync android
cd android
.\gradlew.bat build
cd ..

Write-Host "✅ Clean rebuild complete"
```

---

## Getting Help

1. **Enable verbose logging:**
   ```powershell
   ng build --verbose
   cd android && .\gradlew.bat build --info && cd ..
   adb logcat -v long
   ```

2. **Check Angular console in browser DevTools:**
   - Open Chrome
   - Connect to device via Chrome DevTools
   - Check console for JavaScript errors

3. **Save detailed logs:**
   ```powershell
   np run build:prod 2>&1 | Tee-Object -FilePath build.log
   cd android && .\gradlew.bat build 2>&1 | Tee-Object -FilePath gradle.log && cd ..
   adb logcat | Tee-Object -FilePath device.log
   ```

4. **Check official resources:**
   - [Capacitor Documentation](https://capacitorjs.com/docs)
   - [Android Build Documentation](https://developer.android.com/)
   - [Angular Build Docs](https://angular.io/guide/builds)

---

## Emergency Contacts

- **Capacitor Issues:** https://github.com/ionic-team/capacitor/issues
- **Angular Issues:** https://github.com/angular/angular/issues
- **Android SDK:** https://developer.android.com/studio/troubleshoot
- **Gradle Issues:** https://docs.gradle.org/current/userguide/troubleshooting.html
