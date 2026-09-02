# Bracket Order & Half-Position Target Implementation Explanation

## Overview
The system uses **bracket orders** for main position protection and **separate half-quantity limit orders** for taking profit on half the position.

---

## 1. BRACKET ORDER (Main Position)
**File:** `src/app/core/services/delta.service.ts` → `placeBracketOrder()`

### A. Calculate Stop Loss Price
```
Entry Price: 103 (provided or calculated)
Buffer %: 0.3% (from config.bufferPercentage)

FOR BUY:
  Stop Loss = Entry Price ÷ (1 + 0.3%) = 103 ÷ 1.003 = 102.694

FOR SELL:
  Stop Loss = Entry Price × (1 + 0.3%) = 103 × 1.003 = 103.309
```

**Key Issue:** Stop loss is calculated from ENTRY PRICE, not from 3-day low/high.

### B. Calculate Stop Loss Difference
```
SL Difference (INR) = |Entry Price (INR) - Stop Loss (INR)|

Example: 103 - 102.694 = 0.306 per unit
If USD→INR (multiplier 85): 0.306 × 85 = ₹26.01 per unit
```

### C. Calculate Quantity
```
Formula: Quantity = Risk Amount (INR) ÷ Stop Loss Difference (INR)

Example:
  Risk Amount: ₹2500
  SL Difference: ₹26.01
  Quantity = 2500 ÷ 26.01 = 96.04 units
              (rounded to lot size)
```

### D. Bracket Order Prices

#### 1. **Stop Loss Trigger Price**
```
PURPOSE: When price hits this, stop loss order triggers

FOR BUY:    Stop Loss = Entry ÷ bufferMultiplier = 102.694
FOR SELL:   Stop Loss = Entry × bufferMultiplier = 103.309
```

#### 2. **Trailing Amount**
```
PURPOSE: After entry, move stop loss by this amount as price moves in profit
FORMULA: Trailing Amount = SL Difference × 1

Example: 0.306 × 1 = 0.306 (follows price up/down by this amount)
```

#### 3. **Take Profit (Bracket Target) Price**
```
PURPOSE: Close position when this price is reached
FORMULA: Bracket Target = Entry ± (SL Difference × 4)

FOR BUY:    Target = 103 + (0.306 × 4) = 103 + 1.224 = 104.224
FOR SELL:   Target = 103 - (0.306 × 4) = 103 - 1.224 = 101.776
```

### E. Bracket Order Payload
```json
{
  "product_id": 12345,
  "size": 96,                              // Full quantity
  "side": "buy",
  "order_type": "market_order",
  "bracket_stop_trigger_method": "last_traded_price",
  "bracket_stop_loss_price": "102.694",   // Stop loss trigger
  "trail_amount": "0.306",                 // Trailing stop amount
  "bracket_take_profit_price": "104.224"  // TP target
}
```

---

## 2. HALF-POSITION TARGET ORDER (Separate Limit Order)
**File:** `src/app/core/services/target-stoploss-manager.service.ts` → `placeHalfQuantityTarget()`

### A. Calculate Half Quantity
```
Full Quantity: 96 units
Half Quantity = floor(96 ÷ 2) = 48 units
```

### B. Calculate Target Price (Half-Position Exit)
```
FOR BUY:    Target = Entry + SL Difference = 103 + 0.306 = 103.306
FOR SELL:   Target = Entry - SL Difference = 103 - 0.306 = 102.694
```

### C. Half-Position Target Order Payload
```json
{
  "product_id": 12345,
  "order_type": "limit_order",
  "side": "sell",                          // Opposite side to buy
  "size": "48",                            // HALF the quantity
  "reduce_only": true,                     // Only close positions, never open
  "limit_price": "103.306",                // Target price
  "time_in_force": "gtc"                   // Good till cancelled
}
```

---

## 3. LIMIT ORDER (Place Limit Order Feature)
**File:** `src/app/core/services/delta.service.ts` → `placeLimitBracketOrder()`

### Current (Wrong) Implementation Issues:
- Uses `entryPrice = 0` which gets recalculated
- Entry prices calculated differently for buy vs sell
- Stop loss calculated from entry (not from 3-day low/high)
- Quantity formula uses limit price difference instead of SL difference

### What Should Happen:
- Entry prices should use 3-day high/low with buffer
- SL should be calculated from 3-day low/high (NOT from entry)
- Quantity = Risk ÷ SL Difference
- Both buy & sell should have SAME quantity

---

## Summary of Price Calculations

| Price | Buy | Sell | Source |
|-------|-----|------|--------|
| **Entry** | High × 1.003 | Low ÷ 1.003 | 3-day + buffer |
| **Stop Loss** | Entry ÷ 1.003 | Entry × 1.003 | From entry price |
| **Half Target** | Entry + SL_Diff | Entry - SL_Diff | Bracket target |
| **Full Target** | Entry + (SL_Diff × 4) | Entry - (SL_Diff × 4) | Bracket target |
| **Trailing Amt** | SL_Diff × 1 | SL_Diff × 1 | Follows price |

---

## Key Issues Found

1. ❌ Stop loss is calculated from entry price, not from 3-day low/high
2. ❌ Place limit order uses wrong entry price base
3. ❌ Quantity calculation in limit order uses limit price difference instead of SL difference
4. ✅ Bracket order half-position target uses correct formula
5. ✅ Trailing amount correctly uses SL difference

