# 🎯 APK Build Process Visual Flow

## Complete Build Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CRYPTO CURRENCY SCANNER                             │
│                     APK BUILD PIPELINE                                  │
└─────────────────────────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════════════════════╗
║                        STEP 1: BUILD ANGULAR                           ║
║                    npm run build:prod                                  ║
╚════════════════════════════════════════════════════════════════════════╝
    │
    ├─ Compile TypeScript → JavaScript
    ├─ Minify & tree-shake
    ├─ Optimize CSS & assets
    ├─ Generate source maps
    │
    └─ OUTPUT: dist/CryptoCurrencyScanner/browser/
        ├─ index.html
        ├─ main.js (minified)
        ├─ styles.css (optimized)
        └─ assets/

           ⏱️  TIME: 2-3 minutes

╔════════════════════════════════════════════════════════════════════════╗
║                    STEP 2: SYNC TO CAPACITOR                           ║
║                   npx cap sync android                                 ║
╚════════════════════════════════════════════════════════════════════════╝
    │
    ├─ Copy dist/ → android/app/src/main/assets/public/
    ├─ Update capacitor.config
    ├─ Generate Android configuration
    ├─ Update Android dependencies
    │
    └─ OUTPUT: android/
        ├─ app/src/main/assets/public/
        │  └─ [Angular build files]
        └─ build.gradle (updated)

           ⏱️  TIME: 30 seconds

╔════════════════════════════════════════════════════════════════════════╗
║                     STEP 3: BUILD WITH GRADLE                          ║
║              ./gradlew.bat build (or assembleDebug)                    ║
╚════════════════════════════════════════════════════════════════════════╝
    │
    ├─ Compile Java code
    ├─ Link native libraries (Capacitor)
    ├─ Process resources & manifests
    ├─ D8 optimization (or Proguard for release)
    ├─ Package into APK format
    ├─ Create DEX files
    ├─ Align & sign APK
    │
    └─ OUTPUT: android/app/build/outputs/apk/debug/
        └─ app-debug.apk (20-30 MB)

           ⏱️  TIME: 3-5 minutes

╔════════════════════════════════════════════════════════════════════════╗
║                    ✅ APK READY FOR TESTING                            ║
╚════════════════════════════════════════════════════════════════════════╝
    │
    ├─ Install on device: adb install -r app-debug.apk
    ├─ Install on emulator: adb install -r app-debug.apk
    └─ Launch app: adb shell am start -n com.crypto.scanner/.MainActivity

           ✨ TOTAL BUILD TIME: 6-8 minutes
```

---

## File Flow Diagram

```
SOURCE CODE
    │
    ├─ src/
    │   ├─ app/
    │   │   ├─ features/positions/
    │   │   ├─ core/services/
    │   │   └─ ...
    │   └─ assets/
    │
    └─ capacitor.config.ts
    └─ package.json

         ⬇️  npm run build:prod

ANGULAR BUILD
    │
    ├─ dist/CryptoCurrencyScanner/browser/
    │   ├─ index.html
    │   ├─ main.js (minified)
    │   ├─ polyfills.js
    │   ├─ styles.css
    │   └─ assets/
    │
    └─ source maps (.map files)

         ⬇️  npx cap sync android

ANDROID PROJECT
    │
    ├─ android/app/src/main/
    │   ├─ assets/public/
    │   │   ├─ [copied dist files]
    │   │   └─ capacitor.config.json
    │   ├─ java/
    │   │   └─ [Capacitor native code]
    │   └─ AndroidManifest.xml
    │
    └─ android/app/build.gradle (updated)

         ⬇️  ./gradlew.bat build

NATIVE COMPILATION
    │
    ├─ Compile Java to bytecode
    ├─ Link native libraries (Capacitor plugins)
    ├─ Create DEX format (runtime format)
    ├─ Package resources & assets
    ├─ Sign APK
    └─ Align APK (zipalign)

         ⬇️

APK OUTPUT
    │
    └─ android/app/build/outputs/apk/debug/
        └─ app-debug.apk ✅ (Ready to install)
