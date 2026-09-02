# ☕ FIX: Java Not Found - Installation Guide

## Problem

```
ERROR: Java not found
```

This means Java (JDK) is not installed or not accessible from Command Prompt.

---

## ✅ Solution: Install Java

### Step 1: Download Java

Go to: **https://www.oracle.com/java/technologies/downloads/**

**Install Java 11, 17, or 21** (recommended: Java 11 or 17)

Choose: **Windows x64 Installer** (for 64-bit Windows)

---

### Step 2: Run Java Installer

1. Download the `.exe` file
2. Double-click to open installer
3. Click "Next" and follow the wizard
4. Click "Install"
5. Click "Finish" when done

**Default install location:** `C:\Program Files\Java\jdk-11.x.x` (or similar)

---

### Step 3: Set JAVA_HOME Environment Variable

#### Method A: Using Command Prompt (Easiest)

Open **Command Prompt** (as Administrator) and run:

```cmd
setx JAVA_HOME "C:\Program Files\Java\jdk-11.0.x"
setx PATH "%PATH%;%JAVA_HOME%\bin"
```

**Note:** Replace `jdk-11.0.x` with your actual Java version number!

#### Method B: Manual (Windows GUI)

1. **Find Java Installation Path:**
   - Open: `C:\Program Files\Java\`
   - You should see folder like: `jdk-11.x.x` or `jdk-17.x.x`
   - Copy the full path

2. **Set JAVA_HOME:**
   - Press: `Windows Key + Pause` (System Properties)
   - Click: "Advanced system settings"
   - Click: "Environment Variables"
   - Click: "New..." (under User variables)
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Java\jdk-11.0.x`
   - Click: "OK"

3. **Add to PATH:**
   - Click: "Edit..." (PATH variable)
   - Click: "New"
   - Add: `%JAVA_HOME%\bin`
   - Click: "OK"

---

### Step 4: Verify Installation

Close and reopen **Command Prompt**, then run:

```cmd
java -version
javac -version
```

**Success if you see:**
```
java version "11.0.x" 2021-04-20 LTS
Java(TM) SE Runtime Environment 18.9 (build 11.0.x_x)
Java HotSpot(TM) 64-Bit Server VM 18.9 (build 11.0.x_x, mixed mode)
```

---

### Step 5: Try Building Again

```cmd
cd C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner\
build-apk-simple.bat
```

---

## 🆘 Still Getting Error?

### If "java command not found" after installation:

```cmd
REM Close and reopen Command Prompt completely

REM Then verify:
echo %JAVA_HOME%
REM Should show: C:\Program Files\Java\jdk-11.0.x

REM If empty, JAVA_HOME not set. Do step 3 again.
```

### If installed but can't find it:

```cmd
REM Search for Java folder
dir "C:\Program Files\Java"

REM Should show folder like: jdk-11.0.20 or jdk-17.0.x
REM Copy the exact folder name and use in JAVA_HOME
```

### Wrong version installed?

```cmd
REM Check current Java version
java -version

REM If shows Java 8 or older, uninstall and install Java 11+
REM Android Gradle requires Java 11 or later
```

---

## 📋 Full Checklist

After installing Java:

- [ ] Downloaded Java 11+ from oracle.com
- [ ] Ran installer and completed installation
- [ ] Set JAVA_HOME environment variable
- [ ] Added %JAVA_HOME%\bin to PATH
- [ ] Closed and reopened Command Prompt
- [ ] Ran `java -version` and saw version number
- [ ] Ran `build-apk-simple.bat` successfully

---

## 🎯 Quick References

### Common Java Installation Paths

```
C:\Program Files\Java\jdk-11.0.20
C:\Program Files\Java\jdk-17.0.8
C:\Program Files\Java\jdk-21.0.1
```

### Check What's Installed

```cmd
dir "C:\Program Files\Java"
```

### Unset and Reset (if needed)

```cmd
REM Delete existing JAVA_HOME
setx JAVA_HOME ""

REM Set new one
setx JAVA_HOME "C:\Program Files\Java\jdk-11.0.x"

REM Verify
echo %JAVA_HOME%
```

---

## ✅ Success Indicators

After Windows restarts or you open new Command Prompt:

```cmd
C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner> java -version
java version "11.0.20" 2023-01-17 LTS
Java(TM) SE Runtime Environment 18.9 (build 11.0.20+8-LTS-106)
Java HotSpot(TM) 64-Bit Server VM 18.9 (build 11.0.20+8-LTS-106, mixed mode)

C:\Users\Ganesh Vasanth\source\repos\CryptoCurrencyScanner> build-apk-simple.bat
[1] Checking prerequisites...
[✓] Prerequisites OK
[2] Building Angular...
```

---

## 🚀 Then Return to Building

Once Java is confirmed working:

```cmd
build-apk-simple.bat
```

Your APK will build successfully! 🎉

---

## 📞 Alternative Solutions

### If Oracle Java Won't Install

- **Eclipse Temurin (Free):** https://adoptium.net/
- **Amazon Corretto (Free):** https://aws.amazon.com/corretto/
- **OpenJDK (Free):** https://openjdk.org/

All work the same way - just set JAVA_HOME to their installation path.

---

## ⏭️ Next Steps

1. **Install Java 11 or later** (from link above)
2. **Set JAVA_HOME environment variable**
3. **Close & reopen Command Prompt**
4. **Run:** `java -version` to verify
5. **Run:** `build-apk-simple.bat` to build APK

---

**After installing Java, you're ready to build your APK!** ☕✨
