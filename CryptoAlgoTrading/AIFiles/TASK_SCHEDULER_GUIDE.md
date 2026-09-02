# Task Scheduler Configuration Guide

## Overview

The CryptoCurrencyScanner now includes an advanced Task Scheduler system that allows you to configure and automate trading tasks with fine-grained control over execution timing, retry logic, and status tracking.

## Scheduled Tasks

### 1. **Place Limit Order** ⏰
- **Schedule**: Daily at a configurable time (default: 12:05 AM)
- **Purpose**: Automatically places limit orders for symbols based on technical analysis criteria
- **Configuration**:
  - `Enabled`: Toggle to enable/disable
  - `Daily Execution Time`: Set the time in HH:MM format (e.g., 00:05 for 12:05 AM)
  - `Retry on Failure`: Automatically retry if the task fails
  - `Max Retries`: Number of retry attempts (0-10, default: 3)

### 2. **Place Target & StopLoss** 🎯
- **Schedule**: Every 2 hours (configurable, range: 30-480 minutes)
- **Purpose**: Automatically places target and stop-loss orders for open positions
- **Configuration**:
  - `Enabled`: Toggle to enable/disable
  - `Execution Interval`: Set in minutes (minimum: 30, maximum: 480)
  - `Retry on Failure`: Automatically retry if the task fails
  - `Max Retries`: Number of retry attempts (0-10, default: 2)

### 3. **Update Trailing StopLoss** 📈
- **Schedule**: Daily at a configurable time (default: 12:05 AM)
- **Purpose**: Automatically updates trailing stop-loss for all active positions
- **Configuration**:
  - `Enabled`: Toggle to enable/disable
  - `Daily Execution Time`: Set the time in HH:MM format
  - `Retry on Failure`: Automatically retry if the task fails
  - `Max Retries`: Number of retry attempts (0-10, default: 3)

## Configuration Steps

1. **Open Settings**
   - Click the "Settings" button in the navigation bar

2. **Enable Task Scheduler**
   - Check "Enable Task Scheduler" in the "🕐 Task Scheduler Configuration" section

3. **Configure Each Task**
   - Toggle each task on/off as needed
   - Set execution times or intervals
   - Configure retry behavior

4. **Save Configuration**
   - Click "Save Changes" to persist your configuration
   - Configuration is saved to browser's localStorage

## Task Status Monitoring

### Console Logging
All task executions are logged to the browser console with detailed information:

```
✅ Task completed: Place Target & StopLoss (duration: 1234ms)
❌ Task failed: Update Trailing StopLoss - Error: API timeout
🔄 Retrying Place Limit Order in 5000ms (attempt 1/3)
```

### Status Component
The TaskStatusComponent displays:
- Current status of each task (Pending, Running, Completed, Failed)
- Last execution time and duration
- Next scheduled execution time
- Retry count
- Recent execution history (last 5 executions)
- Error messages if any

## Retry Logic

When a task fails and retry is enabled:

1. **Automatic Retries**: The system automatically retries up to the configured maximum
2. **Progressive Delays**: Retry delays increase with each attempt:
   - 1st retry: 5 seconds
   - 2nd retry: 10 seconds
   - 3rd retry: 15 seconds
   - And so on...

3. **Logging**: Each retry attempt is logged with the attempt number and delay

## Execution Guarantee

### Concurrent Execution Prevention
The scheduler prevents concurrent executions of the same task. If a task is still running when the next scheduled time arrives, that execution is skipped to prevent overlapping operations.

### Time-Based Scheduling
- **Daily Tasks**: Execute at the exact time specified (HH:MM format)
- **Interval Tasks**: Execute at regular intervals (e.g., every 2 hours)

### Rescheduling
After each execution, tasks are automatically rescheduled for the next occurrence.

## API Reference

### TaskSchedulerService