```

---

## Decision Tree: Which Build?

```
                    Do you want APK?
                          │
                ┌─────────┴─────────┐
                │                   │
            FOR TESTING         FOR STORE
                │                   │
                ▼                   ▼
          Build DEBUG          Build RELEASE
            APK                    APK
                │                   │
        npm run build:prod    npm run build:prod
               ⬇                     ⬇
        npx cap sync android  npx cap sync android
               ⬇                     ⬇
        ./gradlew                ./gradlew
        assembleDebug       assembleRelease*
               ⬇                     ⬇
        app-debug.apk      app-release.apk
        20-30 MB           15-20 MB
        (unsigned)         (signed)**
               │                   │
               ▼                   ▼
          Install on device   Submit to
          or emulator         Play Store

        * Requires signing configuration
        ** Requires keystore creation
```

---

## Capacitor Architecture

```
┌─────────────────────────────────────────────┐
│         YOUR ANGULAR APP                    │
│  (TypeScript, Services, Components)         │
└────────────────┬────────────────────────────┘
                 │
                 │ (Web APIs)
                 │
┌────────────────▼────────────────────────────┐
│    CAPACITOR BRIDGE (JavaScript)            │
│  - Communicates web ↔ native                │
│  - Plugin system                            │
└────────────────┬────────────────────────────┘
                 │
                 │ (Native calls)
                 │
┌────────────────▼────────────────────────────┐
│   ANDROID RUNTIME (Java/Kotlin)             │
│  - Android OS APIs                          │
│  - Device hardware access                   │
│  - Gradle build system                      │
└────────────────┬────────────────────────────┘
                 │
                 │
┌────────────────▼────────────────────────────┐
│          APK FILE                           │
│  (Packaged native app)                      │
└─────────────────────────────────────────────┘
```

---

## Environment Setup Map

```
WINDOWS SYSTEM
│
├─ JDK (Java)
│  └─ C:\Program Files\Java\jdk-11.x.x
│     └─ bin/javac.exe
│
├─ Node.js & npm
│  └─ C:\Program Files\nodejs\
│     ├─ node.exe
│     └─ npm.exe
│
├─ Android SDK
│  └─ C:\Users\YourName\AppData\Local\Android\sdk
│     ├─ build-tools/       (Required for APK building)
│     ├─ platforms/         (Required Android APIs)
│     └─ platform-tools/    (adb, fastboot)
│
└─ Environment Variables (PATH)
   ├─ %JAVA_HOME%\bin
   ├─ %ANDROID_HOME%\platform-tools
   └─ %ANDROID_HOME%\tools
```

---

## APK File Structure

```
app-debug.apk
    │
    ├─ AndroidManifest.xml
    │   └─ App permissions, activities, metadata
    │
    ├─ classes.dex
    │   └─ Compiled Java bytecode (DEX format)
    │
    ├─ res/
    │   ├─ layout/        (XML layouts)
    │   ├─ drawable/      (Images, icons)
    │   └─ values/        (Strings, colors, dimensions)
    │
    ├─ assets/
    │   └─ public/        ← YOUR ANGULAR APP (bundled here)
    │       ├─ index.html
    │       ├─ main.js
    │       ├─ styles.css
    │       └─ assets/
    │
    ├─ lib/
    │   └─ armeabi-v7a/   (Native .so libraries for Capacitor)
    │
    ├─ META-INF/
    │   ├─ MANIFEST.MF    (APK metadata)
    │   ├─ CERT.SF        (Signature)
    │   └─ CERT.RSA       (Certificate)
    │
    └─ resources.arsc     (Compiled resources)

Total Size: 20-30 MB (debug) | 15-20 MB (release)
```

---

## What Happens When App Runs

```
1. DEVICE BOOTS
   └─ Android OS loads

2. USER TAPS APP
   └─ Android launches MainActivity

3. CAPACITOR RUNTIME
   ├─ Initializes WebView
   ├─ Loads web content from assets/public/
   ├─ Sets up plugin bridges
   └─ Ready for web app

4. ANGULAR LOADS
   ├─ main.js executes
   ├─ AppComponent initializes
   ├─ Services inject
   └─ UI renders in WebView

5. USER INTERACTION
   ├─ Clicks UI → Angular event handler
   ├─ Service method calls API
   ├─ Server responds
   ├─ Component updates
   └─ UI re-renders

6. NATIVE FEATURES (if needed)
   ├─ JavaScript calls Capacitor plugin
   ├─ Plugin communicates with Java code
   ├─ Java calls Android OS API
   ├─ Returns result to JavaScript
   └─ JavaScript processes result
