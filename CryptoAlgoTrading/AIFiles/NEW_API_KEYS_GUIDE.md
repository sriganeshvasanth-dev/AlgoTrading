# API Credentials Updated - Build Instructions

## ✅ API Keys Updated

**New Credentials Configured:**
- **API Key:** `gbnHnK6baTLfger016WR2qIIYSQJzn`
- **API Secret:** `FL2KLzjhTut7BsJmsexpVG4HMwUeg1wmj5CijQFGghJzv0jsa8qBW0yIMK2S`
- **Base URL:** `https://api.india.delta.exchange`

These are now saved in: `src/assets/config.json`

---

## 🚨 CRITICAL: Whitelist Your Mobile IP First!

**Before building the APK**, you must whitelist your mobile IP in Delta Exchange, or the app won't work!

### Step-by-Step IP Whitelisting:

1. **Log in to Delta Exchange**
   - Go to: https://www.delta.exchange
   - Log in with your account

2. **Navigate to API Management**
   - Click your profile → Settings
   - Select "API Management"

3. **Find Your API Key**
   - Look for: `gbnHnK6baTLfger016WR2qIIYSQJzn`
   - Click "Edit" or "Manage"

4. **Update IP Restrictions**

   **Option A - Allow All IPs (Easiest):**
   - Select "No IP restrictions" or "Allow all IPs"
   - ⚠️ Less secure but works from anywhere

   **Option B - Add Specific IP (More Secure):**
   - On your mobile, visit: https://www.whatismyip.com/
   - Copy the IP address shown
   - Add it to the whitelist in Delta Exchange
   - ⚠️ May need to update if your mobile IP changes

5. **Save Changes**
   - Click "Save" or "Update"
   - Wait a few seconds for changes to apply

---

## 🔨 Build the APK

### Quick Build:
```cmd
build-with-new-keys.cmd
```

This script will:
1. ✅ Verify config file exists
2. ✅ Clean old builds
3. ✅ Build Angular production bundle
4. ✅ Sync Capacitor Android platform
5. ✅ Build the APK
6. ✅ Copy to `CryptoScanner-Debug.apk`

### Manual Build (If Script Fails):
```cmd
# Clean
rmdir /s /q dist
rmdir /s /q android\app\build

# Build Angular
npm run build --configuration=production

# Sync Capacitor
npx cap sync android

# Build APK
cd android
gradlew assembleDebug
cd ..

# Copy APK
copy android\app\build\outputs\apk\debug\app-debug.apk CryptoScanner-Debug.apk
```

---

## 📱 Install & Test

### Installation:
1. Transfer `CryptoScanner-Debug.apk` to your Android phone
2. Open the APK file
3. Enable "Install from Unknown Sources" if prompted
4. Install the app

### Testing:
1. **Open the app**
2. **Go to Debug page** (🔧 icon in navigation)
3. **Click Test Config**
   - Should show SUCCESS
   - Should display the new API key
4. **Click Test Products**
   - Should show SUCCESS
   - Should show ~220 products
5. **Click Test Positions**
   - If SUCCESS → IP whitelisting worked! ✅
   - If "ip_not_whitelisted" → Go back and whitelist IP! ⚠️

---

## 🐛 Troubleshooting

### Error: "ip_not_whitelisted_for_api_key"

**Cause:** Your mobile IP is not whitelisted in Delta Exchange

**Fix:**
1. Go to Delta Exchange → Settings → API Management
2. Edit API key `gbnHnK6baTLfger016WR2qIIYSQJzn`
3. Enable "Allow all IPs"
4. Save
5. **No rebuild needed** - just close and reopen the app

### Error: "invalid_api_key"

**Cause:** 
- API key is wrong, or
- API key is for a different Delta Exchange environment (India vs Global)

**Fix:**
1. Verify API key in Delta Exchange
2. Make sure it's for `api.india.delta.exchange` (not the global API)
3. Update `src/assets/config.json` if needed
4. Rebuild APK

### Error: Config Test Shows Old API Key

**Cause:** Old APK still installed

**Fix:**
1. Uninstall the old app completely
2. Install the new APK
3. Test again

### Positions Show 0 Even After IP Whitelist

**Possible Causes:**
- ✅ Everything is working!
- You simply don't have any open positions right now
- This is normal if you haven't placed any trades

**Verify it's working:**
- Debug → Test Positions should show SUCCESS (not an error)
- If SUCCESS with count: 0 → Everything works, you just have no positions

---

## 📋 What's Included in This Build

### Features:
- ✅ Updated API credentials
- ✅ Enhanced mobile debugging
- ✅ Fixed table header overlap
- ✅ Optimized mobile layout
- ✅ Comprehensive error logging
- ✅ Debug page with test buttons

### Pages:
- **Scanner**: 3-day high/low crossover detection
- **Positions**: View open positions with P&L
- **Debug**: Test API connectivity and view logs

---

## 🔐 Security Notes

### API Key Security:
- Your API keys are **embedded in the APK**
- Anyone with your APK can extract the keys
- **Recommended:**
  - Use IP whitelisting (Option B above)
  - Use read-only or trading-only permissions
  - Don't use keys with withdrawal permissions
  - Monitor API usage in Delta Exchange

### IP Whitelisting:
- **"Allow all IPs"**: Convenient but less secure
- **Specific IPs**: More secure but requires updates when IP changes
- **Best practice**: Use VPN with static IP if possible

---

## ✅ Final Checklist

Before using the app:
- [ ] API key `gbnHnK6baTLfger016WR2qIIYSQJzn` exists in Delta Exchange
- [ ] IP restrictions updated (Allow all IPs OR mobile IP added)
- [ ] Changes saved in Delta Exchange
- [ ] APK built with `build-with-new-keys.cmd`
- [ ] Old app uninstalled from phone
- [ ] New APK installed on phone
- [ ] Test Config shows new API key
- [ ] Test Products shows SUCCESS
- [ ] Test Positions shows SUCCESS (not ip_not_whitelisted)

---

## 📞 Quick Debug Commands

### If app doesn't work:

1. **Open Debug page**
2. **Click Test Config** → Should show new API key starting with `gbnHnK6b...`
3. **Click Test Products** → Should show SUCCESS with 220 products
4. **Click Test Positions** → Check result
5. **Read logs** → Shows exact error

### Expected Success Output:

```json
Test Config: SUCCESS
{
  "delta": {
    "apiKey": "gbnHnK6baTLfger016WR2qIIYSQJzn",
    ...
  }
}

Test Products: SUCCESS
{
  "count": 220
}

Test Positions: SUCCESS
{
  "count": 0 or more
}
```

### If You See Errors:

**Error:** `ip_not_whitelisted_for_api_key`
→ **Fix:** Whitelist IP in Delta Exchange (no rebuild needed)

**Error:** `invalid_api_key`
→ **Fix:** Verify API key is correct and for India API

**Error:** Network timeout
→ **Fix:** Check internet connection

---

## 🎉 Summary

1. ✅ **API credentials updated** in code
2. ⚠️ **YOU MUST** whitelist mobile IP in Delta Exchange
3. 🔨 **Build APK** with `build-with-new-keys.cmd`
4. 📱 **Install and test** on your phone
5. 🐛 **Use Debug page** to verify everything works

The app is ready - just whitelist your IP and build! 🚀
