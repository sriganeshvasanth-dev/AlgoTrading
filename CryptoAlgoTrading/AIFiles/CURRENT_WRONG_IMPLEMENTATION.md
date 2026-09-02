# CURRENT IMPLEMENTATION EXPLANATION - "Place Target & Stop Loss" Button

## Current Wrong Implementation

### File: `src/app/core/services/target-stoploss-manager.service.ts`
**Method:** `calculateStopLossAndTarget(position)`

### CURRENT CALCULATION (Lines 227-248):

```typescript
const slPercentage = (config?.stoplossPercentage || 2) / 100;
const tpPercentage = (config?.targetPercentage || 3) / 100;

if (side === 'buy') {
  stopLossPrice = entryPrice * (1 - slPercentage);        // ❌ WRONG
  takeProfitPrice = entryPrice * (1 + tpPercentage * targetMultiplier);  // ❌ WRONG
} else {
  stopLossPrice = entryPrice * (1 + slPercentage);
  takeProfitPrice = entryPrice * (1 - tpPercentage * targetMultiplier);
}
```

### What's WRONG:

1. ❌ **Using percentage-based calculation** (2%, 3%)
   - Should use actual 3-day low/high prices from config

2. ❌ **Stop Loss calculation**
   - Currently: `Entry × (1 - 2%)` = Entry × 0.98
   - Should be: `Prev3Low × (1 - buffer%)` = Prev3Low × 0.996

3. ❌ **Target Price calculation**
   - Currently: `Entry × (1 + 3% × 4)` = Entry × 1.12
   - Should be: `Entry + (SL_Difference × 4)`

4. ❌ **No access to 3-day high/low**
   - Position object doesn't have prev3High/prev3Low
   - This requires fetching ticker data first!

---

## WHAT IT SHOULD BE (Your Requirements):

### Stop Loss Calculation:
```
FOR BUY:
  Entry Price = 103 (from position.average_entry_price)
  Prev3Low = 100 (NEED TO FETCH from ticker data)
  Stop Loss = Prev3Low × (1 - 0.4%) = 100 × 0.996 = 99.6
  SL Difference = 103 - 99.6 = 3.4

FOR SELL:
  Entry Price = 103
  Prev3High = 106 (NEED TO FETCH from ticker data)
  Stop Loss = Prev3High × (1 + 0.4%) = 106 × 1.004 = 106.424
  SL Difference = 106.424 - 103 = 3.424
```

### Target Price Calculation:
```
FOR BUY:
  Take Profit = Entry + (SL_Difference × 4)
              = 103 + (3.4 × 4)
              = 103 + 13.6
              = 116.6

FOR SELL:
  Take Profit = Entry - (SL_Difference × 4)
              = 103 - (3.424 × 4)
              = 103 - 13.696
              = 89.304
```

---

## Current Flow When "Place Target & Stop Loss" Button Clicked:

1. **Fetch all positions** from `/v2/positions`
2. **For each position:**
   - Get `entry_price` (e.g., 103)
   - Get `side` (buy/sell)
   - Calculate SL using **WRONG** percentage-based logic
   - Calculate Target using **WRONG** percentage-based logic
3. **Place bracket order** with wrong prices
4. **Place half-quantity target** with wrong prices

---

## Data Flow Diagram:

```
Position from /v2/positions:
  {
    product_id: 12345,
    symbol: "NBISBUSD",
    side: "buy",
    size: 96,
    entry_price: 103,
    average_entry_price: 103
    // ❌ NO prev3High, prev3Low available!
  }

  ↓

calculateStopLossAndTarget() {
  ❌ Uses hardcoded 2% SL, 3% TP
  ❌ No access to ticker data
  ❌ Wrong formula
}

  ↓

Results in:
  ❌ SL: 103 × 0.98 = 100.94    (should be 99.6)
  ❌ TP: 103 × 1.12 = 115.36    (should be 116.6)
```

---

## What Needs to Change:

### Issue #1: Missing Ticker Data
The `TargetStopLossManagerService` only has position data (entry price, quantity, side).
It needs access to ticker/candle data with:
- `prev3High` - Previous 3 days high
- `prev3Low` - Previous 3 days low

### Issue #2: Wrong Calculation Logic
```
❌ CURRENT:
  SL = entry × (1 - percentage)
  TP = entry × (1 + percentage)

✅ SHOULD BE:
  SL = prev3Low × (1 - buffer)        [for buy]
  SL = prev3High × (1 + buffer)       [for sell]
  SL_Diff = abs(Entry - SL)
  TP = Entry ± (SL_Diff × multiplier)
```

---

## Summary of Issues:

| Aspect | Current (Wrong) | Should Be |
|--------|-----------------|-----------|
| **Data Source** | Position object only | Position + Ticker candles |
| **SL Calculation** | Entry × (1 - 2%) | Prev3Low × (1 - 0.4%) |
| **TP Calculation** | Entry × (1 + 12%) | Entry ± (SL_Diff × 4) |
| **Configuration** | Hardcoded 2%, 3% | Uses config.bufferPercentage, targetMultiplier |
| **Prev3 Access** | ❌ Not available | ✅ Need to fetch |

