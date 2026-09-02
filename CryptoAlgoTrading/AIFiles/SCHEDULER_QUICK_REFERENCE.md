# Quick Reference - Task Scheduler

## Three Scheduled Tasks

### 1️⃣ Place Limit Order
- **Default**: Daily at 12:05 AM
- **Configure in**: Settings → Place Limit Order & Update Trailing SL section
- **Retry**: Yes (3 times by default)

### 2️⃣ Place Target & StopLoss  
- **Default**: Every 2 hours
- **Configure in**: Settings → Place Target & StopLoss section
- **Retry**: Yes (2 times by default)

### 3️⃣ Update Trailing StopLoss
- **Default**: Daily at 12:05 AM
- **Configure in**: Settings → Place Limit Order & Update Trailing SL section
- **Retry**: Yes (3 times by default)

## How to Configure

1. Click **Settings** button (purple gear icon)
2. Check **"Enable Task Scheduler"**
3. For each task:
   - ✅ Check "Enable [Task Name]"
   - Set time (HH:MM format) or interval (minutes)
   - Configure retry settings if needed
4. Click **Save Changes**

## Monitor Task Status

- Open browser **Console** (F12 → Console tab)
- Look for log messages like:
  - ✅ Task completed: Place Target & StopLoss
  - ❌ Task failed: Update Trailing StopLoss
  - 🔄 Retrying Place Limit Order

## Default Configuration

| Task | Time | Interval | Retry |
|------|------|----------|-------|
| Place Limit Order | 00:05 (12:05 AM) | - | 3x |
| Place Target & SL | - | 120 min (2h) | 2x |
| Update Trailing SL | 00:05 (12:05 AM) | - | 3x |

## Time Format

Use **24-hour format** (HH:MM):
- 12:05 AM = **00:05**
- 9:00 AM = **09:00**
- 3:30 PM = **15:30**
- 11:59 PM = **23:59**

## Common Issues

**Task not executing?**
1. Check "Enable Task Scheduler" is ON
2. Check individual task is "Enabled"
3. Verify time format is HH:MM
4. Check browser console for errors

**Task failing?**
1. Check console for error message
2. Increase max retries
3. Verify API credentials are valid
4. Check network connection

## Reset to Defaults

1. Open Settings
2. Click **"Reset to Defaults"** button
3. Default configuration will be restored

## Files Involved

- **Config**: `src/app/core/services/config.service.ts`
- **Scheduler**: `src/app/core/services/task-scheduler.service.ts` (NEW)
- **Status Display**: `src/app/features/task-status/task-status.component.ts` (NEW)
- **Config UI**: `src/app/features/config/config.component.html`
- **Positions Task**: `src/app/features/positions/positions.component.ts`
- **Scanner Task**: `src/app/features/scanner/dashboard.component.ts`

## Documentation

See `TASK_SCHEDULER_GUIDE.md` for complete documentation and API reference.