```

---

## Build Command Equivalents

```
AUTOMATED SCRIPT                 MANUAL COMMANDS
┌──────────────────────┐        ┌──────────────────────────────────┐
│ .\build-apk-quick.ps1│  ===   │ npm run build:prod               │
│                      │        │ npx cap sync android             │
│  (Does all 3 steps)  │        │ cd android                       │
│  Checks prereqs      │        │ .\gradlew.bat build              │
│  Cleans old build    │        │ cd ..                            │
│  Reports results     │        │                                  │
└──────────────────────┘        └──────────────────────────────────┘

Same outcome, different UX.
Script is easier.
Manual gives more visibility.
```

---

## Success Indicators

✅ **After Build:**
- No red errors in console output
- Output shows "BUILD SUCCESSFUL"
- APK file exists and >10 MB

✅ **After Install:**
- `adb install` shows "Success"
- App icon appears on launcher
- App responds to taps

✅ **When Running:**
- App starts without crashing
- UI displays correctly
- API calls work (check adb logcat)
- No "E/" errors in logs

---

## Common Workflow

```
DEVELOPMENT CYCLE

┌─────────────────────────────────┐
│ 1. Edit TypeScript source code  │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ 2. Run: npm run build:prod      │
│                                 │
│    (Angular compiles)           │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ 3. Run: npx cap sync android    │
│                                 │
│    (Copies to Android)          │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ 4. Run: ./gradlew.bat build     │
│                                 │
│    (Creates APK)                │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ 5. Run: adb install -r app.apk  │
│                                 │
│    (Installs to device)         │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ 6. Test app on device           │
│                                 │
│    (See code + UI = working?)   │
└─────────────────────────────────┘
           │
           ▼
    Found bug?
       │    │
      YES  NO (Back to step 1)
       │
       ▼
   Fix code and repeat
```

---

## Performance Milestones

```
⏱️  Build Times (on typical machine)

STEP 1: Angular Build
├─ First run (clean): 3-4 minutes
├─ Incremental: 30 seconds
└─ With optimization: 2 minutes

STEP 2: Capacitor Sync
├─ Normal: 30 seconds
└─ First time: 1 minute

STEP 3: Gradle Build
├─ First run (clean): 5-7 minutes
├─ Incremental: 2-3 minutes
├─ With parallel: 2-3 minutes
└─ Full daemon build: 1-2 minutes

TOTAL: ~6-8 minutes cold | ~3-4 minutes warm
```

---

## Troubleshooting Flowchart

```
                    Build Failed?
                          │
                ┌─────────┼─────────┐
                │         │         │
            Angular?   Capacitor?  Gradle?
               │         │         │
               ▼         ▼         ▼

    Error in      Cannot find    Java/SDK
    TypeScript     capacitor      error
    or build       config or
    files          sync fails
               │         │         │
               ▼         ▼         ▼

    Check:      Check:      Check:
    ├─ src/     ├─ npm install  ├─ JAVA_HOME
    ├─ angular.json ├─ capacitor.config.ts │ ANDROID_HOME
    ├─ npm i    ├─ dist/ exists │ build-tools
    └─ Build    ├─ npx cap init │ Gradle cache
       logs     └─ Rebuild from
               clean git

               │         │         │
               ▼         ▼         ▼

          Try:    Try:       Try:
          npm     npx cap    ./gradlew
          run     sync       clean
          build   android
          :prod

               │         │         │
               ▼         ▼         ▼

            Still failing?
            See: TROUBLESHOOTING.md
```

---

## One-Page Cheat Sheet

```
BUILD QUICK COMMANDS:

1️⃣  Full automated build
    .\build-apk-quick.ps1

2️⃣  Manual build
    npm run build:prod && npx cap sync android && cd android && .\gradlew.bat build && cd ..

3️⃣  Install on device
    adb install -r android/app/build/outputs/apk/debug/app-debug.apk

4️⃣  View logs
    adb logcat | findstr "com.crypto.scanner"

5️⃣  Clean rebuild
    rm dist android\app\build android\.gradle
    npm install
    npm run build:prod
    npx cap sync android
    cd android && .\gradlew.bat clean && .\gradlew.bat build && cd ..

APK Location:  android\app\build\outputs\apk\debug\app-debug.apk ✅
Full Guide:    APK_BUILD_GUIDE.md
Quick Ref:     BUILD_QUICK_REFERENCE.md
Troubleshoot:  TROUBLESHOOTING.md
```

---

**Ready to build? Run:** `.\build-apk-quick.ps1` 🚀
