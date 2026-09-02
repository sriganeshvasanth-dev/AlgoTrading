# Copy-Paste Commands for APK Generation

## ⚠️ Prerequisites First!

Before running any commands, you MUST have:
1. ✅ Android Studio installed
2. ✅ Java JDK installed  
3. ✅ Node.js & npm installed

---

## 🚀 Command Sequence (Copy & Paste)

### Step 1: Navigate to Project

```powershell
cd 'C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner\'
```

---

### Step 2: Build Angular App

```powershell
npm run build
```

Wait for build to complete. You should see a `dist/` folder.

---

### Step 3: Install Capacitor (ONE TIME ONLY)

```powershell
npm install @capacitor/core
npm install --save-dev @capacitor/cli
npm install @capacitor/android
```

---

### Step 4: Initialize Capacitor (ONE TIME ONLY)

```powershell
npx cap init
```

When prompted, enter:
- App name: `CryptoCurrencyScanner`
- App Package ID: `com.cryptoscanner.app`
- Web Directory: `dist`

---

### Step 5: Add Android Platform (ONE TIME ONLY)

```powershell
npx cap add android
```

This creates the `android/` folder.

---

### Step 6: Sync Files (RUN AFTER EVERY BUILD)

```powershell
npx cap sync android
```

---

### Step 7: Build APK

**Option A: Using Android Studio (Recommended)**

```powershell
npx cap open android
```

Then in Android Studio:
- Build > Build Bundle(s) / APK(s) > Build APK(s)
- Wait 2-5 minutes
- Look for success notification

**OR Option B: Using Gradle Command**

```powershell
cd android
.\gradlew assembleDebug
cd ..
```

---

## 🔄 After First Setup (Repeat These Steps)

Every time you change your Angular code:

```powershell
# 1. Build updated Angular app
npm run build

# 2. Sync changes to Android
npx cap sync android

# 3. Build new APK
cd android
.\gradlew assembleDebug
cd ..

# 4. Find your APK at:
# android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 📱 Test APK on Device

### Before: Enable USB Debugging
1. On Android phone: Settings > About > Tap Build Number 7 times
2. Copy and paste this into terminal:

```powershell
# Install APK on connected phone
adb install -r 'android\app\build\outputs\apk\debug\app-debug.apk'
```

### OR: Auto-Install with Capacitor

```powershell
npx cap run android
```

---

## 🎯 Key File Locations

Keep these bookmarked:

```
📁 APK Output:
   android\app\build\outputs\apk\debug\app-debug.apk

📁 APK Output (Release):
   android\app\build\outputs\apk\release\app-release.apk

📄 Capacitor Config:
   capacitor.config.ts

📁 Android Project:
   android\

📁 Web App Build Output:
   dist\
```

---

## ⚡ Quick Reference: What Each Command Does

| Command | What it does | When to run |
|---------|-------------|------------|
| `npm run build` | Builds Angular→JavaScript | After code changes |
| `npx cap init` | Creates Capacitor config | Once, at setup |
| `npx cap add android` | Creates Android project | Once, at setup |
| `npx cap sync android` | Copies web→Android folder | After every `npm run build` |
| `npx cap open android` | Opens Android Studio | When you want GUI |
| `.\gradlew assembleDebug` | Builds APK file | To create APK |
| `adb install` | Installs APK on phone | To test on device |
| `npx cap run android` | Build + Install + Run | Quick test workflow |

---

## 🔧 Environment Setup (If Needed)

If you get "Android SDK not found" or similar errors:

```powershell
# Set Android SDK path
$env:ANDROID_SDK_ROOT = 'C:\Users\Ganesh Vasanth\AppData\Local\Android\Sdk'

# Set Java path
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-11.0.x'

# Verify
echo $env:ANDROID_SDK_ROOT
echo $env:JAVA_HOME
```

---

## 🚨 Common Errors & Fixes

### Error: "gradle: command not found"
```powershell
# You're in wrong directory. Should be in android/ folder
cd android
.\gradlew assembleDebug
```

### Error: "SDK location not found"
```powershell
# Set environment variable
$env:ANDROID_SDK_ROOT = 'C:\Users\Ganesh Vasanth\AppData\Local\Android\Sdk'

# Then try build again
cd android
.\gradlew assembleDebug
cd ..
```

### Error: "Java not recognized"
```powershell
# Install Java from:
# https://www.oracle.com/java/technologies/downloads/

# Then set path
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-11.0.x'
```

### Error: "npm: command not found"
```powershell
# Reinstall Node.js from:
# https://nodejs.org/

# Verify installation
node --version
npm --version
```

---

## 📊 Expected Output Messages

### Successful Build:
```
> Task :app:assembleDebug
✓ Built the following APK(s):
  - android\app\build\outputs\apk\debug\app-debug.apk
```

### Successful Install:
```
Success
```

### Successful Sync:
```
$ npx cap sync android
✓ Synced Android files
```

---

## 💾 Saving Your APK

```powershell
# Copy APK to a safe location
Copy-Item 'android\app\build\outputs\apk\debug\app-debug.apk' 'C:\Users\Ganesh Vasanth\Downloads\CryptoCurrencyScanner.apk'

# Verify it exists
ls 'C:\Users\Ganesh Vasanth\Downloads\CryptoCurrencyScanner.apk'
```

---

## 📈 Automating the Process

Create a file `build-apk.ps1`:

```powershell
# Clean build
npm run build
npx cap sync android

# Build APK
cd android
.\gradlew assembleDebug
cd ..

# Show results
echo "✓ APK built successfully!"
echo "Location: android\app\build\outputs\apk\debug\app-debug.apk"

# Open file location
explorer.exe "android\app\build\outputs\apk\debug\"
```

Then run: `.\build-apk.ps1`

---

## ✅ One-Time Setup Checklist

Run these commands ONCE at initial setup:

```powershell
cd 'C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner\'
npm install @capacitor/core
npm install --save-dev @capacitor/cli
npm install @capacitor/android
npx cap init
npx cap add android
```

After this, you can skip to **Step 6** for future builds.

---

## 🎯 Most Common Workflow

After making code changes:

```powershell
# 1. Build
npm run build

# 2. Sync (important!)
npx cap sync android

# 3. Build APK
cd android
.\gradlew assembleDebug
cd ..

# 4. Find APK
ls android\app\build\outputs\apk\debug\
```

---

## 📞 Getting Help

If a command fails:
1. Copy the entire error message
2. Check error against section above
3. Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` if PowerShell issues
4. See: **APK_GENERATION_GUIDE.md** for detailed troubleshooting

---

**That's it!** Follow the command sequence in order and you'll have your APK. 🚀

