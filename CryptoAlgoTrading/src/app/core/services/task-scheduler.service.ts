import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, merge, debounceTime } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { ConfigService, TaskScheduleConfig } from './config.service';
import { BackgroundSchedulerService } from './background-scheduler.service';

export interface TaskExecutionStatus {
  taskId: string;
  taskName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: Date | null;
  endTime: Date | null;
  duration: number; // milliseconds
  error?: string;
  retryCount: number;
  nextScheduledTime: Date | null;
  results?: any; // Detailed execution results (can be array, object, etc.)
}

export interface TaskExecutionHistory {
  taskId: string;
  taskName: string;
  executions: TaskExecutionStatus[];
  lastExecution: TaskExecutionStatus | null;
}

export type TaskExecutor = () => Promise<void> | void;

interface ScheduledTask {
  id: string;
  name: string;
  executor: TaskExecutor;
  config: TaskScheduleConfig;
  timeoutId?: ReturnType<typeof setTimeout>;
  intervalId?: ReturnType<typeof setInterval>;
  lastExecution?: Date;
  status: BehaviorSubject<TaskExecutionStatus>;
}

@Injectable({
  providedIn: 'root'
})
export class TaskSchedulerService implements OnDestroy {
  private tasks = new Map<string, ScheduledTask>();
  private executionHistory = new Map<string, TaskExecutionHistory>();
  private historySubject = new BehaviorSubject<Map<string, TaskExecutionHistory>>(new Map());
  public history$ = this.historySubject.asObservable();

  private statusesSubject = new BehaviorSubject<Map<string, TaskExecutionStatus>>(new Map());
  public statuses$ = this.statusesSubject.asObservable();

  private destroy$ = new Subject<void>();
  private activeExecutions = new Set<string>();
  private isNativePlatform = false;

  constructor(
    private configService: ConfigService,
    private backgroundScheduler: BackgroundSchedulerService
  ) {
    console.log('TaskSchedulerService initialized');
    // Detect if running on native mobile platform
    this.isNativePlatform = (window as any).Capacitor !== undefined;
    console.log(`📱 Platform detected: ${this.isNativePlatform ? 'Mobile (Capacitor)' : 'Web'}`);
  }

  /**
   * Register a new scheduled task
   */
  registerTask(id: string, name: string, executor: TaskExecutor, config: TaskScheduleConfig): void {
    if (this.tasks.has(id)) {
      console.warn(`Task ${id} is already registered. Unregistering old instance and re-registering with new executor.`);
      const oldTask = this.tasks.get(id);
      // Stop the old task before re-registering
      if (oldTask) {
        this.stopTask(id);
      }
      this.unregisterTask(id);
    }

    const initialStatus: TaskExecutionStatus = {
      taskId: id,
      taskName: name,
      status: 'pending',
      startTime: null,
      endTime: null,
      duration: 0,
      retryCount: 0,
      nextScheduledTime: null
    };

    const task: ScheduledTask = {
      id,
      name,
      executor,
      config,
      status: new BehaviorSubject<TaskExecutionStatus>(initialStatus)
    };

    this.tasks.set(id, task);

    // Subscribe to task status changes and update the statuses observable
    // Use debounceTime to avoid excessive updates
    task.status
      .pipe(
        debounceTime(50),
        takeUntil(this.destroy$)
      )
      .subscribe((currentStatus) => {
        // Emit the updated statuses map whenever any task status changes
        this.emitStatusesUpdate();
      });

    // Initialize execution history
    if (!this.executionHistory.has(id)) {
      this.executionHistory.set(id, {
        taskId: id,
        taskName: name,
        executions: [],
        lastExecution: null
      });
    }


    // DO NOT auto-start tasks on registration
    // Tasks should only start in two scenarios:
    // 1. User explicitly clicks the button/action
    // 2. Scheduled time arrives (after manual start)
    // This prevents tasks from running on page load

    console.log(`📋 Task registered: ${name} (${id})`, {
      enabled: config.enabled,
      scheduleType: config.scheduleType,
      dailyTime: config.dailyTime,
      intervalMinutes: config.intervalMinutes,
      autoStart: false // ← Always false - do not auto-start
    });

    // Emit updated statuses after task registration
    const statuses = new Map<string, TaskExecutionStatus>();
    this.tasks.forEach((t, taskId) => {
      statuses.set(taskId, t.status.value);
    });
    this.statusesSubject.next(statuses);

    console.log(`✋ Task will NOT auto-start on registration. User must click button or wait for scheduled time.`);
  }

