# 🖱️ HOW TO USE THE BATCH FILES

## Windows Command Prompt / PowerShell

All batch files run from **Command Prompt** or **PowerShell** on Windows.

---

## 📍 Step 1: Navigate to Project Folder

Open Command Prompt or PowerShell and navigate to your project:

```batch
REM In Command Prompt
cd C:\Users\YourName\source\repos\CryptoCurrencyScanner\

REM You should see files like:
REM   build-apk-simple.bat
REM   create-keystore.bat
REM   install-apk.bat
REM   package.json
REM   angular.json
REM   capacitor.config.ts
```

Or simply:
1. Open Windows Explorer
2. Navigate to project folder
3. Right-click in empty space
4. Click "Open PowerShell window here" or "Open Command Prompt window here"

---

## 🎯 Step 2: Choose Your Command

### FOR FIRST TIME SETUP (One-time only)

```batch
create-keystore.bat
```

This creates the signing key for releasing to Google Play Store. Answer the questions:
- First and Last Name: **Your Name**
- Organization Unit: **Development**
- Organization Name: **Your Company**
- City/Locality: **San Francisco**
- State/Province: **California**
- Country (2-letter): **US**

Press Enter to accept defaults for any field.

---

### FOR BUILDING DEBUG APK (Most Common)

```batch
build-apk-simple.bat
```

Just run and wait 6-8 minutes. You'll see:

```
[1] Checking prerequisites...
[✓] Prerequisites OK

[2] Building Angular...
[! Many lines of build output...]
[✓] Angular build complete

[3] Syncing to Android...
[✓] Capacitor sync complete

[4] Building APK...
[! Many lines of gradle output...]
[✓] Gradle build complete

BUILD SUCCESSFUL!
APK Location: android\app\build\outputs\apk\debug\app-debug.apk
```

---

### FOR INSTALLING ON DEVICE

```batch
install-apk.bat
```

You'll see:

```
[1] Checking Android SDK...
[✓] Android SDK found

[2] Connected devices:
List of your Android devices...

[3] Checking for APK...
[✓] APK found: app-debug.apk

[4] Installing APK...
Success

Do you want to launch the app now? (y/n): 
```

Type `y` and press Enter to launch the app on your phone!

---

## 🎮 Complete Workflow

### First Time Ever

```batch
REM 1. Create signing key (one-time)
create-keystore.bat

REM 2. Build the APK
build-apk-simple.bat

REM 3. Install on phone
install-apk.bat

REM 4. App should launch!
```

### Subsequent Builds

```batch
REM 1. Build APK
build-apk-simple.bat

REM 2. Install on phone
install-apk.bat
```

---

## 📋 What Each File Does

### build-apk-simple.bat

**For:** Building APK for testing

**Run:**
```batch
build-apk-simple.bat
```

**Output:**
```
✓ Android production build
✓ Synced to Android project
✓ Created app-debug.apk (20-30 MB)
✓ Location: android\app\build\outputs\apk\debug\app-debug.apk
```

**Time:** 6-8 minutes (first) | 3-4 minutes (after)

---

### build-debug-apk.bat

**For:** Building with more options

**Run:**
```batch
REM Debug build
build-debug-apk.bat

REM Or release build
build-debug-apk.bat release

REM Or clean rebuild
build-debug-apk.bat clean
```

**Output:**
Same as simple, but with more detailed progress

---

### create-keystore.bat

**For:** Creating signing certificate

**Run:**
```batch
create-keystore.bat
```

**Output:**
```
✓ Created release.keystore file
✓ Ready to build release APKs
```

**Important:**
- Only run **once**
- Keeps the `release.keystore` file safe
- You'll need it for all future app updates

---

### build-release-apk.bat

**For:** Building for Google Play Store

**Run:**
```batch
build-release-apk.bat
```

**Output:**
```
✓ Created app-release.apk (15-20 MB)
✓ Signed with your keystore
✓ Ready to upload to Play Store
✓ Location: android\app\build\outputs\apk\release\app-release.apk
```

**Requires:**
- `create-keystore.bat` run first

---

### install-apk.bat

**For:** Installing on phone or emulator

**Run:**
```batch
install-apk.bat
```

**Output:**
```
✓ Installs app on connected phone
✓ Asks if you want to launch
✓ Launches app if you say yes
✓ Shows live logs
```

**Requires:**
- Phone connected via USB
- USB Debugging enabled on phone

---

## 🎯 Real Examples

### Example 1: I Just Cloned the Project

```batch
REM Step 1: Setup keystore (one-time)
create-keystore.bat

REM Step 2: Build APK
build-apk-simple.bat

REM Step 3: Install on phone
install-apk.bat

REM Done! App should run on your phone now.
```

### Example 2: I Made Code Changes

```batch
REM Step 1: Rebuild APK
build-apk-simple.bat

REM Step 2: Reinstall on phone
install-apk.bat

REM Done! Phone has latest version.
```

### Example 3: I Want to Submit to Play Store

```batch
REM Step 1: Make sure you have keystore
REM         (if not, run: create-keystore.bat)

REM Step 2: Build release version
build-release-apk.bat

REM Step 3: Test on phone
install-apk.bat

REM Step 4: Upload to Google Play Console
REM         https://play.google.com/console
REM         Upload: android\app\build\outputs\apk\release\app-release.apk
```

---

## 🖥️ Screen Capture of Commands

### Opening Command Prompt in Project Folder

```
File Explorer
│
├─ Navigate to: C:\Users\YourName\source\repos\CryptoCurrencyScanner\
│
├─ Right-click in empty space
│
├─ Select: "Open PowerShell window here"
│  (or "Open Command Prompt window here")
│
└─ Copy-paste the command you want to run
```

### Running build-apk-simple.bat

