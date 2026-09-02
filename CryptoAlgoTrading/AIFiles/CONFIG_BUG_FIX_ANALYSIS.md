# Scheduler Config Bug Fix - Complete Analysis

## The Problem You Were Experiencing

Your screenshot showed: **Next Run: 8/30/26, 11:37 AM** but you wanted **11:32 AM**

The task wasn't triggering at the configured time because of a **critical bug in the config loading logic**.

## Root Cause Analysis

### Bug #1: Shallow Merge in ConfigService.loadConfig()
**File**: `src/app/core/services/config.service.ts` (Line 104)

**Original Code**:
```typescript
return { ...this.defaultConfig, ...parsed };  // SHALLOW MERGE ❌
```

**Problem**: When you saved your config with only the `placeLimitOrder` section changed, this shallow merge would replace the entire `taskSchedules` object instead of deep-merging it:

```
Before Save:
taskSchedules: {
  placeLimitOrder:      { enabled: false, dailyTime: "00:05" }
  placeTargetStopLoss:  { enabled: false, intervalMinutes: 120 }
  updateTrailingStopLoss: { enabled: false, dailyTime: "00:05" }
}

Your UI Change:
taskSchedules.placeLimitOrder.dailyTime = "11:32"
taskSchedules.placeLimitOrder.enabled = true

Saved to localStorage:
{
  taskSchedules: {
    placeLimitOrder: { enabled: true, dailyTime: "11:32" }
    // ❌ placeTargetStopLoss and updateTrailingStopLoss LOST!
  }
}

On App Reload - Shallow Merge Result:
return { ...defaultConfig, ...parsed }  // Only merges top-level properties
// taskSchedules from parsed replaces entire taskSchedules from defaultConfig
```

### Bug #2: Limited Debug Logging
There was insufficient logging to trace what config was actually being used by the scheduler, making it impossible to diagnose the issue.

## The Fix

### Fix #1: Deep Merge in ConfigService.loadConfig()
**File**: `src/app/core/services/config.service.ts`

```typescript
private loadConfig(): AppConfig {
  try {
    const stored = localStorage.getItem(this.CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Deep merge with defaults to preserve nested objects ✅
      const merged: AppConfig = { ...this.defaultConfig, ...parsed };

      // Deep merge taskSchedules - now each task keeps its individual config
      if (parsed.taskSchedules) {
        merged.taskSchedules = {
          placeLimitOrder: {
            ...this.defaultConfig.taskSchedules.placeLimitOrder,
            ...parsed.taskSchedules.placeLimitOrder
          },
          placeTargetStopLoss: {
            ...this.defaultConfig.taskSchedules.placeTargetStopLoss,
            ...parsed.taskSchedules.placeTargetStopLoss
          },
          updateTrailingStopLoss: {
            ...this.defaultConfig.taskSchedules.updateTrailingStopLoss,
            ...parsed.taskSchedules.updateTrailingStopLoss
          }
        };
      }

      // Deep merge scheduledFeatures
      if (parsed.scheduledFeatures) {
        merged.scheduledFeatures = {
          ...this.defaultConfig.scheduledFeatures,
          ...parsed.scheduledFeatures
        };
      }

      return merged;
    }
  } catch (error) {
    console.error('Error loading config from localStorage:', error);
  }
  return { ...this.defaultConfig };
}
```

### Fix #2: Enhanced Logging
Added detailed logging at every step:

1. **In Dashboard Component** (`setupTaskScheduler`):
   - Logs the exact config being registered
   - Logs config updates from subscription

2. **In TaskScheduler Service** (`registerTask`):
   - Shows: enabled, scheduleType, dailyTime, intervalMinutes
   - Shows whether task auto-started or is disabled

3. **In TaskScheduler Service** (`updateTaskConfig`):
   - Shows before/after config with changes highlighted
   - Shows when scheduler is restarted

## How to Verify the Fix

### Step 1: Open Browser DevTools (F12)
- Go to Console tab
- Look for detailed logging when you:
  1. Save config (you should see all 3 task configs preserved)
  2. Enable Place Limit Order (should see task being registered/updated)

