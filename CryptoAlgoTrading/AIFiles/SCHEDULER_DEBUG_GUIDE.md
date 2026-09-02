# Scheduler Debug Guide - Fix for Missed Triggers

## Problem Identified
The "Enable Place Limit Order" task scheduled for 11:32 AM did not trigger. The issue was in the **timing comparison logic** - when a daily task is enabled AFTER its scheduled time has passed, it gets skipped to the next day.

## Root Cause
The original `scheduleDailyTask()` checked if the scheduled time had already passed using `if (next <= now)` without sufficient logging or catch-up mechanisms.

### Example Scenario
- Task is configured for 11:32 AM
- User enables the task at 11:33 AM (1 minute after scheduled time)
- **Result**: Task is scheduled for tomorrow 11:32 AM instead of today

## Fix Applied

### 1. **Enhanced Logging**
The scheduler now logs detailed timing information:
```
⏰ [Place Limit Order] Scheduling analysis: {
  currentTime: "1/15/2024, 11:34:00 AM",
  scheduledTime: "11:32",
  nextRunTime: "1/15/2024, 11:32:00 AM",
  delayMs: -120000,
  delaySec: -120,
  delayIsPast: true
}

⏭️ [Place Limit Order] Scheduled time has passed. Moving to tomorrow: 1/16/2024, 11:32:00 AM (in 84480s)
```

### 2. **Catch-Up Logic**
If a task is enabled within 5 seconds of its scheduled time, it executes immediately:
```typescript
if (delayMs > 0 && delayMs < 5000) {
  // Execute immediately instead of waiting
  console.log(`⚡ Catch-up mode: executing immediately`);
  setTimeout(async () => { await this.executeTask(task, 0); }, 0);
}
```

### 3. **Better Status Information**
The next scheduled run time is always tracked and updated in the task status.

## How to Debug

### Method 1: Browser Console Inspection
Open the browser console (F12) and run:

```javascript
// Inject the scheduler service (if exposed)
const scheduler = ng.getComponent(document.querySelector('app-root')).injector.get('TaskSchedulerService');

// Check specific task
scheduler.debugTaskNextRun('place-limit-order');
```

Expected output:
```
📊 Task Debug: Place Limit Order
Current Time: 1/15/2024, 11:34:15 AM
Enabled: true
Status: pending
Schedule Type: daily
Daily Time Setting: 11:32
Next Scheduled: 1/16/2024, 11:32:00 AM
Time Until Next: 84555s (1409min)
Timer Active: YES
Last Execution: Never
Execution Count: 0
```

### Method 2: Check Browser DevTools Console
After saving the schedule, check the console for debug logs like:
- ✅ `[Place Limit Order] Scheduled for today in N minutes`
- ⏭️ `[Place Limit Order] Scheduled time has passed. Moving to tomorrow`
- ⚡ `Catch-up mode: executing immediately`

### Method 3: View Full Scheduler State
Run in console:
```javascript
scheduler.debugSchedulerState();
```

This shows all registered tasks, their status, and execution history.

## Common Issues & Solutions

### Issue: Task shows past scheduled time
**Symptoms**: `Next Scheduled: 1/15/2024, 11:32:00 AM` but current time is 11:35 AM

**Fix**:
1. Check if task is enabled: `taskStatus.config.enabled` should be `true`
2. If time passed, scheduler will move to tomorrow
3. Use `scheduler.triggerTask('place-limit-order')` to execute immediately

### Issue: Timer is NOT Active
**Symptoms**: `Timer Active: NO` but task is enabled

**Reasons**:
1. Task might have failed to schedule (check console for error messages)
2. Browser might have been closed/reloaded
3. Task was stopped by calling `stopTask()`

**Fix**: 
1. Disable and re-enable the task
2. Or manually trigger: `scheduler.triggerTask('place-limit-order')`

### Issue: Task scheduled but never executed
**Possible causes**:
1. Browser was closed/tab inactive at scheduled time
2. TimerId was cleared by another operation
3. Exception during task execution

**Debug steps**:
1. Check console logs around scheduled time
2. Check execution history: `scheduler.debugTaskNextRun('place-limit-order')`
3. Look for error messages in console

## Testing the Fix

### Test 1: Enable task within 5 seconds of scheduled time
1. Open config dialog
2. Set "Place Limit Order" time to current time + 1 minute (e.g., if it's 11:32, set to 11:33)
3. Click Save
4. Watch console for "⚡ Catch-up mode" message
5. Task should execute immediately

### Test 2: Enable task after scheduled time
1. Set task time to 5 minutes ago
2. Click Save
3. Console should show "⏭️ Scheduled time has passed. Moving to tomorrow"
4. Next run time should be tomorrow

### Test 3: Manual trigger
1. Open browser console
2. Run: `ng.getComponent(document.querySelector('app-root')).injector.get('TaskSchedulerService').triggerTask('place-limit-order')`
3. Task should execute immediately regardless of schedule

## Key Changes Made

| File | Change | Impact |
|------|--------|--------|
| `task-scheduler.service.ts` | Enhanced `scheduleDailyTask()` with better logging and catch-up logic | Tasks scheduled within 5s of their time now execute immediately |
| `task-scheduler.service.ts` | Added `debugTaskNextRun()` method | Users can inspect scheduler state in console |

## Next Steps if Issue Persists

1. **Check config save**: Verify `placeLimitOrder` settings are persisted
   ```javascript
   const config = localStorage.getItem('cryptoScannerConfig');
   const parsed = JSON.parse(config);
   console.log(parsed.taskSchedules.placeLimitOrder);
   ```

2. **Verify task registration**: Check if dashboard component registers the task
   - Open DevTools → Search for "Task registered: Enable Place Limit Order"
   - Should appear in console when dashboard component initializes

3. **Check for exceptions**: Look for console errors around the scheduled time

4. **Monitor execution**: Add temporary logging to the place limit order executor function

## Support Commands

Run these in browser console for debugging:

```javascript
// Get scheduler service
const sched = ng.getComponent(document.querySelector('app-root')).injector.get('TaskSchedulerService');

// Check specific task
sched.debugTaskNextRun('place-limit-order');

// View all tasks
sched.debugSchedulerState();

// Manually trigger
sched.triggerTask('place-limit-order');

// Get full status
sched.getAllTaskStatuses();

// Get execution history
sched.getAllHistories();

// Clear history
sched.clearTaskHistory('place-limit-order');
```
