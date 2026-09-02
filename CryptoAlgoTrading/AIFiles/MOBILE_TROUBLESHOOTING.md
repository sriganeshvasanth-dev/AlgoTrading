# Mobile Troubleshooting Guide

## Quick Diagnostic Steps

### 1. Check PowerShell Execution Policy (If using .ps1 scripts)

If you see "running scripts is disabled" errors:

```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**OR use the CMD script instead:**
```cmd
build-mobile-debug.cmd
```

### 2. Build APK with Debug Features

```cmd
# Use CMD script (no execution policy issues)
build-mobile-debug.cmd

# OR if PowerShell is enabled
.\build-mobile-debug.ps1
```

### 3. Install APK on Mobile

1. Transfer **CryptoScanner-Debug.apk** to your phone
2. Enable "Install from unknown sources" (if needed)
3. Install the APK
4. Open the app

### 4. Access Debug Console

Once the app is open:
1. Tap **Debug** (🔧) in the navigation menu
2. You'll see:
   - **System Info**: Device details, network status
   - **Test Buttons**: Quick diagnostics
   - **Live Logs**: All app activity
   - **Copy Logs**: Share logs for troubleshooting

### 5. Run Diagnostics

Click each button and note the results:

#### Test Config Button
- **SUCCESS**: Config loaded correctly
- **FAILED**: 
  - Check if `/assets/config.json` exists in APK
  - Verify JSON syntax
  - **Fix**: Rebuild APK after fixing config

#### Test Products Button
- **SUCCESS**: API connection works
- **FAILED**:
  - Network connectivity issue
  - API endpoint blocked
  - **Fix**: Check Android network permissions

#### Test Positions Button
- **SUCCESS**: Authentication works
- **FAILED**:
  - Invalid API keys
  - API signature mismatch
  - **Fix**: Update `src/assets/config.json` with correct keys and rebuild

### 6. Common Issues and Solutions

#### Scanner/Positions Show Nothing

**Symptom**: Pages load but no data appears

**Debug Steps**:
1. Go to Debug page
2. Click "Test Config" - Must show SUCCESS
3. Click "Test Products" - Must show SUCCESS with product count
4. Click "Test Positions" - Must show SUCCESS (may be 0 positions)
5. Check logs for errors

**Possible Causes**:
- Config file not loaded (404 error in logs)
- Invalid API credentials (401/403 in logs)
- Network blocked (timeout/connection refused in logs)
- CORS issue (check if using HTTPS)

**Fixes**:

```json
// 1. Verify src/assets/config.json
{
  "delta": {
    "apiKey": "your-actual-api-key",
    "apiSecret": "your-actual-api-secret",
    "baseUrl": "https://api.india.delta.exchange",
    "usdToInr": 85
  }
}
```

```cmd
// 2. Rebuild APK
build-mobile-debug.cmd
```

#### Network Errors (Connection Refused)

**Symptom**: "Failed to fetch" or "Network error" in logs

**Check**:
1. Network security config: `android/app/src/main/res/xml/network_security_config.xml`
2. AndroidManifest.xml has `usesCleartextTraffic="true"`
3. Internet permission enabled

**Already Fixed** in latest build:
- ✅ Network security config created
- ✅ Cleartext traffic allowed
- ✅ Delta API domains whitelisted

#### Config Not Found (404)

**Symptom**: Config test shows 404 error

**Fix**:
1. Check `angular.json` includes `src/assets` in assets array
2. Verify `src/assets/config.json` exists
3. Rebuild:
```cmd
build-mobile-debug.cmd
```

#### API Authentication Fails (401/403)

**Symptom**: Products work but Positions fail with auth error

**Fix**:
1. Get valid API credentials from Delta Exchange
2. Update `src/assets/config.json`
3. Rebuild APK
4. Reinstall on mobile

### 7. Using Chrome DevTools (Advanced)

For deeper debugging:

1. Enable **USB Debugging** on Android
2. Connect phone to PC via USB
3. Open Chrome: `chrome://inspect/#devices`
4. Click **Inspect** on your app
5. View Console, Network, and Application tabs

### 8. Logs Interpretation

```
[timestamp] DeltaService: Loading config from /assets/config.json
  ✅ Good: Config load started

[timestamp] DeltaService: Config loaded
  ✅ Good: Config found

[timestamp] DeltaService: Config applied { baseUrl: ..., hasApiKey: true }
  ✅ Good: Config is valid

[timestamp] DeltaService: Fetching all products
  ✅ Good: API call started

[timestamp] DeltaService: Fetched 150 products
  ✅ Good: Products loaded

[timestamp] ERROR: DeltaService: Failed to load config
  ❌ Bad: Config missing or invalid JSON

[timestamp] ERROR: Config fetch failed: 404 Not Found
  ❌ Bad: Config not in APK assets

[timestamp] ERROR: Products fetch failed: 401 Unauthorized
  ❌ Bad: Invalid API credentials
```

### 9. Share Logs for Help

If issues persist:
1. Open Debug page
2. Run failing test
3. Click **Copy All** button
4. Paste logs in issue report

### 10. Quick Rebuild Checklist

Before rebuilding:
- [ ] Update `src/assets/config.json` with valid keys
- [ ] Verify Angular build succeeds locally
- [ ] Clean old builds (`dist`, `android/app/build`)
- [ ] Run full build script
- [ ] Transfer new APK to phone
- [ ] Uninstall old app first
- [ ] Install new APK
- [ ] Test Debug page

## Files Modified for Mobile Debugging

1. **src/app/core/services/mobile-debug.service.ts** - Debug logging
2. **src/app/core/services/delta.service.ts** - Added debug logs
3. **src/app/features/debug/debug.component.ts** - Debug UI
4. **android/app/src/main/res/xml/network_security_config.xml** - Network permissions
5. **android/app/src/main/AndroidManifest.xml** - Cleartext traffic enabled
6. **build-mobile-debug.cmd** - Build automation

## Success Indicators

When everything works:
- ✅ Config test: SUCCESS with API keys visible
- ✅ Products test: SUCCESS with 100+ products
- ✅ Positions test: SUCCESS (0 or more positions)
- ✅ Scanner page shows crypto list
- ✅ Positions page shows active positions (if any)
- ✅ Orders can be placed