```
PowerShell / Command Prompt
│
├─ C:\...\CryptoCurrencyScanner> build-apk-simple.bat
│  (or: .\build-apk-simple.bat)
│
├─ Press Enter
│
└─ Watch the build progress for 6-8 minutes
   (Keep the window open!)
```

---

## ⚠️ Common Issues When Running

### "File not found"

```batch
# Problem: You're in the wrong folder
# Solution: Make sure you're in project root

# Check current folder
cd

# Should show: C:\Users\...\CryptoCurrencyScanner

# If not, navigate there
cd C:\Users\YourName\source\repos\CryptoCurrencyScanner

# Then run the batch file
build-apk-simple.bat
```

### "Java not found"

```batch
# Problem: Java is not installed or not in PATH
# Solution: Install Java 11 or later

# Check if Java is installed
java -version

# If "not found", download from:
# https://www.oracle.com/java/technologies/downloads/
```

### "npm not found"

```batch
# Problem: Node.js is not installed
# Solution: Install Node.js

# Check if installed
npm --version

# If "not found", download from:
# https://nodejs.org/
```

---

## 📱 Connecting Your Phone

### Enable USB Debugging

1. On your phone: Settings > About phone
2. Scroll down and tap "Build number" 7 times
3. Go back and open "Developer options"
4. Enable "USB Debugging"
5. Accept USB debugging authorization on phone

### Check Device Connected

```batch
adb devices

# Should show:
# List of attached devices
# YourPhoneModel              device
```

---

## 🔄 Typical Development Loop

```
Loop (repeat daily):

1. Make code changes
   ├─ Edit TypeScript files
   ├─ Save changes

2. Rebuild APK
   ├─ Run: build-apk-simple.bat
   ├─ Wait 3-4 minutes

3. Install on phone
   ├─ Run: install-apk.bat
   ├─ App launches on phone

4. Test on phone
   ├─ Tap buttons
   ├─ Check functionality
   ├─ If broken, go to step 1

5. Repeat tomorrow!
```

---

## 📊 Progress Indicators

When you see these, the build is working:

```
✓ Checking prerequisites...       ← Prerequisites found
✓ Prerequisites OK                ← Ready to build

✓ Installing npm dependencies    ← Downloading packages
✓ Dependencies installed         ← Packages ready

✓ Building Angular               ← Compiling TypeScript
✓ Angular build complete         ← Angular done

✓ Syncing to Android             ← Copying files
✓ Capacitor sync complete        ← Android updated

✓ Building APK                   ← Creating APK
✓ Gradle build complete          ← APK created

✓ APK file found                 ← Success!
BUILD SUCCESSFUL!                ← All done!
```

---

## ❌ Error Indicators

If you see these, something went wrong:

```
[ERROR] [!] [×]                  ← Error occurred
BUILD FAILED                      ← Build unsuccessful
FAILURE                          ← Process failed
Could not find...                ← Missing file/tool
Java compilation error           ← Code problem
```

**What to do:**
1. Read the error message
2. Scroll up to see what failed
3. Check TROUBLESHOOTING.md
4. Run `build-debug-apk.bat clean` to clean and retry

---

## 🎁 Batch File Features

### They All Include

✅ Prerequisite checking  
✅ Step-by-step progress  
✅ Error detection  
✅ Helpful error messages  
✅ Next steps guidance  
✅ File size reporting  

### They Automate

- npm install
- Angular build (ng build --prod)
- Capacitor sync (npx cap sync android)
- Gradle clean (./gradlew clean)
- Gradle build (./gradlew assembleDebug)
- APK verification
- File copying and management

---

## 💡 Tips for Success

1. **Keep Command Prompt/PowerShell window open**
   - Don't close it while build is running
   - It might take 6-8 minutes, be patient!

2. **Check for errors before proceeding**
   - Look for red "ERROR" text
   - Read the error message carefully
   - Don't ignore warnings

3. **Use clean rebuild if stuck**
   ```batch
   build-debug-apk.bat clean
   build-apk-simple.bat
   ```

4. **Backup your keystore**
   - After `create-keystore.bat`, copy `release.keystore`
   - Save it in multiple safe locations
   - You'll need it for all future releases

5. **Check phone connectivity**
   ```batch
   adb devices
   # Should list your phone
   ```

---

## 🎯 Quick Decision Tree

```
Do you want to...?

├─ Build APK for testing?
│  └─ Run: build-apk-simple.bat
│
├─ Build with more options?
│  └─ Run: build-debug-apk.bat
│
├─ Setup signing (first time)?
│  └─ Run: create-keystore.bat
│
├─ Build for Play Store?
│  └─ Run: build-release-apk.bat
│
├─ Install on phone?
│  └─ Run: install-apk.bat
│
└─ Clean everything and start over?
   └─ Run: build-debug-apk.bat clean
```

---

## ✨ Success Workflow

```
START HERE
    ↓
Connect phone via USB
    ↓
Open Command Prompt in project folder
    ↓
First time? Run: create-keystore.bat
    ↓
Run: build-apk-simple.bat
    ↓
Wait 6-8 minutes
    ↓
See "BUILD SUCCESSFUL!"
    ↓
Run: install-apk.bat
    ↓
App launches on phone!
    ↓
🎉 SUCCESS!
```

---

## 📞 Troubleshooting Quick Links

| Issue | Fix |
|-------|-----|
| Build fails | See TROUBLESHOOTING.md |
| Device not found | See TROUBLESHOOTING.md |
| App crashes | See TROUBLESHOOTING.md |
| Java/npm not found | See TROUBLESHOOTING.md |
| APK not created | See TROUBLESHOOTING.md |

---

**Ready to build?** 

Open Command Prompt and type:
```batch
build-apk-simple.bat
```

Press Enter and let it run! 🚀
