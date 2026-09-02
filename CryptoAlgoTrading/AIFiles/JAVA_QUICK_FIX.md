# ☕ JAVA NOT FOUND - QUICK FIX GUIDE

## ⚡ FASTEST FIX (2 Steps)

### Step 1: Download & Install Java

Click here: **https://www.oracle.com/java/technologies/downloads/**

Choose: **Windows x64 Installer** (for 64-bit Windows)

Run the installer and click "Next" → "Install" → "Finish"

### Step 2: Set JAVA_HOME

Open **Command Prompt (as Administrator)** and run:

```cmd
setx JAVA_HOME "C:\Program Files\Java\jdk-11.0.x"
```

**Replace `jdk-11.0.x` with your actual Java version** (check `C:\Program Files\Java\` folder)

**Then close Command Prompt and open a new one**

### Done! Now Run:

```cmd
build-apk-simple.bat
```

---

## 🖥️ DETAILED STEPS

### Step 1A: Download Java

1. Go to: https://www.oracle.com/java/technologies/downloads/
2. Choose: **Windows x64 Installer**
3. Download the `.exe` file
4. Open File Explorer → Downloads
5. Double-click the downloaded file

### Step 1B: Install Java

1. Installer opens
2. Click **"Next"**
3. Click **"Install"**
4. Wait for installation (~1-2 minutes)
5. Click **"Finish"**

**Java should now be installed in:** `C:\Program Files\Java\jdk-11.x.x`

### Step 2A: Find Your Java Folder

Open File Explorer and go to: `C:\Program Files\Java\`

You should see a folder like:
- `jdk-11.0.20`
- `jdk-17.0.8`
- `jdk-21.0.1`

**Copy the exact folder name**

### Step 2B: Set JAVA_HOME

1. Press: **Windows Key + R**
2. Type: `cmd`
3. Press: **Ctrl + Shift + Enter** (run as Administrator)
4. Copy-paste this command:

```cmd
setx JAVA_HOME "C:\Program Files\Java\jdk-11.0.20"
```

**Replace `jdk-11.0.20` with your actual folder name!**

5. Press **Enter**
6. Wait for success message
7. **IMPORTANT: Close Command Prompt completely**
8. Open Command Prompt again (new window)

### Step 2C: Verify It Works

```cmd
java -version
```

Should show something like:
```
java version "11.0.20" 2023-01-17 LTS
```

If you see this → **You're done!** ✓

### Step 3: Build Your APK

```cmd
cd C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner\
build-apk-simple.bat
```

---

## 🆘 TROUBLESHOOTING

### "Still says Java not found"

**Solution:**
1. Close Command Prompt completely
2. Open a **NEW** Command Prompt
3. Run: `echo %JAVA_HOME%`
4. Should show your Java path
5. If empty → Do Step 2B again

### "Can't find Java folder"

**Solution:**
1. Open File Explorer
2. Go to: `C:\Program Files\`
3. Look for a folder starting with `jdk-`
4. If not there, Java didn't install correctly
5. Uninstall and reinstall from oracle.com

### "Permission denied when setting JAVA_HOME"

**Solution:**
1. Right-click Command Prompt
2. Click "Run as Administrator"
3. Run the command again

### "Wrong Java version"

You need **Java 11 or later**. If you have Java 8:
1. Uninstall the old Java
2. Install Java 11+ from oracle.com
3. Set JAVA_HOME to the new version

---

## 🔧 ALTERNATIVE: Use fix-java.bat

I created a helper script for this:

```cmd
fix-java.bat
```

It will:
- Check if Java is installed
- Help you find your Java folder
- Automatically set JAVA_HOME
- Verify it works

---

## ✅ SUCCESS CHECKLIST

- [ ] Downloaded Java from oracle.com
- [ ] Installed Java (ran installer)
- [ ] Found Java folder in `C:\Program Files\Java\`
- [ ] Set JAVA_HOME environment variable
- [ ] Closed and reopened Command Prompt
- [ ] Ran `java -version` and saw version
- [ ] Ready to run `build-apk-simple.bat`

---

## 📚 JAVA VERSIONS SUPPORTED

All work fine for building APK:
- **Java 11** (LTS) ✅
- **Java 17** (LTS) ✅
- **Java 21** (LTS) ✅

Older versions (Java 8, 9, 10) won't work with Android Gradle.

---

## 🚀 AFTER JAVA IS INSTALLED

```cmd
REM Navigate to your project
cd C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner\

REM Build APK
build-apk-simple.bat

REM Wait 6-8 minutes
REM See "BUILD SUCCESSFUL!"
REM APK created!
```

---

## 💡 QUICK REFERENCE

| What | Command |
|------|---------|
| Check Java version | `java -version` |
| Check JAVA_HOME | `echo %JAVA_HOME%` |
| Set JAVA_HOME | `setx JAVA_HOME "C:\Program Files\Java\jdk-11.0.x"` |
| See Java location | `where java` |
| Open Java downloads | Visit: https://www.oracle.com/java/technologies/downloads/ |

---

## 🎯 NEXT STEPS

1. **Install Java** (5 minutes)
2. **Set JAVA_HOME** (1 minute)
3. **Run build-apk-simple.bat** (8 minutes)
4. **Install app on phone** (1 minute)
5. **Done!** ✓

---

**Everything else is already set up. Just install Java and you'll be good to go!** ☕🚀
