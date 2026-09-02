# Mobile APK Build & Debug Instructions

## 🚀 Quick Start

### 1. Build APK (Choose One)

**Windows CMD (No permission issues):**
```cmd
build-mobile-debug.cmd
```

**PowerShell (If enabled):**
```powershell
.\build-mobile-debug.ps1
```

**Legacy scripts (Still available):**
```cmd
.\build-apk.ps1
.\build-simple.ps1
```

### 2. Output

✅ **CryptoScanner-Debug.apk** - Ready to install

## 📱 Install & Debug

1. **Transfer APK** to your Android phone
2. **Install** (enable "Install from unknown sources" if needed)
3. **Open app**
4. **Tap Debug (🔧)** in menu
5. **Run test buttons**:
   - Test Config
   - Test Products  
   - Test Positions
6. **Check logs** for errors

## 🔍 What the Debug Page Does

### Real-Time Monitoring
- ✅ Shows every API call
- ✅ Displays config loading
- ✅ Captures all errors
- ✅ System information
- ✅ Copy logs feature

### Interactive Tests
- **Test Config**: Verifies `/assets/config.json` loads
- **Test Products**: Tests public API (no auth needed)
- **Test Positions**: Tests authenticated API with your keys

### Example Success Output
```
✅ Test Config: SUCCESS
   - API Key: abc123...
   - Base URL: https://api.india.delta.exchange

✅ Test Products: SUCCESS
   - Count: 152 products

✅ Test Positions: SUCCESS
   - Count: 3 positions
```

### Example Failure Output
```
❌ Test Config: FAILED
   - Error: 404 Not Found
   - Fix: Rebuild APK (config not in assets)

❌ Test Positions: FAILED
   - Error: 401 Unauthorized
   - Fix: Update API keys in config
```

## 🛠️ Troubleshooting

### Issue: PowerShell script blocked

**Error:**
```
running scripts is disabled on this system
```

**Solution:**
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# OR just use CMD script instead
build-mobile-debug.cmd
```

### Issue: Scanner/Positions empty on mobile

**Debug Steps:**
1. Open Debug page (🔧)
2. Click "Test Config" → Must be **SUCCESS**
3. Click "Test Products" → Must be **SUCCESS**
4. Click "Test Positions" → Check result
5. Read logs for actual error

**Common Causes:**
- Config file missing (404 in logs)
- Invalid API keys (401 in logs)
- Network blocked (timeout in logs)
- No data available (empty response)

### Issue: Config not found

**Fix:**
1. Verify `src/assets/config.json` exists
2. Check `angular.json` includes:
```json
"assets": [
  "public",
  "src/assets"  ← Must be here
]
```
3. Rebuild APK

### Issue: API errors

**Fix:**
1. Get valid credentials from Delta Exchange
2. Update `src/assets/config.json`:
```json
{
  "delta": {
    "apiKey": "YOUR_REAL_API_KEY",
    "apiSecret": "YOUR_REAL_API_SECRET",
    "baseUrl": "https://api.india.delta.exchange",
    "usdToInr": 85
  }
}
```
3. Rebuild APK
4. Reinstall

## 📋 Files Created/Modified

### New Files
- ✅ `src/app/core/services/mobile-debug.service.ts` - Debug logging
- ✅ `src/app/features/debug/debug.component.ts` - Debug UI
- ✅ `android/app/src/main/res/xml/network_security_config.xml` - Network config
- ✅ `build-mobile-debug.cmd` - CMD build script
- ✅ `build-mobile-debug.ps1` - PowerShell build script
- ✅ `MOBILE_TROUBLESHOOTING.md` - Detailed guide
- ✅ `MOBILE_FIX_README.md` - Quick reference

### Modified Files
- ✅ `src/app/core/services/delta.service.ts` - Added debug logs
- ✅ `src/app/app-routing-module.ts` - Added /debug route
- ✅ `src/app/shared/components/nav-menu/nav-menu.component.html` - Added Debug link
- ✅ `android/app/src/main/AndroidManifest.xml` - Network permissions

## 🎯 Success Checklist

After installing new APK:

- [ ] App opens without crashing
- [ ] Navigation menu shows Scanner, Positions, Debug
- [ ] Debug page opens
- [ ] Test Config button shows SUCCESS
- [ ] Test Products button shows SUCCESS with count
- [ ] Test Positions button shows result (may be 0)
- [ ] Logs visible in Debug page
- [ ] Scanner page loads (may be empty if no signals)
- [ ] Positions page loads (may be empty if no positions)

## 📞 Getting Help

If issues persist:

1. Open Debug page
2. Run all test buttons
3. Click **Copy All** logs
4. Share logs showing:
   - What you clicked
   - What error appeared
   - Full log output

## 🔄 Rebuild When

You need to rebuild APK if you change:
- API credentials in `config.json`
- Any TypeScript/HTML code
- Android configuration

You DON'T need to rebuild for:
- Nothing - config is baked into APK
- (Previously config was editable, but now it's compiled in)

## 📚 Documentation

- **MOBILE_TROUBLESHOOTING.md** - Detailed debugging guide
- **MOBILE_FIX_README.md** - Overview of fixes
- **CONFIGURATION_GUIDE.md** - Original setup guide
- This file - Quick reference

## 🎉 What's Fixed

1. ✅ **Network Security** - Delta API calls now allowed
2. ✅ **Cleartext Traffic** - HTTP/HTTPS properly configured
3. ✅ **Debug Console** - Real-time monitoring
4. ✅ **Test Buttons** - Quick diagnostics
5. ✅ **Enhanced Logging** - Every operation tracked
6. ✅ **Build Scripts** - Multiple options (CMD/PS1)
7. ✅ **Documentation** - Comprehensive guides

The app now has full visibility into what's happening on mobile!
