# CORRECTED: Bracket Order & Target/Stop Loss Implementation

## Changes Made

### 1. Stop Loss Calculation (CORRECTED)

**Before (Wrong):**
```
Stop Loss calculated from ENTRY PRICE
FOR BUY:  SL = Entry ÷ bufferMultiplier
FOR SELL: SL = Entry × bufferMultiplier
```

**After (Correct):**
```
Stop Loss calculated from 3-DAY LOW/HIGH with BUFFER
FOR BUY:  SL = Prev3Low × (1 - buffer%)
FOR SELL: SL = Prev3High × (1 + buffer%)
```

**Example:**
```
Entry Price: 103
Prev3Low: 100
Prev3High: 106
Buffer: 0.4%

FOR BUY:
  SL = 100 × (1 - 0.004) = 100 × 0.996 = 99.6
  SL Difference = 103 - 99.6 = 3.4

FOR SELL:
  SL = 106 × (1 + 0.004) = 106 × 1.004 = 106.424
  SL Difference = 106.424 - 103 = 3.424
```

---

### 2. Target Price Calculations (CORRECTED)

#### A. Half-Position Target (× 1 SL Difference)
```
FOR BUY:
  Half Target = Entry + (SL_Difference × 1)
              = 103 + 3.4 = 106.4

FOR SELL:
  Half Target = Entry - (SL_Difference × 1)
              = 103 - 3.424 = 99.576
```

#### B. Full Bracket Target (× targetMultiplier from config)
```
Default targetMultiplier from config: 4

FOR BUY:
  Bracket Target = Entry + (SL_Difference × 4)
                 = 103 + (3.4 × 4) = 103 + 13.6 = 116.6

FOR SELL:
  Bracket Target = Entry - (SL_Difference × 4)
                 = 103 - (3.424 × 4) = 103 - 13.696 = 89.304
```

---

### 3. Configuration Values (Now Dynamic)

**From `config.service.ts`:**
```typescript
daysHighLow: 3          // Previous 3 days high/low (or from config)
bufferPercentage: 0.4   // 0.4% buffer (from config)
targetMultiplier: 4     // 4x for full target (from config)
```

These values are now **configurable** instead of hardcoded!

---

### 4. Bracket Order Payload Structure

**Entry Order (Market with Brackets):**
```json
{
  "product_id": 12345,
  "size": 96,                              // Full quantity
  "side": "buy",
  "order_type": "market_order",
  "bracket_stop_trigger_method": "last_traded_price",
  "bracket_stop_loss_price": "99.6",       // SL from prev3low
  "trail_amount": "3.4",                   // Trailing stop = SL diff × 1
  "bracket_take_profit_price": "116.6"     // TP = SL diff × 4
}
```

**Half-Position Target Order (Separate Limit):**
```json
{
  "product_id": 12345,
  "order_type": "limit_order",
  "side": "sell",                          // Opposite to entry
  "size": "48",                            // Half quantity
  "reduce_only": true,
  "limit_price": "106.4",                  // Entry + SL diff × 1
  "time_in_force": "gtc"
}
```

---

## Summary

✅ **Stop Loss:** Now calculated from 3-day low/high with buffer (NOT entry price)
✅ **Target Prices:** Properly use SL difference × multiplier
✅ **Config Values:** All multipliers now come from config (daysHighLow, buffer, targetMultiplier)
✅ **Logging:** Shows all calculated values for debugging
✅ **Build:** Successful - No errors

The implementation now matches your requirements exactly!
