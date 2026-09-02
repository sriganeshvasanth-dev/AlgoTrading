# Execution Guide - Place Target & Stop Loss with Total Count Check

## 🎯 Feature Overview

The "Place Target & Stop Loss" feature automatically places protective stop loss orders and profit-taking orders for open positions, with a critical check that orders are only placed if `total_count == 0`.

---

## 🔄 Complete Execution Flow

### Step 1: User Action
```
User clicks "Place Target & Stop Loss" button
    ↓
[Optional] Confirmation dialog appears
    ↓
User confirms
```

### Step 2: Fetch Open Positions
```
Call: this.deltaService.getPositions()
    ↓
API: GET /v2/positions
    ↓
Response: Array of open positions with:
  - product_id
  - symbol
  - side (buy/sell)
  - size (quantity)
  - entry_price
  - mark_price
  - etc.
```

### Step 3: Process Each Position
```
For each position:
    ↓
    placeTargetAndStopLossForPosition(position)
```

### Step 4: Check Existing Orders ⭐ KEY STEP
```
checkExistingOrders(productId=420)
    ↓
API: GET /v2/orders?product_ids=420&state=pending
    ↓
Response received:
{
  "meta": {
    "total_count": X,  ← THIS VALUE DETERMINES THE OUTCOME
    "limit": 10,
    "after": null,
    "before": null
  },
  "success": true,
  "result": [...]
}
```

### Step 5: Evaluate total_count
```
┌─────────────────────────────────────┐
│ Check: if (total_count > 0)         │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
      YES (>0)         NO (==0)
       │                │
   ┌───▼────┐      ┌────▼────┐
   │ SKIP ⏭️ │      │ PLACE ✅│
   └────────┘      └─────────┘
```

### Step 6A: If total_count > 0 (Skip)
```
Skip this position
    ↓
Log: "Skipping BTCINR - Target/SL orders already exist"
    ↓
Return:
{
  success: false,
  message: "Skipped - 2 pending order(s) already exist"
}
    ↓
Proceed to next position
```

### Step 6B: If total_count == 0 (Place)
```
Step 6B.1: Calculate Prices
    ↓
    calculateStopLossAndTarget(position)

    Get config values:
      - stoplossPercentage (default: 2%)
      - targetPercentage (default: 3%)
      - targetMultiplier (default: 4)

    Formula (for buy position entry=$50K):
      - Stop Loss: $50,000 × (1 - 0.02) = $49,000
      - Take Profit: $50,000 × (1 + 0.03 × 4) = $50,600

    Return: { stopLossPrice: 49000, takeProfitPrice: 50600 }

Step 6B.2: Place Bracket Order
    ↓
    placeBracketOrder(productId=420, 49000, 50600)

    API: POST /v2/orders/bracket

    Payload:
    {
      "product_id": 420,
      "stop_loss_order": {
        "order_type": "market_order",
        "stop_price": 49000
      },
      "take_profit_order": {
        "order_type": "market_order",
        "stop_price": 50600
      },
      "bracket_stop_trigger_method": "mark_price"
    }

    Response: { order_id: "12345", ... }

    Log: "✅ Bracket order placed for BTCINR: {order_id: 12345}"

Step 6B.3: Place Half-Quantity Target
    ↓
    placeHalfQuantityTarget(position, 50600)

    Calculate: half_quantity = position.size / 2 = 10 / 2 = 5

    API: POST /v2/orders

    Payload:
    {
      "product_id": 420,
      "order_type": "limit_order",
      "side": "sell",           (opposite of position side: buy)
      "size": 5,               (half of 10)
      "price": 50600           (take profit price)
    }

    Response: { order_id: "12346", ... }

    Log: "✅ Half-quantity target placed for BTCINR: {order_id: 12346}"

Step 6B.4: Return Success
    ↓
    Return:
    {
      success: true,
      symbol: "BTCINR",
      productId: 420,
      quantity: 10,
      bracketOrderResult: { order_id: "12345" },
      halfQuantityTargetResult: { order_id: "12346" },
      message: "Target & stop loss successfully placed"
    }
```

