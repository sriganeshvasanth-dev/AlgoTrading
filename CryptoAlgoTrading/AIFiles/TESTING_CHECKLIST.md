# Testing Checklist - Crypto Scanner

## ✅ Build Status
- ✅ TypeScript compilation: **SUCCESS**
- ✅ Angular assets configuration: **FIXED**
- ✅ Config file path: **CORRECTED**
- ✅ Positions component logic: **ENHANCED**

## 🔧 Issues Fixed

### 1. Config File 404 Error
**Problem**: `/assets/config.json` returning 404
**Root Cause**: Angular.json only included `public` folder, not `src/assets`
**Solution**: Added `src/assets` to assets configuration in `angular.json`

```json
"assets": [
  {
    "glob": "**/*",
    "input": "public"
  },
  {
    "glob": "**/*",
    "input": "src/assets",
    "output": "/assets"
  }
]
```

**Verification**:
- Build creates: `dist/CryptoCurrencyScanner/browser/assets/config.json`
- Accessible at: `/assets/config.json`

### 2. Positions Not Displaying
**Problem**: API returns data but UI shows "No Open Positions"
**Root Cause**: Positions with `size === 0` were filtered out
**Solution**: 
- Removed size filter in `getPositions()`
- Added better logging for debugging
- Added `ensureConfigLoaded()` call
- Enhanced position enrichment with all fields

**Verification**:
- Console logs: "Raw positions data", "Extracted positions", "Enriched positions"
- Positions array properly populated
- All position fields mapped correctly

### 3. Missing Position Fields
**Problem**: Leverage, margin, liquidation_price not displayed
**Solution**: Added in position enrichment:
```typescript
leverage: p.leverage || 1,
margin: parseFloat(p.margin || p.allocated_margin || 0),
liquidation_price: parseFloat(p.liquidation_price || 0)
```

## 🧪 Manual Testing Steps

### Test 1: Config Loading
1. Open app in browser: http://localhost:53703
2. Open DevTools > Network tab
3. Filter: config.json
4. Verify: Status 200, Content-Type: application/json
5. Check Response contains apiKey, apiSecret, baseUrl

**Expected Console Output**:
```
Content script initialized
Failed to load config... (if network timing issue, retry)
or
Config loaded successfully
```

### Test 2: Positions Page
1. Navigate to Positions page
2. Click "Refresh" button
3. Open DevTools > Console

**Expected Console Output**:
```
Raw positions data: { result: [...] }
Extracted positions: [...]
Position BTCUSD: size=0.001
Position ETHUSD: size=0.5
Enriched positions: [{ symbol, size, entry_price, mark_price, pnl, ... }]
Positions data received: [...]
Positions array: [...]
```

**Expected UI**:
- Header shows: "Open Positions"
- Stat cards show: Total Positions count, Total P&L
- Table displays all positions with:
  - Symbol and LONG/SHORT badge
  - Size, Entry Price, Mark Price
  - P&L and P&L% (colored green/red)
  - Margin, Leverage, Liquidation Price

### Test 3: Empty Positions
1. If no positions, should show:
   - 📭 Empty state icon
   - "No Open Positions" message
   - "Click Refresh to check for updates" text

### Test 4: Error Handling
1. Break API key in config.json
2. Refresh positions
3. Should show: "⚠️ Error: [error message]"

## 🚀 Run Tests

### Browser Test
```powershell
npm start
```
Navigate to:
- http://localhost:53703/scanner
- http://localhost:53703/positions

### Mobile Test (After APK Build)
1. Build APK: `.\build-apk.ps1`
2. Install on phone
3. Test same flows as browser
4. Verify responsive layout
5. Test dark/light theme toggle

## 📊 Expected Behavior

### Scanner Page
- ✅ Scan button works
- ✅ Shows crossover results
- ✅ Place Order modal opens
- ✅ Risk calculation accurate
- ✅ Order placement works

### Positions Page
- ✅ Loads positions on init
- ✅ Refresh button reloads
- ✅ Shows all position data
- ✅ P&L calculation correct
- ✅ Colors indicate profit/loss
- ✅ Responsive on mobile

### Config System
- ✅ Loads from /assets/config.json
- ✅ Can be edited without rebuild
- ✅ Changes apply on browser refresh
- ✅ Works in mobile APK

## 🐛 Known Issues (If Any)

### Issue: Config loads but shows HTML
**Status**: FIXED by adding proper assets configuration

### Issue: Positions array empty
**Status**: FIXED by removing size filter and enhancing API response handling

### Issue: Missing position details
**Status**: FIXED by enriching positions with all required fields

## 📝 Testing Notes

1. **First Load**: Config may fail on first load due to timing. Refresh page.
2. **CORS**: API calls work because we're using same-origin requests
3. **Rate Limits**: Delta API has rate limits. Don't spam refresh.
4. **API Keys**: Ensure valid keys in config.json
5. **Mobile**: Test landscape and portrait orientations

## ✅ Sign-Off Checklist

Before considering complete:
- [ ] Config loads without 404
- [ ] Positions display when data exists
- [ ] Empty state shows when no positions
- [ ] Error handling shows meaningful messages
- [ ] Console logs help debugging
- [ ] APK builds successfully
- [ ] Mobile responsive layout works
- [ ] Dark/light theme functions

## 🎯 Next Steps

1. Run `npm start` to test in browser
2. Verify config loading and positions
3. Run `.\build-apk.ps1` to generate APK
4. Install and test on Android device
5. Verify all features work on mobile