  /**
   * Unregister a task
   */
  unregisterTask(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      this.stopTask(id);
      this.tasks.delete(id);
      console.log(`Task unregistered: ${task.name} (${id})`);
    }
  }

  /**
   * Start/Enable a task
   */
  startTask(id: string): void {
    const task = this.tasks.get(id);
    if (!task) {
      console.error(`Task not found: ${id}`);
      return;
    }

    // Clear any existing scheduled execution
    if (task.timeoutId) clearTimeout(task.timeoutId);
    if (task.intervalId) clearInterval(task.intervalId);

    console.log(`🚀 [startTask] Starting task: ${task.name} (${id}) with schedule type: ${task.config.scheduleType}`);

    if (task.config.scheduleType === 'daily') {
      this.scheduleDailyTask(task);
    } else if (task.config.scheduleType === 'hourly' || task.config.scheduleType === 'interval') {
      this.scheduleIntervalTask(task);
    }
  }

  /**
   * Stop/Disable a task
   */
  stopTask(id: string): void {
    const task = this.tasks.get(id);
    if (!task) return;

    if (task.timeoutId) clearTimeout(task.timeoutId);
    if (task.intervalId) clearInterval(task.intervalId);

    const status = task.status.value;
    status.status = 'skipped';
    task.status.next(status);

    console.log(`Task stopped: ${task.name} (${id})`);
  }

  /**
   * Manually trigger a task execution
   */
  async triggerTask(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (!task) {
      console.error(`Task not found: ${id}`);
      return;
    }

    await this.executeTask(task, 0);
  }

  /**
   * Get the status of a specific task
   */
  getTaskStatus(id: string): Observable<TaskExecutionStatus> | null {
    const task = this.tasks.get(id);
    return task ? task.status.asObservable() : null;
  }

  /**
   * Get all task statuses
   */
  getAllTaskStatuses(): Map<string, TaskExecutionStatus> {
    const statuses = new Map<string, TaskExecutionStatus>();
    this.tasks.forEach((task, id) => {
      statuses.set(id, task.status.value);
    });
    return statuses;
  }

  /**
   * Internal method to emit updated statuses to subscribers
   */
  private emitStatusesUpdate(): void {
    const statuses = new Map<string, TaskExecutionStatus>();
    this.tasks.forEach((task, id) => {
      statuses.set(id, task.status.value);
    });
    this.statusesSubject.next(statuses);
  }

  /**
   * Get execution history for a specific task
   */
  getTaskHistory(id: string): TaskExecutionHistory | undefined {
    return this.executionHistory.get(id);
  }

  /**
   * Get all execution histories
   */
  getAllHistories(): Map<string, TaskExecutionHistory> {
    return new Map(this.executionHistory);
  }

  /**
   * Clear execution history for a task
   */
  clearTaskHistory(id: string): void {
    const history = this.executionHistory.get(id);
    if (history) {
      history.executions = [];
      history.lastExecution = null;
      this.historySubject.next(new Map(this.executionHistory));
    }
  }

  /**
   * Update the executor for an existing task
   */
  updateTaskExecutor(id: string, executor: TaskExecutor): void {
    const task = this.tasks.get(id);
    if (!task) {
      console.error(`❌ Cannot update executor for unknown task: ${id}`);
      return;
    }
    task.executor = executor;
    console.log(`✅ Updated executor for task: ${task.name} (${id})`);
  }

  /**
   * Update task configuration and restart if running
   */
  updateTaskConfig(id: string, config: Partial<TaskScheduleConfig>): void {
    const task = this.tasks.get(id);
    if (!task) {
      console.error(`❌ Cannot update config for unknown task: ${id}`);
      return;
    }

    const wasEnabled = task.config.enabled;
    const oldConfig = { ...task.config };
    task.config = { ...task.config, ...config };

    console.log(`🔄 Updated config for ${task.name} (${id}):`, {
      wasEnabled,
      isNowEnabled: task.config.enabled,
      oldDailyTime: oldConfig.dailyTime,
      newDailyTime: task.config.dailyTime,
      oldScheduleType: oldConfig.scheduleType,
      newScheduleType: task.config.scheduleType,
      receivedConfig: config
    });

    // Only restart if the task is ALREADY RUNNING
    // Do NOT start a stopped task, just update its configuration
    if (wasEnabled) {
      // Task was running, so restart it with the new config
      console.log(`🔁 Task was already running. Restarting with new config for ${task.name} (${id})`);
      this.stopTask(id); // Stop old scheduler
      if (task.config.enabled) {
        // If still enabled, restart it
        this.startTask(id);
      } else {
        // If now disabled, leave it stopped
        console.log(`⏸️  Task ${task.name} is now disabled, keeping it stopped`);
      }
    } else {
      // Task was NOT running, just update config without starting
      console.log(`✋ Task ${task.name} is not running. Config updated but NOT started (was: ${wasEnabled}, now: ${task.config.enabled})`);
    }
  }

  /**
   * Schedule a daily task
   */
  private scheduleDailyTask(task: ScheduledTask): void {
    // Clear any existing timeout
    if (task.timeoutId) {
      clearTimeout(task.timeoutId);
      task.timeoutId = undefined;
    }

    const timeStr = task.config.dailyTime || '00:00';

    // Parse time with error handling
    const timeParts = timeStr.split(':');
    if (timeParts.length !== 2) {
      console.error(`❌ Invalid time format for ${task.name}: ${timeStr}. Expected HH:MM format.`);
      return;
    }

    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error(`❌ Invalid time values for ${task.name}: hours=${hours}, minutes=${minutes}`);
      return;
    }

    const now = new Date();
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);

    // Calculate delay to scheduled time
    let delayMs = next.getTime() - now.getTime();

    // DEBUG: Log timing information
    console.log(`⏰ [${task.name}] Scheduling analysis:`, {
      currentTime: now.toLocaleString(),
      scheduledTime: timeStr,
      nextRunTime: next.toLocaleString(),
      delayMs,
      delaySec: Math.round(delayMs / 1000),
      delayIsPast: delayMs <= 0
    });

    // If the scheduled time has already passed today, schedule for tomorrow
    if (delayMs <= 0) {
      next.setDate(next.getDate() + 1);
      delayMs = next.getTime() - now.getTime();
      console.log(`⏭️  [${task.name}] Scheduled time has passed. Moving to tomorrow: ${next.toLocaleString()} (in ${Math.round(delayMs / 1000)}s)`);
    } else {
      // Time is in the future today
      const minutesUntil = Math.round(delayMs / 60000);
      console.log(`✅ [${task.name}] Scheduled for today in ${minutesUntil} minutes at ${next.toLocaleString()}`);
    }

    // Create a new status object instead of mutating
    const currentStatus = task.status.value;
    const updatedStatus: TaskExecutionStatus = {
      ...currentStatus,
      nextScheduledTime: next
    };
    task.status.next(updatedStatus);

    console.log(`📅 ${task.name} will execute at ${next.toLocaleString()} (in ${Math.round(delayMs / 1000)}s)`);

    // Normal scheduling: use the calculated delay
    // DO NOT execute immediately even if delay is small
    // ON MOBILE: Use native background scheduler for reliable execution when phone is locked
    if (this.isNativePlatform) {
      console.log(`[${task.name}] Using native background scheduler for mobile (Capacitor)`);
      this.backgroundScheduler.scheduleJobAt(
        task.name,
        next,
        async () => {
          console.log(`Executing ${task.name} at ${new Date().toLocaleString()}`);
          await this.executeTask(task, 0);
          // Reschedule for next day
          this.scheduleDailyTask(task);
        }
      ).catch((error: any) => {
        console.error(`Failed to schedule job on native platform: ${task.name}`, error);
        // Fallback to web timer
        this.scheduleWebTimer(task, next);
      });
    } else {
      // ON WEB: Use JavaScript timer
      this.scheduleWebTimer(task, next);
    }
  }

  /**
   * Schedule a web timer for a task at a specific time
   */
  private scheduleWebTimer(task: ScheduledTask, nextRunTime: Date): void {
    const now = new Date();
    const delayMs = nextRunTime.getTime() - now.getTime();

    task.timeoutId = setTimeout(async () => {
      console.log(`Executing ${task.name} at ${new Date().toLocaleString()}`);
      await this.executeTask(task, 0);
      // Reschedule for next day
      this.scheduleDailyTask(task);
    }, delayMs);
    console.log(`[${task.name}] setTimeout ID: ${task.timeoutId} - Task will execute at ${nextRunTime.toLocaleString()}`);
  }

  /**
   * Schedule an interval-based task
   */
  private scheduleIntervalTask(task: ScheduledTask): void {
    // Clear any existing interval
    if (task.intervalId) {
      clearInterval(task.intervalId);
      task.intervalId = undefined;
    }

    const intervalMinutes = task.config.intervalMinutes || 60;

    if (intervalMinutes < 1 || intervalMinutes > 1440) {
      console.error(`Invalid interval for ${task.name}: ${intervalMinutes}. Expected 1-1440 minutes.`);
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;

    // Create new status object instead of mutating
    const currentStatus = task.status.value;
    const updatedStatus: TaskExecutionStatus = {
      ...currentStatus,
      nextScheduledTime: new Date(Date.now() + intervalMs)
    };
    task.status.next(updatedStatus);

    // ON MOBILE: Use native background scheduler for reliable execution when phone is locked
    if (this.isNativePlatform) {
      console.log(`[${task.name}] Using native background scheduler for interval monitoring (Capacitor)`);
      this.backgroundScheduler.scheduleJob(
        task.name,
        intervalMinutes,
        async () => {
          console.log(`Executing ${task.name} at ${new Date().toLocaleString()}`);
          await this.executeTask(task, 0);
        }
      ).catch((error: any) => {
        console.error(`Failed to schedule job on native platform: ${task.name}`, error);
        // Fallback to web timer
        this.scheduleWebInterval(task, intervalMs);
      });
    } else {
      // ON WEB: Use JavaScript interval
      this.scheduleWebInterval(task, intervalMs);
    }

    console.log(`[${task.name}] scheduled to run every ${intervalMinutes} minutes`);
  }

  /**
   * Schedule a web interval for a task
   */
  private scheduleWebInterval(task: ScheduledTask, intervalMs: number): void {
    // DO NOT execute immediately on first run
    // Only execute when scheduled time arrives or manual trigger happens
    const intervalMinutes = Math.round(intervalMs / 60000);
    console.log(`[${task.name}] scheduled to run every ${intervalMinutes} minutes. First execution will occur after ${intervalMinutes} minutes.`);

    // Schedule repeating execution (first run after initial interval)
    task.intervalId = setInterval(() => {
      console.log(`[${task.name}] executing at ${new Date().toLocaleString()}`);
      this.executeTask(task, 0);
    }, intervalMs);
  }

  /**
   * Execute a task with retry logic
   */
  private async executeTask(task: ScheduledTask, retryAttempt: number): Promise<void> {
    // Prevent concurrent executions of the same task
    if (this.activeExecutions.has(task.id)) {
      console.warn(`Task ${task.name} is already running, skipping this execution`);
      return;
    }

    this.activeExecutions.add(task.id);
    const startTime = new Date();
    const previousStatus = task.status.value;

    const status: TaskExecutionStatus = {
      taskId: task.id,
      taskName: task.name,
      status: 'running',
      startTime,
      endTime: null,
      duration: 0,
      retryCount: retryAttempt,
      nextScheduledTime: previousStatus?.nextScheduledTime || null
    };

    task.status.next(status);
    console.log(`[${startTime.toLocaleTimeString()}] Executing task: ${task.name}`, status);

    try {
      console.log(`🚀 [executeTask] About to execute: ${task.name}`);
      await task.executor();
      console.log(`🏁 [executeTask] Executor finished for: ${task.name}`);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // IMPORTANT: Use current task.status.value as base, not the initial status
      // This ensures any results recorded by the executor are preserved
      const currentTaskStatus = task.status.value;
      const successStatus: TaskExecutionStatus = {
        ...currentTaskStatus,
        status: 'completed',
        endTime,
        duration
      };

      task.status.next(successStatus);
      task.lastExecution = startTime;

      this.recordExecution(task.id, successStatus);
      console.log(`✅ Task completed: ${task.name} (duration: ${duration}ms)`);

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.error(`❌ Task failed: ${task.name}`, errorMessage);

      // Get current task status (which may have been updated by the executor)
      const currentTaskStatus = task.status.value;

      // Retry logic
      if (task.config.retryOnFailure && retryAttempt < task.config.maxRetries) {
        const nextRetry = retryAttempt + 1;
        const retryDelay = 5000 * (nextRetry);  // 5s, 10s, 15s, etc.

        console.log(`Retrying ${task.name} in ${retryDelay}ms (attempt ${nextRetry}/${task.config.maxRetries})`);

        const failedStatus: TaskExecutionStatus = {
          ...currentTaskStatus,
          status: 'failed',
          endTime,
          duration,
          error: `${errorMessage} - will retry`,
          retryCount: nextRetry
        };

        task.status.next(failedStatus);
        this.recordExecution(task.id, failedStatus);

        setTimeout(() => {
          this.executeTask(task, nextRetry);
        }, retryDelay);

      } else {
        const finalStatus: TaskExecutionStatus = {
          ...currentTaskStatus,
          status: 'failed',
          endTime,
          duration,
          error: errorMessage,
          retryCount: retryAttempt
        };

        task.status.next(finalStatus);
        this.recordExecution(task.id, finalStatus);
      }
    } finally {
      this.activeExecutions.delete(task.id);
    }
  }

  /**
   * Record execution in history
   */
  private recordExecution(taskId: string, status: TaskExecutionStatus): void {
    const history = this.executionHistory.get(taskId);
    if (history) {
      history.executions.push({ ...status });
      history.lastExecution = { ...status };

      // Keep only last 50 executions to avoid memory bloat
      if (history.executions.length > 50) {
        history.executions = history.executions.slice(-50);
      }

      this.historySubject.next(new Map(this.executionHistory));
    }
  }

  /**
   * Debug method to inspect scheduler state (call from browser console)
   */
  debugSchedulerState(): void {
    console.group('🔍 Scheduler State Debug');
    console.log('Current Time:', new Date().toLocaleString());
    console.log('Active Executions:', Array.from(this.activeExecutions));

    console.group('📋 Registered Tasks');
    this.tasks.forEach((task, id) => {
      const status = task.status.value;
      console.log(`\n🔹 ${task.name} (${id})`);
      console.log('  Enabled:', task.config.enabled);
      console.log('  Schedule Type:', task.config.scheduleType);
      console.log('  Daily Time:', task.config.dailyTime);
      console.log('  Interval (min):', task.config.intervalMinutes);
      console.log('  Current Status:', status.status);
      console.log('  Next Scheduled:', status.nextScheduledTime?.toLocaleString() || 'Not scheduled');
      console.log('  Last Run:', status.startTime?.toLocaleString() || 'Never');
      console.log('  Error:', status.error || 'None');
    });
    console.groupEnd();

    console.group('📊 Execution History');
    this.executionHistory.forEach((history, id) => {
      console.log(`${history.taskName}: ${history.executions.length} executions`);
      if (history.lastExecution) {
        console.log(`  Last: ${history.lastExecution.status} at ${history.lastExecution.startTime?.toLocaleString()}`);
      }
    });
    console.groupEnd();

    console.groupEnd();
  }

  /**
   * Manually trigger task immediately (for testing)
   */
  debugTriggerTask(id: string): void {
    const task = this.tasks.get(id);
    if (!task) {
      console.error(`❌ Task not found: ${id}`);
      return;
    }
    console.log(`🔄 Manually triggering task: ${task.name}`);
    this.executeTask(task, 0);
  }

  /**
   * Diagnostic method to check specific task's next scheduled time
   */
  debugTaskNextRun(id: string): void {
    const task = this.tasks.get(id);
    if (!task) {
      console.error(`❌ Task not found: ${id}`);
      return;
    }

    const status = task.status.value;
    const now = new Date();
    const nextRun = status.nextScheduledTime;

    console.group(`📊 Task Debug: ${task.name}`);
    console.log(`Current Time: ${now.toLocaleString()}`);
    console.log(`Enabled: ${task.config.enabled}`);
    console.log(`Status: ${status.status}`);
    console.log(`Schedule Type: ${task.config.scheduleType}`);

    if (task.config.scheduleType === 'daily') {
      console.log(`Daily Time Setting: ${task.config.dailyTime}`);
      if (nextRun) {
        const delayMs = nextRun.getTime() - now.getTime();
        console.log(`Next Scheduled: ${nextRun.toLocaleString()}`);
        console.log(`Time Until Next: ${Math.round(delayMs / 1000)}s (${Math.round(delayMs / 60000)}min)`);
        console.log(`Timer Active: ${task.timeoutId !== undefined ? 'YES' : 'NO'}`);

        if (delayMs < 0) {
          console.warn(`⚠️  Next scheduled time is in the PAST! This task should have already executed.`);
        } else if (delayMs < 60000) {
          console.warn(`⚠️  Task will execute in less than 1 minute.`);
        }
      }
    } else if (task.config.scheduleType === 'interval' || task.config.scheduleType === 'hourly') {
      console.log(`Interval (minutes): ${task.config.intervalMinutes}`);
      console.log(`Interval Active: ${task.intervalId !== undefined ? 'YES' : 'NO'}`);
    }

    console.log(`\nLast Execution: ${status.startTime?.toLocaleString() || 'Never'}`);
    console.log(`Execution Count: ${this.executionHistory.get(id)?.executions.length || 0}`);

    if (status.error) {
      console.error(`Last Error: ${status.error}`);
    }

    console.groupEnd();
  }

  /**
   * Record execution results for a task (called by task executors to store detailed results)
   */
  recordTaskResults(taskId: string, results: any): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.error(`❌ [recordTaskResults] Task not found: ${taskId}`);
      return;
    }

    console.log(`🔍 [recordTaskResults] Recording results for task: ${taskId}`, {
      taskName: task.name,
      hasResults: !!results,
      resultsLength: Array.isArray(results) ? results.length : 'not-array'
    });

    // IMPORTANT: Create a new object, don't mutate the existing one!
    // This ensures RxJS will detect the change and emit a new value
    const currentStatus = task.status.value;
    const newStatus: TaskExecutionStatus = {
      ...currentStatus,
      results: results
    };

    task.status.next(newStatus);

    console.log(`✅ [recordTaskResults] Status updated for ${taskId} with results:`, results);

    // Also update in history
    const history = this.executionHistory.get(taskId);
    if (history && history.lastExecution) {
      console.log(`📝 [recordTaskResults] Updating lastExecution in history for ${taskId}`);
      // Create a new execution object with results
      history.lastExecution = {
        ...history.lastExecution,
        results: results
      };

      // Also update the last execution in the executions array
      if (history.executions.length > 0) {
        const lastIndex = history.executions.length - 1;
        history.executions[lastIndex] = {
          ...history.executions[lastIndex],
          results: results
        };
        console.log(`📝 [recordTaskResults] Updated executions array item at index ${lastIndex}`);
      }
    } else {
      console.warn(`⚠️  [recordTaskResults] No history or lastExecution found for ${taskId}`);
    }

    // Emit updates to subscribers
    this.historySubject.next(new Map(this.executionHistory));
    console.log(`📊 [recordTaskResults] Emitted historySubject update`);

    // CRITICAL: Force immediate emission of statuses update (bypass debounce for results)
    // This ensures the Details button appears immediately when results are recorded
    this.emitStatusesUpdate();
    console.log(`📊 [recordTaskResults] Force-emitted statusesSubject update`);
  }

  ngOnDestroy(): void {
    // Clean up all tasks
    this.tasks.forEach((task) => {
      this.stopTask(task.id);
    });
    this.destroy$.next();
    this.destroy$.complete();
  }
}
