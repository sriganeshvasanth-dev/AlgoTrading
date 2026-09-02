# Target & Stop Loss Manager Implementation

## Overview
This document describes the comprehensive "Place Target & Stop Loss" feature implementation that automatically manages stop loss and take profit orders for open positions.

## Requirements Implemented

### 1. ✅ Get Open Positions
- **API**: `GET {{base_url}}/v2/positions`
- **Implementation**: Uses existing `DeltaService.getPositions()` method
- **Details**: Already enriches positions with mark price and PnL calculation

### 2. ✅ Check Existing Orders
- **API**: `GET {{base_url}}/v2/orders?product_ids={{product_id}}&state=pending`
- **Implementation**: New method `checkExistingOrders()` in `TargetStopLossManagerService`
- **Logic**: 
  - Checks if there are any pending orders for the product
  - If `total_count == 0`, proceeds to place new orders
  - If orders already exist, skips that position to avoid duplicates

### 3. ✅ Calculate Stop Loss & Take Profit
- **Configuration-Based Calculation**:
  - Uses `stoplossPercentage` from config (default: 2%)
  - Uses `targetPercentage` from config (default: 3%)
  - Uses `targetMultiplier` from config (default: 4x)

- **Formula** (for Buy positions):
  ```
  Stop Loss Price = Entry Price × (1 - SL%)
  Take Profit Price = Entry Price × (1 + Target% × Multiplier)
  ```

- **Formula** (for Sell positions - inverse):
  ```
  Stop Loss Price = Entry Price × (1 + SL%)
  Take Profit Price = Entry Price × (1 - Target% × Multiplier)
  ```

### 4. ✅ Place Bracket Orders
- **API**: `POST {{base_url}}/v2/orders/bracket`
- **Payload**:
  ```json
  {
    "product_id": "{product_id}",
    "stop_loss_order": {
      "order_type": "market_order",
      "stop_price": "{stop_loss_price}"
    },
    "take_profit_order": {
      "order_type": "market_order",
      "stop_price": "{take_profit_price}"
    },
    "bracket_stop_trigger_method": "mark_price"
  }
  ```
- **Implementation**: Uses existing `DeltaService.placeBracketOrderForPosition()`

### 5. ✅ Place Half-Quantity Target Order
- **Purpose**: Additional take-profit target at half position quantity
- **API**: `POST {{base_url}}/v2/orders`
- **Payload**:
  ```json
  {
    "product_id": "{product_id}",
    "order_type": "limit_order",
    "side": "sell" (opposite of position side),
    "size": "{position_quantity / 2}",
    "price": "{take_profit_price}"
  }
  ```
- **Implementation**: New method `placeHalfQuantityTarget()` in service
- **Details**: Only places if quantity >= 1

## Architecture

### New Service: `TargetStopLossManagerService`
**File**: `src/app/core/services/target-stoploss-manager.service.ts`

#### Main Methods:

1. **`placeTargetsAndStopLossForAllPositions()`**
   - Orchestrates the complete flow
   - Gets all open positions
   - Processes each position
   - Returns array of results

2. **`placeTargetAndStopLossForPosition(position)`**
   - Processes a single position
   - Flow:
     1. Check existing pending orders
     2. Skip if orders exist
     3. Calculate SL & TP
     4. Place bracket order
     5. Place half-quantity target

3. **`checkExistingOrders(productId)`**
   - Queries API for pending orders
   - Returns empty array if API fails (fails gracefully)

4. **`calculateStopLossAndTarget(position)`**
   - Calculates SL and TP prices based on position side
   - Uses config values for percentages

5. **`placeBracketOrder(productId, stopLossPrice, takeProfitPrice)`**
   - Delegates to `DeltaService.placeBracketOrderForPosition()`
   - Returns order result

6. **`placeHalfQuantityTarget(position, targetPrice)`**
   - Places limit order for half quantity
   - Opposite side of position (buy position → sell target, etc.)
   - Returns result or null if fails

7. **`anyPendingOrdersExist(productId)`**
   - Helper method for individual checks

### Updated Component: `PositionsComponent`
**File**: `src/app/features/positions/positions.component.ts`

