# ☕ JAVA INSTALLATION - DONE IN 2 STEPS

## Step 1: Download & Install Java (5 minutes)

### Click here: https://www.oracle.com/java/technologies/downloads/

1. Choose: **Windows x64 Installer** (for 64-bit Windows)
2. Download the `.exe` file
3. Open File Explorer → Downloads
4. Double-click the file
5. Click "Next" → "Install" → "Finish"

**Java is now installed! ✓**

---

## Step 2: Automatic Setup (1 minute)

Open Command Prompt in your project folder and run:

```cmd
set-java-path.bat
```

This script will automatically:
1. Find your Java installation
2. Set JAVA_HOME
3. Add Java to PATH

**Then close Command Prompt and open a new one.**

---

## Verify It Works

```cmd
java -version
```

Should show something like:
```
java version "11.0.20" 2023-01-17 LTS
Java(TM) SE Runtime Environment 18.9 (build 11.0.20+8-LTS-106)
```

---

## Now Build Your APK

```cmd
build-apk-simple.bat
```

Done! APK will be built in 6-8 minutes. 🚀

---

## If Automatic Setup Failed

**Manual way (2 commands):**

1. Find Java folder:
   ```cmd
   dir "C:\Program Files\Java"
   ```
   Look for folder like: `jdk-11.0.20` or `jdk-17.0.8`

2. Set JAVA_HOME (replace your folder name):
   ```cmd
   setx JAVA_HOME "C:\Program Files\Java\jdk-11.0.20"
   ```

3. Set PATH:
   ```cmd
   setx PATH "%PATH%;%JAVA_HOME%\bin"
   ```

4. Close and reopen Command Prompt

5. Verify:
   ```cmd
   java -version
   ```

---

## That's It!

Java is installed and configured. Your APK build will work now! ✓

Run: `build-apk-simple.bat`

---

**For more detailed help, see:**
- JAVA_QUICK_FIX.md
- INSTALL_JAVA.md
- JAVA_ERROR_FIX.md
