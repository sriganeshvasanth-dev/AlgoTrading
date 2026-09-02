# APK Generation - Quick Start Checklist

## 📋 Before You Start

### Prerequisites (Required)

- [ ] **Android Studio** installed
  - Download: https://developer.android.com/studio
  - Includes Android SDK

- [ ] **Java JDK** (version 11 or higher)
  - Download: https://www.oracle.com/java/technologies/downloads/
  - Verify: Open terminal, type `java -version`

- [ ] **Node.js & npm** (already have this ✓)
  - Verify: `node --version` and `npm --version`

---

## 🚀 Step-by-Step Process

### Phase 1: Prepare Web App (5 minutes)

```powershell
# Navigate to your project directory
cd 'C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner\'

# Clean and build
npm run build

# Verify dist/ folder was created with all files
```

- [ ] Build completed without errors
- [ ] `dist/` folder exists and contains files

---

### Phase 2: Setup Capacitor (10 minutes)

```powershell
# Still in your project directory

# Install Capacitor
npm install @capacitor/core
npm install --save-dev @capacitor/cli

# Initialize Capacitor
npx cap init

# When prompted:
# App name: CryptoCurrencyScanner
# App Package ID: com.cryptoscanner.app
# Web Directory: dist

# Add Android support
npm install @capacitor/android
npx cap add android
```

- [ ] Capacitor installed
- [ ] `capacitor.config.ts` created in root
- [ ] `android/` directory created

---

### Phase 3: Build APK (Optional: Using Terminal)

```powershell
# Sync web files to Android project
npx cap sync android

# Navigate to android directory
cd android

# Build debug APK (faster, for testing)
.\gradlew assembleDebug

# OR build release APK (optimized, for production)
.\gradlew assembleRelease

cd ..
```

**Output APK location:**
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

- [ ] APK file was created
- [ ] APK file is not 0 bytes

---

### Phase 4: Build APK (Easier: Using Android Studio GUI)

```powershell
# Open Android Studio with your project
npx cap open android

# Android Studio will open automatically
```

**In Android Studio:**

1. Wait for project to load (5-10 seconds)
2. Click menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for build to complete (2-5 minutes)
4. Look for notification: "Build Successful"
5. Click "Locate" in notification to find APK

- [ ] Android Studio opened
- [ ] Build succeeded
- [ ] APK file found

---

### Phase 5: Test on Device/Emulator (Optional)

**Using Android Emulator:**
```powershell
npx cap run android
```
App will automatically install and launch on emulator.

**Using Connected Android Phone:**
```powershell
# Enable USB debugging on phone first
# Connect phone to computer

npx cap run android
```

**Manual Installation:**
```powershell
# Replace with your APK path
adb install -r 'android\app\build\outputs\apk\debug\app-debug.apk'
```

- [ ] APK installed successfully
- [ ] App launches without crashes
- [ ] App functions correctly

---

## 📁 Final APK Location

After successful build, your APK file will be at:

**Debug APK (For Testing):**
```
C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner\
  android\app\build\outputs\apk\debug\app-debug.apk
```

**Release APK (For Distribution):**
```
C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner\
  android\app\build\outputs\apk\release\app-release.apk
```

---

## 🐛 Troubleshooting

### Problem: "Android SDK not found"
**Solution:**
1. Set environment variable:
   ```
   ANDROID_SDK_ROOT = C:\Users\Ganesh Vasanth\AppData\Local\Android\Sdk
   ```
2. Restart terminal/IDE

### Problem: "Java not found"
**Solution:**
1. Install Java JDK from: https://www.oracle.com/java/technologies/downloads/
2. Set environment variable:
   ```
   JAVA_HOME = C:\Program Files\Java\jdk-11
   ```
3. Restart terminal

### Problem: "npm: Permission denied"
**Solution:** Use Node.js command prompt instead of PowerShell, or:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problem: Gradle build fails
**Solution:**
```powershell
cd android
.\gradlew clean
.\gradlew assembleDebug
cd ..
```

### Problem: APK is too large (> 100 MB)
**Solution:**
1. Enable minification in build:
   ```
   ng build --optimization
   ```
2. Remove unused dependencies:
   ```
   npm prune --production
   ```

### Problem: App crashes on startup
**Check:**
- All environment variables are set correctly
- Built Angular app successfully (`npm run build`)
- API endpoints are reachable from mobile
- CORS is configured properly

---

## 📊 Build File Sizes (Expected)

| Type | Size | Use Case |
|---|---|---|
| Debug APK | 20-50 MB | Development & Testing |
| Release APK | 15-40 MB | Production Release |
| Release Bundle | 10-20 MB | Google Play Store |

---

## 📦 What's Included in APK

✅ All your Angular code (compiled)  
✅ All assets and resources  
✅ Capacitor framework (native bridge)  
✅ Android runtime  
✅ API access (HTTP/HTTPS)  

---

## 🔐 Before Google Play Release

- [ ] Update version in `package.json`
- [ ] Update app name in `capacitor.config.ts`
- [ ] Remove all debug logs/console.log statements
- [ ] Enable ProGuard minification
- [ ] Sign APK with release key
- [ ] Add privacy policy
- [ ] Add app icon and splash screen
- [ ] Test on multiple Android versions
- [ ] Verify all features work on actual device

---

## ⏱️ Time Estimates

| Task | Time |
|---|---|
| Prerequisites install | 20-30 min |
| Capacitor setup | 5-10 min |
| Build Angular app | 3-5 min |
| Build APK (first time) | 5-10 min |
| Build APK (subsequent) | 2-3 min |
| Test on device | 2-5 min |
| **Total (First Time)** | **35-60 min** |

---

## 🆘 Need Help?

1. Check: **APK_GENERATION_GUIDE.md** (detailed guide)
2. Check: Capacitor Docs (https://capacitorjs.com/docs)
3. Check: Android Studio Help (F1 key)
4. Check: Gradle output for specific errors

---

## ✅ Quick Verification Commands

```powershell
# Check Android SDK
echo $env:ANDROID_SDK_ROOT

# Check Java
java -version
javac -version

# Check Node.js
node --version
npm --version

# Check if Capacitor is installed
npm list @capacitor/core

# Check if Android platform is added
ls android

# Check APK exists
ls 'android\app\build\outputs\apk\debug'
```

---

**Ready to build?** Start with **Phase 1** and work through each phase in order. Good luck! 🚀

