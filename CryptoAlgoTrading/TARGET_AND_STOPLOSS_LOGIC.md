# Target & Stop Loss Logic in delta.service.ts

## Overview

The service implements a comprehensive risk management system with multiple layers:
1. **Stop Loss** - Risk protection (tight stops)
2. **Half-Position Target** - Exit 50% at minimal gain (1x SL difference)
3. **Bracket Target** - Full position target (4x SL difference)
4. **Trailing Amount** - Trailing stop on the bracket (1x SL difference)

---

## 1. STOP LOSS CALCULATION

### For BUY Positions
```typescript
stopLossPrice = prev3Low / (1 + bufferPercentage/100)
stopLossDifference = entryPrice - stopLossPrice
```

**Example (Buy):**
- Entry Price: 50,000 INR
- Prev3Low: 49,500 INR
- Buffer: 0.4%
- SL Price = 49,500 / 1.004 = 49,301.79 INR
- SL Difference = 50,000 - 49,301.79 = **698.21 INR**

### For SELL Positions
```typescript
stopLossPrice = prev3High × (1 + bufferPercentage/100)
stopLossDifference = stopLossPrice - entryPrice
```

**Example (Sell):**
- Entry Price: 50,000 INR
- Prev3High: 50,500 INR
- Buffer: 0.4%
- SL Price = 50,500 × 1.004 = 50,702 INR
- SL Difference = 50,702 - 50,000 = **702 INR**

**Code Location:** `calculatePositionStopLossAndTarget()` lines 883-909

---

## 2. TARGET PRICE CALCULATION

### Two-Level Exit Strategy

#### Level 1: Half-Position Target (Exit 50%)
Uses **1x SL Difference** from entry price

**For BUY:**
```typescript
targetPrice = entryPrice + (stopLossDifference × 1)
```

**For SELL:**
```typescript
targetPrice = entryPrice - (stopLossDifference × 1)
```

**Example (Buy):**
- Entry: 50,000
- SL Difference: 698.21
- Target Price = 50,000 + 698.21 = **50,698.21 INR**
- Quantity: 50% of position size
- Purpose: Lock in profit early, reduce risk

#### Level 2: Bracket Target (Exit Remaining 50%)
Uses **4x SL Difference** from entry price (configurable via `targetMultiplier`)

**For BUY:**
```typescript
bracketTargetPrice = entryPrice + (stopLossDifference × targetMultiplier)
                   = entryPrice + (stopLossDifference × 4)
```

**For SELL:**
```typescript
bracketTargetPrice = entryPrice - (stopLossDifference × targetMultiplier)
                   = entryPrice - (stopLossDifference × 4)
```

**Example (Buy):**
- Entry: 50,000
- SL Difference: 698.21
- Bracket Target = 50,000 + (698.21 × 4) = 50,000 + 2,792.84 = **52,792.84 INR**
- Quantity: 50% of position size
- Purpose: Capture larger upside move

**Code Location:** Lines 1238-1251, 1467-1470

---

## 3. TRAILING STOP AMOUNT

The bracket order includes a trailing stop amount that trails the price movement.

**Formula:**
```typescript
bracketTrailingAmount = stopLossDifference × 1
```

**Example:**
- SL Difference: 698.21 INR
- Trailing Amount = 698.21 × 1 = **698.21 INR**
- Purpose: If price moves up 698.21, trailing stop also moves up 698.21 to lock profits

**Code Location:** Line 1270

---

## 4. LIMIT PRICE ADJUSTMENTS

To increase execution likelihood, limit prices are slightly adjusted inward:

### For Stop Loss (Limit Price)
```typescript
// BUY: Stop loss limit is 0.5% below the stop price
stopLossLimitPrice = stopLossPrice × 0.995

// SELL: Stop loss limit is 0.5% above the stop price  
stopLossLimitPrice = stopLossPrice × 1.005
```

### For Take Profit (Limit Price)
```typescript
// BUY: Take profit limit is 0.5% below bracket target
takeProfitLimitPrice = bracketTargetPrice × 0.995

// SELL: Take profit limit is 0.5% above bracket target
takeProfitLimitPrice = bracketTargetPrice × 1.005
```

**Purpose:** More conservative fills, higher execution probability

**Code Location:** Lines 1272-1279

---

## 5. COMPLETE FLOW EXAMPLE