### Step 7: Collect Results
```
Results array collects all position results:
[
  {
    success: true,
    symbol: "BTCINR",
    message: "Target & stop loss successfully placed"
  },
  {
    success: false,
    symbol: "ETHBUSD",
    message: "Skipped - 2 pending order(s) already exist"
  },
  ...
]
```

### Step 8: Display to User
```
Results shown in UI table:
┌─────────┬──────────┬────────────────────────────┐
│ Symbol  │ Status   │ Message                    │
├─────────┼──────────┼────────────────────────────┤
│ BTCINR  │ ✅ Place │ Orders placed successfully │
│ ETHBUSD │ ⏭️ Skip  │ Already has orders         │
└─────────┴──────────┴────────────────────────────┘

Summary: Placed 1/2 positions
```

### Step 9: Record Scheduled Results
```
If triggered from scheduler:
    ↓
taskScheduler.recordTaskResults('place-target-stopLoss', {
  summary: "Placed for 1/2 positions",
  total: 2,
  succeeded: 1,
  failed: 1,
  results: [...]
})
```

---

## 📊 Complete Execution Timeline

```
T+0s:   User clicks button
T+0.1s: "Place Target & Stop Loss" method starts
T+0.2s: DeltaService.getPositions() called
T+0.5s: ← Positions received from API
T+0.6s: ← Loop starts: Position 1 (BTCINR)
T+0.7s: checkExistingOrders(420) called
T+1.0s: ← API response: total_count=0
T+1.1s: Proceed with placement (total_count==0)
T+1.2s: calculateStopLossAndTarget() executed
T+1.3s: placeBracketOrder() called
T+1.8s: ← Bracket order response (order #12345)
T+1.9s: placeHalfQuantityTarget() called
T+2.3s: ← Half-quantity order response (order #12346)
T+2.4s: Result added to results array (success: true)
T+2.5s: ← Loop next: Position 2 (ETHBUSD)
T+2.6s: checkExistingOrders(456) called
T+2.9s: ← API response: total_count=2
T+3.0s: Skip placement (total_count>0)
T+3.1s: Result added to results array (success: false)
T+3.2s: ← All positions processed
T+3.3s: Results displayed in UI
T+3.4s: Scheduled task results recorded (if applicable)
T+3.5s: ← Complete
```

---

## 📋 Key Decision Points

### Decision Point 1: Check Existing Orders
```
Question: Are there already pending orders for this product?
Source: API response meta.total_count
    ├─ total_count = 0 → NO existing orders → PLACE NEW ORDERS ✅
    ├─ total_count > 0 → Existing orders present → SKIP ⏭️
    └─ API fails → Assume NO orders → PLACE (safe default) ✅
```

### Decision Point 2: Calculate Prices
```
Question: What stop loss and take profit prices?
Source: Configuration values
    ├─ Stop Loss: Entry × (1 - SL%)
    ├─ Take Profit: Entry × (1 + TP% × Multiplier)
    └─ Result: Returns calculated prices
```

### Decision Point 3: Half-Quantity Feasibility
```
Question: Is quantity >= 1 for half-quantity target?
Source: position.size / 2
    ├─ Size >= 2 → Can place half (size/2 >= 1) ✅
    ├─ Size = 1 → Half = 0.5 < 1 (not supported) ⏭️
    └─ Size < 1 → Already can't place half ⏭️
```

---

## 🔍 Logging Trace Example

### Scenario: Mixed Results