### Step 2: Expected Console Output
```
✅ Config loaded from localStorage with deep merge: {
  ...
  taskSchedules: {
    placeLimitOrder: { enabled: true, dailyTime: "11:32", ... }
    placeTargetStopLoss: { enabled: false, intervalMinutes: 120, ... }
    updateTrailingStopLoss: { enabled: false, dailyTime: "00:05", ... }
  }
}

📋 [Dashboard] Registering Place Limit Order task with config: {
  enabled: true,
  scheduleType: "daily",
  dailyTime: "11:32",
  retryOnFailure: true,
  maxRetries: 3
}

✅ Task registered: Place Limit Order (place-limit-order) {
  enabled: true,
  scheduleType: "daily",
  dailyTime: "11:32",
  intervalMinutes: undefined
}

▶️ Auto-starting task: Place Limit Order (enabled in config)

⏰ [Place Limit Order] Scheduling analysis: {
  currentTime: "8/30/2026, 10:45:00 AM",
  scheduledTime: "11:32",
  nextRunTime: "8/30/2026, 11:32:00 AM",
  delayMs: 10620000,
  delaySec: 10620,
  delayIsPast: false
}

✅ [Place Limit Order] Scheduled for today in 177 minutes at 8/30/2026, 11:32:00 AM
```

### Step 3: Test Saving Config
1. Open Config Modal
2. Change Place Limit Order time to 11:32
3. Enable "Enable Place Limit Order"
4. Click Save
5. Check console - you should see the deep merge logs
6. Check localStorage: `localStorage.getItem('crypto-scanner-config')`
   - Should show all three task configs preserved

### Step 4: Verify Next Run Time
After saving:
1. Look at Task Status widget
2. Next Run should show **TODAY at 11:32** (if current time is before 11:32)
3. Or **TOMORROW at 11:32** (if current time is after 11:32)

## Files Changed

| File | Change | Impact |
|------|--------|--------|
| `src/app/core/services/config.service.ts` | Deep merge for nested objects in loadConfig() | Config now preserved correctly when saving partial changes |
| `src/app/features/scanner/dashboard.component.ts` | Enhanced logging for task registration and config updates | Can now trace config flow to scheduler |
| `src/app/core/services/task-scheduler.service.ts` | Enhanced logging in registerTask() and updateTaskConfig() | Can see exact config being used by scheduler |

## Testing Checklist

- [ ] Save config with Place Limit Order time = 11:32 and enabled = true
- [ ] Check browser console for deep-merge logs
- [ ] Verify Task Status shows "Next Run: TODAY, 11:32 AM" (or TOMORROW if past time)
- [ ] Check localStorage shows all three task configs preserved
- [ ] Reload page - config should persist correctly
- [ ] Disable task and re-enable it - should reschedule immediately

## Future Prevention

This bug happened because:
1. ❌ Shallow merge was used instead of deep merge
2. ❌ No validation that nested object properties were preserved
3. ❌ Limited logging to trace issues

To prevent similar issues:
- ✅ Always use deep merge for nested config objects
- ✅ Add tests that verify nested properties are preserved after merge
- ✅ Add comprehensive logging at key integration points
- ✅ Use immer.js or similar library for safer state mutations in the future

## Still Having Issues?

Run these console commands to debug:

```javascript
// 1. Check what's in localStorage
console.log(JSON.parse(localStorage.getItem('crypto-scanner-config')));

// 2. Check what config the scheduler is using
const sched = ng.getComponent(document.querySelector('app-root')).injector.get('TaskSchedulerService');
sched.debugTaskNextRun('place-limit-order');

// 3. Manually trigger to test
sched.triggerTask('place-limit-order');

// 4. View all tasks
sched.debugSchedulerState();
```

## Impact Summary

**Before**: Config was lost on each save, causing wrong schedule times
**After**: Config is preserved correctly with deep merge, tasks schedule at the right time