### Scenario: Buy 10 contracts at 50,000 INR
**Given:**
- Entry Price: 50,000
- Prev3Low: 49,500
- Risk Amount: 2,500 INR
- Buffer: 0.4%
- targetMultiplier: 4

**Calculations:**

```
Step 1: Calculate Stop Loss
├─ SL Price = 49,500 / 1.004 = 49,301.79
├─ SL Difference = 50,000 - 49,301.79 = 698.21 INR
└─ SL Limit = 49,301.79 × 0.995 = 49,020.28

Step 2: Calculate Half-Position Target (50% exit)
├─ Target Price = 50,000 + 698.21 = 50,698.21
├─ Quantity = 5 contracts (50%)
└─ Order Type: LIMIT order (separate)

Step 3: Calculate Bracket Target (50% exit)
├─ Bracket Target = 50,000 + (698.21 × 4) = 52,792.84
├─ TP Limit = 52,792.84 × 0.995 = 52,478.28
└─ Quantity = 5 contracts (remaining 50%)

Step 4: Calculate Trailing Amount
├─ Trail Amount = 698.21 × 1 = 698.21
└─ Follows price up if it rallies

Final Orders Placed:
┌─ ORDER 1 (Entry with Bracket)
│  ├─ Type: MARKET
│  ├─ Size: 10 contracts
│  ├─ Entry: 50,000 (market execution)
│  ├─ Stop Loss: 49,301.79
│  ├─ Stop Loss Limit: 49,020.28
│  ├─ Bracket Target: 52,792.84
│  ├─ TP Limit: 52,478.28
│  └─ Trailing: 698.21
│
└─ ORDER 2 (Half-Position Target)
   ├─ Type: LIMIT
   ├─ Size: 5 contracts
   ├─ Price: 50,698.21
   ├─ Reduce Only: true
   └─ Time in Force: GTC (Good Till Cancelled)
```

---

## 6. ORDER EXECUTION SCENARIOS

### Scenario A: Partial Exit (50%)
```
Price moves to 50,698
↓
Half-position target (ORDER 2) executes at 50,698.21
↓
5 contracts sold at PROFIT of 50,698.21 - 50,000 = 698.21 per contract
↓
Remaining 5 contracts still held with bracket stop/target active
```

### Scenario B: Trailing Stop Hits
```
Price rallies to 52,000 (+2,000)
↓
Trailing stop moves up by 698.21
↓
New effective stop: 49,301.79 + 698.21 = 50,000 (cost basis)
↓
If price drops to 50,698
↓
Bracket target takes over and closes at 52,792.84
```

### Scenario C: Stop Loss Hits (Loss)
```
Price drops to 49,200
↓
Stop loss trigger at 49,301.79
↓
Order executes at or near limit price 49,020.28
↓
Loss per contract: 50,000 - 49,301.79 = 698.21
↓
Risk contained to configured amount
```

---

## 7. CONFIGURATION

These formulas use configurable values:

| Config | Default | Location | Use |
|--------|---------|----------|-----|
| `bufferPercentage` | 0.4% | Config Service | Entry/SL reference adjustment |
| `targetMultiplier` | 4 | Config Service | Bracket target distance (SL × 4) |
| Trailing Amount | SL × 1 | Hardcoded | Trailing stop follows profitably |
| SL Limit Adjustment | 0.5% | Hardcoded | Stop loss limit price |
| TP Limit Adjustment | 0.5% | Hardcoded | Take profit limit price |

---

## 8. KEY DESIGN PRINCIPLES

✅ **Risk Symmetry:** SL Difference same regardless of direction
✅ **Two-Part Exit:** Lock profits early, then ride the trend
✅ **Trailing Protection:** Profits are automatically protected as price moves
✅ **Limit Orders:** More conservative fills for all stop/target prices
✅ **Configurable:** targetMultiplier can be adjusted per strategy

---

## 9. FILES & METHODS

| Method | Location | Purpose |
|--------|----------|---------|
| `calculatePositionStopLossAndTarget()` | Line 883 | Core SL/TP calc |
| `placeBracketOrderForPosition()` | Line 1140 | Execute full bracket |
| `placeLimitBracketOrder()` | Line 1358 | Execute limit entry with bracket |
| `updateTrailingStopLoss()` | Line 982 | Update SL after price moves |
| `updateBracketStopLoss()` | Line 953 | Edit bracket SL |