#### Changes:
- Added `TargetStopLossManagerService` injection
- Added `LoggingService` injection
- Simplified `placeTargetsAndStopLoss()` method
- Now delegates to the new manager service
- Improved logging using `LoggingService`

#### Method Flow:
```
placeTargetsAndStopLoss()
  ↓
targetStopLossManager.placeTargetsAndStopLossForAllPositions()
  ↓
For each position:
  - Check existing orders
  - If none exist:
    - Calculate SL & TP
    - Place bracket order
    - Place half-quantity target
  ↓
Record results & update UI
```

## Configuration

### Required Config Properties
Located in `AppConfig` interface:

```typescript
{
  stoplossPercentage: number;      // Default: 2 (%)
  targetPercentage: number;        // Default: 3 (%)
  targetMultiplier: number;        // Default: 4 (x)
  daysHighLow: number;            // Default: 3 (future enhancement)
  bufferPercentage: number;       // Default: 0.4 (future enhancement)
}
```

## Error Handling

1. **Graceful Degradation**:
   - API failures in `checkExistingOrders()` assume no existing orders
   - Half-quantity target failures don't stop bracket order placement
   - Individual position failures don't stop processing of others

2. **Logging**:
   - All operations logged via `LoggingService`
   - Success and error messages captured
   - Detailed debugging info at debug level

3. **User Feedback**:
   - Success/failure count displayed
   - Results array returned to component
   - Error message propagated to UI

## Execution Flow

### Manual Execution (User Triggered)
1. User clicks "Place Target & Stop Loss" button
2. Confirmation dialog appears
3. Service processes all positions
4. Results displayed to user

### Scheduled Execution (Scheduler Triggered)
1. Task scheduler triggers at configured time
2. No confirmation dialog shown
3. Results recorded in task scheduler
4. Can be viewed in scheduler logs

## Testing Scenarios

### Scenario 1: New Position (No Existing Orders)
```
Input: Position with product_id=123, entry_price=100
  ↓
Check Orders: 0 pending orders
  ↓
Place Bracket: SL=98, TP=312
  ↓
Place Half Target: Quantity=50, Price=312
  ↓
Result: ✅ Success
```

### Scenario 2: Position Already Has Orders
```
Input: Position with product_id=456, existing=2 orders
  ↓
Check Orders: 2 pending orders
  ↓
Skip: "Already has pending orders"
  ↓
Result: ⏭️  Skipped
```

### Scenario 3: Very Small Position (< 1 lot)
```
Input: Position with quantity=0.5
  ↓
Bracket Order: ✅ Success
  ↓
Half Target: Quantity=0.25 < 1
  ↓
Skip Half Target, Continue
```

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/v2/positions` | Get open positions |
| GET | `/v2/orders?product_ids=X&state=pending` | Check existing orders |
| POST | `/v2/orders/bracket` | Place bracket order (SL + TP) |
| POST | `/v2/orders` | Place limit order (half-quantity target) |

## Benefits

1. **Automation**: Automatically places protection and profit-taking orders
2. **Risk Management**: Prevents positions from running against stops indefinitely
3. **Profit Locking**: Half-quantity target locks in partial profits early
4. **Smart Skipping**: Avoids duplicate orders if they already exist
5. **Configurable**: All parameters driven by user configuration
6. **Logging**: Comprehensive logging for audit and debugging
7. **Graceful Failure**: Non-blocking errors on individual positions

## Future Enhancements

1. **3-Day High/Low**: Use actual market data instead of percentage-based calculations
2. **Dynamic Sizing**: Adjust order sizes based on risk/margin
3. **Trailing Stops**: Automatically adjust stop losses as price moves favorably
4. **Multi-Leg Orders**: Support for more complex order combinations
5. **Order Modification**: Update existing orders if needed
6. **Partial Exit Strategy**: More granular profit-taking at multiple levels

## Migration Notes

- Moved SL/TP calculation logic from `PlaceLimitOrder` feature to this dedicated service
- Reuses existing bracket order and limit order APIs
- Maintains backward compatibility with scheduler integration
- Enhanced logging for better observability

