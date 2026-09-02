# Half-Quantity Fix - Quick Reference Card 🎯

## 📱 APK Ready!
**File**: `CryptoScanner-Debug.apk` | **Size**: 4.12 MB | **Status**: ✅ Ready

---

## 🚀 Install Now
```powershell
adb install -r CryptoScanner-Debug.apk
```

---

## 🧪 Test Immediately

### 1. Clear Logs
```powershell
adb logcat -c
```

### 2. Open App
- Go to Positions
- Select SHORT position (negative size)
- Click "Place Target & Stop Loss"

### 3. Monitor Logs
```powershell
adb logcat | findstr "HALF-QTY"
```

### 4. Look for Success
✅ Should see:
```
[HALF-QTY START] ...
[HALF-QTY PLACING] ...
[HALF-QTY SUCCESS] ...
```

### 5. Verify Account
- Bracket order placed? ✅
- Half-quantity order placed? ✅
- Quantity = half of position? ✅

---

## ⚠️ If It Fails

```powershell
# See the error
adb logcat | findstr "HALF-QTY ERROR"

# Common fixes:
# - Position size must be > 2
# - Check margin/balance
# - Clear existing pending orders
```

---

## 📊 Log Entries to Expect

| Log | Meaning |
|-----|---------|
| `[HALF-QTY START]` | Order process started |
| `[HALF-QTY SIDE DETECTION]` | Determined if SELL or BUY |
| `[HALF-QTY PLACING]` | Sending order to API |
| `[HALF-QTY PAYLOAD]` | Exact order details |
| `[HALF-QTY SUCCESS]` | ✅ Order placed! |
| `[HALF-QTY ERROR]` | ❌ Order failed |

---

## 🔧 What Was Fixed

✅ **Side Detection** - Now infers SELL from negative size  
✅ **Quantity** - Uses absolute value for correct half  
✅ **Logging** - Shows every step with [HALF-QTY] tags  
✅ **Errors** - Returns detailed error info instead of silent fail  

---

## 📱 Installation
```powershell
# Option 1: USB (Recommended)
adb install -r CryptoScanner-Debug.apk

# Option 2: Manual - Copy APK to phone, tap to install
# Option 3: Android Studio - Drag APK onto emulator
```

---

## 📊 Example: SHORT Position Test

```
Position: -34 LINKUSD (SELL)
Entry: 11.278
Half Target: 11.6

Expected Half-Quantity Order:
├─ Side: BUY (opposite to SELL position)
├─ Quantity: 17 (exactly half of 34)
└─ Price: 11.6 (at half-target)

Logs Should Show:
[HALF-QTY START] LINKUSD: {positionQuantity: -34, positionSide: "sell"}
[HALF-QTY PLACING] LINKUSD: buy 17 @ 11.6
[HALF-QTY SUCCESS] ...
```

---

## ✨ Features Now Working

- ✅ Bracket order placement (SL + TP)
- ✅ **Half-quantity limit order** (Step 6 - NOW FIXED!)
- ✅ Correct side for Long/Short
- ✅ Complete position coverage

---

## 🎯 Test Checklist

- [ ] APK installed
- [ ] App launched
- [ ] API configured
- [ ] Logs cleared
- [ ] Position selected
- [ ] "Place Target & Stop Loss" clicked
- [ ] [HALF-QTY SUCCESS] in logs
- [ ] Order appears in account
- [ ] Quantity is correct
- [ ] Price is at half-target
- [ ] Side is opposite to position

---

## 🆘 Quick Help

| Problem | Solution |
|---------|----------|
| No logs | Run: `adb logcat -c` then retry |
| SKIP message | Position too small, use size > 2 |
| ERROR | Check: `adb logcat \| findstr "HALF-QTY ERROR"` |
| Order not visible | Refresh trading account, check position symbol |

---

## 📚 Full Docs

- `HALF_QUANTITY_ORDER_FIX.md` - Complete explanation
- `BEFORE_AFTER_CODE_COMPARISON.md` - Code changes
- `APK_RELEASE_NOTES.md` - Release details

---

**Ready?** 🚀 Install and test now!
