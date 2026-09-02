# Automatic Trailing Stop Loss Scheduler

## Overview
The positions page now includes an **automatic daily scheduler** that triggers trailing stop-loss updates for all open positions at **12:05 AM every day**.

---

## Features Implemented

### 1. **Daily Automatic Trigger at 12:05 AM**
- The system automatically calculates time until next 12:05 AM
- Schedules a timer to trigger the trailing SL update
- After execution, automatically schedules the next day's trigger

### 2. **Auto-Update Toggle**
- **Button**: `🔔 Auto: ON` / `🔕 Auto: OFF`
- Located in the positions page header controls
- Allows users to enable/disable automatic updates
- State persists during the session

### 3. **Scheduler Status Display**
- New stat card in the header showing:
  - **Status**: ON (green) or OFF (red)
  - **Next Scheduled Time**: Shows when next update will run
  - Updates in real-time

### 4. **Safety Features**
- Will not trigger if already updating positions (prevents concurrent updates)
- Will not trigger if auto-update is disabled
- Reschedules automatically after each execution
- Handles component lifecycle properly (cleans up timers on destroy)

---

## How It Works

### Initialization
1. When the positions component loads, `setupDailyScheduler()` is called
2. Calculates the time until next 12:05 AM
3. Sets a timeout to trigger at that exact time
4. Also sets up a minute-by-minute check as a failsafe

### Daily Execution Flow
```
12:05 AM arrives
    ↓
Check if auto-update is enabled
    ↓
Reload positions (get latest data)
    ↓
Execute updateAllTrailingStopLoss()
    ↓
Update each position sequentially
    ↓
Show results modal
    ↓
Schedule next day's trigger
```

### Failsafe Mechanism
- Every minute, the system checks if it's 12:05 AM
- If the scheduled trigger somehow missed, this catches it
- Ensures reliability even with system time changes

---

## UI Components

### Scheduler Stat Card
```
🕐 Auto-Update
    Status: ON
Next: 12/15/2024, 12:05:00 AM
```

### Toggle Button
- **Enabled**: Green gradient, shows 🔔 Auto: ON
- **Disabled**: Gray with border, shows 🔕 Auto: OFF
- Smooth hover animations and transitions

---

## Technical Implementation

### Component Methods

#### `setupDailyScheduler()`
Initializes the scheduler system and starts the timers.

#### `scheduleNextTrigger()`
Calculates time until next 12:05 AM and sets the timeout.

#### `checkAndReschedule()`
Runs every minute to verify the schedule and catch missed triggers.

#### `triggerAutomaticTrailingSL()`
Executes the automatic update:
- Checks if enabled
- Reloads positions
- Runs trailing SL update
- Reschedules next trigger

#### `toggleAutoUpdate()`
Enables/disables automatic updates.

#### `loadPositionsPromise()`
Promise-based version of `loadPositions()` for use in async flows.

### Lifecycle Hooks
- **ngOnInit**: Sets up the scheduler
- **ngOnDestroy**: Cleans up timers to prevent memory leaks

---

## Console Logs

The scheduler provides detailed logging:

```
🕐 Daily Trailing SL scheduler initialized - Next trigger at 12:05 AM
📅 Next automatic trailing SL update scheduled for: 12/15/2024, 12:05:00 AM
⏰ Triggering scheduled trailing SL update now
🤖 Automatic trailing SL update triggered at 12:05 AM
⏭️ Automatic trailing SL update skipped (disabled by user)
🔄 Automatic trailing SL updates ENABLED
🔄 Automatic trailing SL updates DISABLED
```

---

## Usage Instructions

### Enable Auto-Update
1. Navigate to the Positions page
2. Click the **🔕 Auto: OFF** button
3. Status changes to **🔔 Auto: ON** (green)
4. Scheduler stat card shows next scheduled time

### Disable Auto-Update
1. Click the **🔔 Auto: ON** button
2. Status changes to **🔕 Auto: OFF** (gray)
3. Scheduled trigger will skip execution

### Manual Update (Anytime)
- Click **📈 Trailing SL** button to manually update all positions
- Works independently of the automatic scheduler
- Can be used even when auto-update is disabled

---

## Important Notes

### Time Zone
- Uses the **local system time** of the browser/computer
- 12:05 AM is in the user's local timezone

### Persistence
- Auto-update state does **NOT persist** across page refreshes
- Default state on load: **ENABLED**
- To persist state, user would need to toggle it each session OR we could implement localStorage

### Position Refresh
- Before each automatic update, positions are reloaded from the API
- Ensures calculations use the latest market data and position states

### Update Process
- Updates are processed **sequentially**, not in parallel
- Each position shows a spinner during its update
- Results are collected and shown in a modal after all updates complete

---

## Future Enhancements (Optional)

1. **Persist Auto-Update State**
   - Save enabled/disabled state to localStorage
   - Restore state on page load

2. **Configurable Schedule Time**
   - Allow users to choose their preferred update time
   - Multiple scheduled update times per day

3. **Email/SMS Notifications**
   - Send notifications when automatic updates complete
   - Alert on failures or important changes

4. **Update History**
   - Log all automatic updates with timestamps
   - Show success/failure statistics
   - Export history as CSV

5. **Conditional Updates**
   - Only update positions meeting certain criteria
   - Skip updates if market conditions are unfavorable

---

## Troubleshooting

### Scheduler Not Triggering
1. Check console for scheduler logs
2. Verify auto-update is enabled (button shows green)
3. Check system clock is correct
4. Refresh the page to reinitialize

### Multiple Triggers
- Component cleanup prevents this
- If you see duplicate triggers, check for multiple position component instances

### Missed Triggers
- Minute-by-minute failsafe catches missed triggers
- If computer sleeps/hibernates, trigger will run when system wakes if within the same minute

---

## Code Files Modified

1. **src/app/features/positions/positions.component.ts**
   - Added OnDestroy interface
   - Added scheduler state properties
   - Implemented scheduler methods
   - Added lifecycle cleanup

2. **src/app/features/positions/positions.component.html**
   - Added scheduler stat card
   - Added toggle button
   - Enhanced header layout

3. **src/styles.css**
   - Added `.btn-toggle` styles
   - Added `.scheduler-card` styles
   - Added enabled/disabled state colors

---

## Testing Recommendations

1. **Test Manual Toggle**
   - Toggle auto-update on/off multiple times
   - Verify UI updates correctly

2. **Test Time Calculation**
   - Check console for next scheduled time
   - Verify it calculates correctly based on current time

3. **Test Execution** (if possible)
   - Wait until 12:05 AM or temporarily modify the target time in code
   - Verify update triggers automatically
   - Check that next schedule is set for tomorrow

4. **Test Cleanup**
   - Navigate away from positions page
   - Check console for any errors
   - Navigate back and verify scheduler reinitializes

---

## Conclusion

The automatic trailing stop-loss scheduler provides a robust, user-friendly way to maintain stop-loss discipline without manual intervention. The system is designed with safety, reliability, and user control in mind.

**Key Benefits:**
- ✅ Set it and forget it
- ✅ Consistent daily execution
- ✅ User control with toggle
- ✅ Transparent status display
- ✅ Failsafe mechanisms
- ✅ Proper resource cleanup
