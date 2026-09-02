# Visual Guide - Total Count Logic

## Decision Tree Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Place Target & Stop Loss for Position                         │
│  placeTargetAndStopLossForPosition(position)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Check Existing Orders                                         │
│  GET /v2/orders?product_ids={id}&state=pending                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │  API Response Received            │
        │  {                                 │
        │    meta: {                        │
        │      total_count: X               │
        │    },                             │
        │    result: [...]                  │
        │  }                                │
        └────────┬───────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
  ┌────────────┐        ┌────────────┐
  │ total_count│        │ total_count│
  │    == 0    │        │    > 0     │
  └─────┬──────┘        └─────┬──────┘
        │                      │
        │ NO existing orders   │ EXISTING orders
        ▼                      ▼
  ┌──────────────────┐   ┌──────────────────┐
  │ Return: []       │   │ Return: [orders]│
  └────────┬─────────┘   └────────┬─────────┘
           │                      │
           ▼                      ▼
   ┌─────────────────┐    ┌──────────────────┐
   │ hasExisting:    │    │ hasExisting:     │
   │ false (proceed) │    │ true (skip)      │
   └────────┬────────┘    └────────┬─────────┘
            │                      │
            ▼                      ▼
   ┌──────────────────────┐  ┌────────────────────┐
   │ 📊 Calculate SL & TP │  │ ⏭️  Skip This      │
   │ 📋 Place Bracket     │  │ Position           │
   │ 🎯 Place Half Target │  │ Proceed to Next    │
   │                      │  │                    │
   │ ✅ SUCCESS          │  │ ⏭️  SKIPPED       │
   └──────────┬───────────┘  └────────┬──────────┘
              │                       │
              └───────────┬───────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │ Return Result           │
              │ - success: true/false   │
              │ - message: details      │
              │ - orders: placed IDs    │
              └─────────────────────────┘
```

---

## Code Flow Visualization

### Path 1: New Position (total_count=0)

```
┌──────────────────────────────────────────────────────────────────┐
│ POSITION: 10 BTC @ $50,000 entry                               │
│ PRODUCT_ID: 420                                                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  API: GET /v2/orders?product_ids=420   │
        │       &state=pending                   │
        └─────────────────────┬───────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
        🔍 Response │                    │  Response
        ┌───────────▼─┐              ┌──▼────────────┐
        │ {           │              │ {             │
        │   meta: {   │              │   meta: {     │
        │   total:0 ◄─┼──────────┐   │   total:2 ◄──┼─ Example 2
        │  },result:[]│          │   │  },result:[{}]│
        │ }           │          │   │ }             │
        └─────────────┘          │   └───────────────┘
                                 │
                     ✅ PROCEED HERE
                                 │
                   checkExistingOrders()
                                 │
                    ┌────────────▼─────────────┐
                    │ if (0 > 0) → FALSE       │
                    │ return [] (empty array)  │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │ hasExistingOrders:        │
                    │ false (proceed with order)│
                    └────────────┬──────────────┘
                                 │
                    ┌────────────▼──────────────────┐
                    │ 1️⃣  Calculate Prices           │
                    │    SL: $49,000                │
                    │    TP: $51,200                │
                    └────────────┬──────────────────┘
                                 │
                    ┌────────────▼─────────────────┐
                    │ 2️⃣  Place Bracket Order       │
                    │    POST /v2/orders/bracket    │
                    │    ✅ Order ID: #12345        │
                    └────────────┬────────────────┘
                                 │
                    ┌────────────▼──────────────────┐
                    │ 3️⃣  Place Half-Quantity Target│
                    │    POST /v2/orders            │
                    │    SELL 5 BTC @ $51,200       │
                    │    ✅ Order ID: #12346        │
                    └────────────┬──────────────────┘
                                 │
                    ┌────────────▼──────────────────┐
                    │ ✅ SUCCESS                     │
                    │ Both orders placed            │
                    └───────────────────────────────┘
```

### Path 2: Existing Orders (total_count>0)

```
┌──────────────────────────────────────────────────────────────────┐
│ POSITION: 5 ETH @ $3,000 entry                                 │
│ PRODUCT_ID: 456                                                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  API: GET /v2/orders?product_ids=456   │
        │       &state=pending                   │
        └─────────────────────┬───────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
        🔍 Response │                    │ Response
        ┌───────────┴──────────┐    ┌───▼────────────────┐
        │ (from diagram above) │    │ {                  │
        │                      │    │   meta: {          │
        │                      │    │   total:2 ◄────────┼─ HERE!
        │                      │    │  },                │
        │                      │    │  result: [         │
        │                      │    │    {order_id: ...},│
        │                      │    │    {order_id: ...} │
        │                      │    │  ]                 │
        │                      │    │ }                  │
        └──────────────────────┘    └────────────────────┘
                                              │
                                    ⏭️ SKIP HERE
                                              │
                                 checkExistingOrders()
                                              │
                              ┌───────────────▼────────────────┐
                              │ if (2 > 0) → TRUE              │
                              │ return [order1, order2]        │
                              │ (return existing orders)       │
                              └───────────────┬────────────────┘
                                              │
                              ┌───────────────▼────────────────┐
                              │ hasExistingOrders:             │
                              │ true (skip placement)          │
                              └───────────────┬────────────────┘
                                              │
                              ┌───────────────▼────────────────┐
                              │ ⏭️  SKIP!                       │
                              │ Already has 2 pending orders   │
                              │ Proceed to next symbol         │
                              └───────────────┬────────────────┘
                                              │
                              ┌───────────────▼────────────────┐
                              │ ⏭️  SKIPPED                      │
                              │ No new orders placed           │
                              └────────────────────────────────┘
```

---

## Logic Table: All Scenarios

| Scenario | API Response | total_count | Return Value | Decision | Action |
|----------|--------------|------------|--------------|----------|--------|
| New Position | `{meta:{total_count:0},result:[]}` | 0 | `[]` | ✅ Proceed | Place orders |
| Order Exists (1) | `{meta:{total_count:1},result:[...]}` | 1 | `[order1]` | ⏭️ Skip | Don't place |
| Orders Exist (2+) | `{meta:{total_count:2},result:[...]}` | 2+ | `[order1,...]` | ⏭️ Skip | Don't place |
| API Fails | Error | undefined | `[]` | ✅ Proceed | Place orders (safe default) |
| Network Issue | No response | null | `[]` | ✅ Proceed | Place orders (safe default) |

---

## Logging Output Patterns

### ✅ Will Place Orders (total_count == 0)
```
[DEBUG] Checking existing orders for product_id: 420
[DEBUG] Checked pending orders for product_id 420: total_count=0
[DEBUG] Product 420 has 0 pending orders (total_count=0) - will proceed with placement
    ↑
    └─ Clear indication: "will proceed with placement"
```

### ⏭️ Will Skip (total_count > 0)
```
[DEBUG] Checking existing orders for product_id: 456
[DEBUG] Checked pending orders for product_id 456: total_count=2
[DEBUG] Product 456 has 2 pending orders - will skip placement
    ↑
    └─ Clear indication: "will skip placement"
```

---

## Summary

The logic is straightforward:

```
                    API: Get pending orders
                             │
                    ┌────────┴────────┐
                    │                 │
            total_count=0        total_count>0
                    │                 │
                    ▼                 ▼
              ✅ PLACE            ⏭️ SKIP
            Place orders        Proceed to next
```

**Key Point**: Always check `meta.total_count` in the response, not the `result` array length.

