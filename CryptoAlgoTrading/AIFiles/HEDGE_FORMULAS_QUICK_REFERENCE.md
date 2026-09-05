# Quick Reference: Hedge Order Formulas

## ✅ Current Formulas in delta.service.ts

All formulas are now correctly implemented as per your specifications.

### Entry & Stop Prices

```
BUY Entry Price    = prev3High × (1 + 0.4%)
BUY Stop Price     = BUY Entry × (1 - 0.1%)    ← Tighter than entry buffer

SELL Entry Price   = prev3High × (1 - 0.4%)    ← Uses prev3High (not Low)
SELL Stop Price    = SELL Entry × (1 + 0.1%)   ← Tighter than entry buffer
```

### Risk Sizing

```
Stop Loss Difference = |BUY Entry - SELL Entry|
Position Quantity    = Risk Amount (INR) / (SL Difference × Exchange Rate)
```

### Example Output

```
Input:
- prev3High: 50,000 INR
- Risk Amount: ₹2,500
- Exchange Rate: 83 USD/INR
- Buffer: 0.4%

Calculated:
├─ BUY Entry:      50,200 INR
├─ BUY Stop:       50,149.80 INR
├─ SELL Entry:     49,800 INR
├─ SELL Stop:      49,849.80 INR
├─ SL Difference:  400 INR
└─ Quantity:       7.53 contracts
```

## File Locations

| File | Purpose |
|------|---------|
| `src/app/core/services/delta.service.ts` | Main hedge order logic (line 533) |
| `src/app/core/services/config.service.ts` | Buffer percentage config (default 0.4%) |
| `src/app/features/scanner/dashboard.component.ts` | Calls placeHedgeLimitOrder() |

## Configuration

### Buffer Percentage (Entry Price)
- **Location:** Config service
- **Default:** 0.4%
- **Used for:** BUY and SELL entry price calculations
- **Configurable:** Yes

### Stop Loss Buffer (Fixed)
- **Value:** 0.1% (hardcoded)
- **Applied to:** BUY stop and SELL stop prices
- **Why Different:** Tighter control on stop losses
- **Configurable:** Can be made configurable if needed

## Key Difference: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| Stop Loss Tightness | 0.4% from entry | 0.1% from entry |
| SELL Entry Reference | `prev3Low` ❌ | `prev3High` ✅ |
| SL Difference | Variable (high) | Compact & consistent |
| Risk Control | Loose | Tight (better) |

## Testing Checklist

When testing hedge order placement:

- [ ] Verify BUY entry = prev3High × 1.004
- [ ] Verify BUY stop = BUY entry × 0.999 (0.1% below)
- [ ] Verify SELL entry = prev3High × 0.996
- [ ] Verify SELL stop = SELL entry × 1.001 (0.1% above)
- [ ] Verify SL Difference = |BUY entry - SELL entry|
- [ ] Verify Quantity = Risk / (SL Difference × Exchange Rate)
- [ ] Check all calculations are shown in debug logs

## Debug Output Location

When hedge orders are placed, the calculations are logged to:
- Browser console (F12 → Console tab)
- Mobile debug overlay
- Log file (if logging service enabled)

Look for log entries containing:
- "🔄 Calculating hedge order"
- "📊 Hedge Price Calculation"
- "🏌️ Position Sizing Calculation"
- "📤 Placing hedge limit order with payload"

## Common Issues & Solutions

### Issue: SL Difference too small
**Cause:** new tighter 0.1% stop buffer
**Solution:** Adjust risk amount higher or recalibrate position sizing

### Issue: Positions too small
**Cause:** Tighter SL difference means smaller quantities
**Solution:** Increase risk amount or increase buffer percentage

### Issue: Setup orders getting filled immediately
**Cause:** Stop prices very close to entry prices (0.1% buffer)
**Solution:** Review market volatility; may need to adjust risk management

## Support

If formulas need adjustment:
1. Contact trading strategy team
2. Update `bufferPercentage` in config service (entry buffer)
3. Update hardcoded 0.1 in line 563/568 (stop buffer)
4. Test with small positions first
5. Monitor PnL before going live

---

**Last Updated:** 2025
**Format:** v1.0
**Language:** TypeScript / Angular