```typescript
// Register a new task
taskScheduler.registerTask(
  id: string,
  name: string,
  executor: () => Promise<void>,
  config: TaskScheduleConfig
): void

// Unregister a task
taskScheduler.unregisterTask(id: string): void

// Start a task
taskScheduler.startTask(id: string): void

// Stop a task
taskScheduler.stopTask(id: string): void

// Manually trigger a task
taskScheduler.triggerTask(id: string): Promise<void>

// Get task status observable
taskScheduler.getTaskStatus(id: string): Observable<TaskExecutionStatus>

// Get all task statuses
taskScheduler.getAllTaskStatuses(): Map<string, TaskExecutionStatus>

// Get execution history
taskScheduler.getTaskHistory(id: string): TaskExecutionHistory

// Update task configuration
taskScheduler.updateTaskConfig(id: string, config: Partial<TaskScheduleConfig>): void

// Clear execution history
taskScheduler.clearTaskHistory(id: string): void
```

## TaskScheduleConfig Interface

```typescript
interface TaskScheduleConfig {
  enabled: boolean;                    // Enable/disable the task
  scheduleType: 'daily' | 'hourly' | 'interval';  // Type of scheduling
  dailyTime?: string;                  // HH:MM format for daily tasks
  intervalMinutes?: number;            // For interval-based tasks
  retryOnFailure: boolean;            // Retry failed tasks
  maxRetries: number;                 // Maximum retry attempts
}
```

## TaskExecutionStatus Interface

```typescript
interface TaskExecutionStatus {
  taskId: string;
  taskName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: Date | null;
  endTime: Date | null;
  duration: number;                   // milliseconds
  error?: string;                     // Error message if failed
  retryCount: number;                 // Current retry attempt
  nextScheduledTime: Date | null;     // When task will run next
}
```

## Example: Daily Task at 12:05 AM

```typescript
// In component
const config = {
  enabled: true,
  scheduleType: 'daily',
  dailyTime: '00:05',      // 12:05 AM
  retryOnFailure: true,
  maxRetries: 3
};

this.taskScheduler.registerTask(
  'my-daily-task',
  'My Daily Task',
  async () => {
    console.log('Executing daily task...');
    // Your task logic here
  },
  config
);
```

## Example: Hourly Task Every 2 Hours

```typescript
// In component
const config = {
  enabled: true,
  scheduleType: 'hourly',
  intervalMinutes: 120,    // Every 2 hours
  retryOnFailure: true,
  maxRetries: 2
};

this.taskScheduler.registerTask(
  'my-hourly-task',
  'My Hourly Task',
  async () => {
    console.log('Executing hourly task...');
    // Your task logic here
  },
  config
);
```

## Common Use Cases

### 1. Trading at Market Open
Set "Place Limit Order" to execute at 9:00 AM daily:
```
Daily Execution Time: 09:00
Retry on Failure: Yes (3 retries)
```

### 2. Hourly Position Updates
Set "Place Target & StopLoss" to execute every 4 hours:
```
Execution Interval: 240 minutes
Retry on Failure: Yes (2 retries)
```

### 3. End-of-Day Cleanup
Set "Update Trailing StopLoss" to execute at 3:30 PM:
```
Daily Execution Time: 15:30
Retry on Failure: Yes (2 retries)
```

## Troubleshooting

### Task Not Executing
1. Check if scheduler is enabled in config
2. Check if specific task is enabled
3. Verify the time is in HH:MM format (24-hour)
4. Check browser console for error messages

### Task Failing Repeatedly
1. Check the error message in the Status component
2. Increase retry count if temporary network issues
3. Check if API rate limits are being hit
4. Verify credentials are still valid

### High CPU Usage
1. Reduce number of active tasks
2. Increase interval for interval-based tasks
3. Optimize task executor functions to be faster

## Performance Considerations

- **History Limit**: Only last 50 executions are kept in memory
- **Concurrent Execution**: Prevented for same task (no overlapping)
- **Memory Usage**: Minimal impact even with multiple tasks
- **Browser Load**: Negligible impact on browser performance

## Backward Compatibility

The new task scheduler is fully backward compatible with the legacy scheduler system. You can continue using the legacy scheduler if needed, though the new task scheduler provides significantly more flexibility and control.

## Support

For issues or feature requests related to the task scheduler, check the console logs and the task status component for detailed execution information.