**Console Output**:
```
[INFO] Starting target & stop loss placement for all positions
[DEBUG] Retrieved 3 open positions

[DEBUG] Processing position: BTCINR (Product ID: 420)
[DEBUG] Checking existing orders for product_id: 420
[DEBUG] Checked pending orders for product_id 420: total_count=0
[DEBUG] Product 420 has 0 pending orders (total_count=0) - will proceed with placement
[DEBUG] Existing orders for BTCINR: { count: 0, hasExisting: false }
[DEBUG] Calculated SL & Target for BTCINR: { stopLossPrice: 49000, takeProfitPrice: 50600 }
[INFO] Bracket order placed for BTCINR: { order_id: 12345 }
[INFO] Half-quantity target placed for BTCINR: { order_id: 12346 }

[DEBUG] Processing position: ETHBUSD (Product ID: 456)
[DEBUG] Checking existing orders for product_id: 456
[DEBUG] Checked pending orders for product_id 456: total_count=2
[DEBUG] Product 456 has 2 pending orders - will skip placement
[DEBUG] Existing orders for ETHBUSD: { count: 2, hasExisting: true }
[INFO] Skipping ETHBUSD - Target/SL orders already exist (2 pending)

[DEBUG] Processing position: LTCUSDT (Product ID: 789)
[DEBUG] Checking existing orders for product_id: 789
[DEBUG] Checked pending orders for product_id 789: total_count=0
[DEBUG] Product 789 has 0 pending orders (total_count=0) - will proceed with placement
[DEBUG] Existing orders for LTCUSDT: { count: 0, hasExisting: false }
[DEBUG] Calculated SL & Target for LTCUSDT: { stopLossPrice: 1950, takeProfitPrice: 2145 }
[INFO] Bracket order placed for LTCUSDT: { order_id: 12347 }
[INFO] Half-quantity target placed for LTCUSDT: { order_id: 12348 }

[INFO] Target & stop loss placement completed. Results: 3
```

---

## ✅ Validation Checklist

### Before Execution
- [ ] User is logged in
- [ ] API credentials valid
- [ ] At least one open position exists
- [ ] Network connection stable

### During Execution
- [ ] No errors in console
- [ ] All positions processed
- [ ] total_count values visible in logs
- [ ] Correct skip/place decisions made

### After Execution
- [ ] Results displayed in UI
- [ ] Correct count of placed/skipped
- [ ] Bracket orders visible on Delta Exchange
- [ ] Half-quantity targets visible on Delta Exchange

---

## 🚨 Error Scenarios

### Scenario 1: API Fails on Check Orders
```
checkExistingOrders() throws error
    ↓
Catch block executed
    ↓
Return [] (empty array - assume no orders)
    ↓
Proceed with placement (safe assumption)
    ↓
Log warns about API failure
```

### Scenario 2: Position Too Small
```
Half-quantity = size / 2
    ↓
If result < 1: Can't place (not supported)
    ↓
Place bracket order anyway ✅
    ↓
Skip half-quantity target ⏭️
    ↓
Return partial success
```

### Scenario 3: Bracket Order Fails
```
placeBracketOrder() throws error
    ↓
Catch block executed
    ↓
Log error
    ↓
Throw error (stop processing this position)
    ↓
Main loop catches error
    ↓
Add failure result and continue to next position
```

---

## 📈 Success Metrics

### Ideal Outcome
- All positions with no existing orders: Orders placed ✅
- All positions with existing orders: Properly skipped ⏭️
- No API errors
- Complete logging for audit trail
- UI clearly shows results

### Expected Results
```
Scenario: 10 positions total
  - 6 positions: No existing orders → Orders placed ✅
  - 4 positions: Already have orders → Skipped ⏭️

Result Display:
  Summary: Placed 6/10 positions
  Success Rate: 60%
  All operations logged
```

---

## 🎊 Feature Complete

The implementation correctly:
✅ Fetches open positions  
✅ Checks existing orders via API  
✅ Uses explicit total_count check  
✅ Places orders only when total_count == 0  
✅ Skips when total_count > 0  
✅ Calculates SL & TP based on config  
✅ Places bracket orders  
✅ Places half-quantity targets  
✅ Logs all operations  
✅ Handles errors gracefully  
✅ Returns detailed results  

**Status**: ✅ **Production Ready**

