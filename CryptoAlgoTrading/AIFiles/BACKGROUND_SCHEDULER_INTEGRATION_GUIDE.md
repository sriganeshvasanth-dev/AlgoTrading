# Integration Guide: Background Scheduler Service

## Quick Start (5 minutes)

### Step 1: The Service is Already Created
The service file has been created at:
```
src/app/core/services/background-scheduler.service.ts
```

### Step 2: Install Dependencies
```bash
npm install @capacitor/local-notifications @capacitor/app
npx cap sync android
```

### Step 3: Inject into Your Component/Service
```typescript
import { BackgroundSchedulerService } from '@app/core/services/background-scheduler.service';

export class YourComponent {
  constructor(private bgScheduler: BackgroundSchedulerService) {}

  setupJobs() {
    // Schedule recurring job
    this.bgScheduler.scheduleJob(
      'Place Targets & Stop Loss',
      5,  // Every 5 minutes
      () => this.placeTargets()
    );
  }
}
```

### Step 4: Update AndroidManifest.xml
See instructions in `MOBILE_BACKGROUND_SCHEDULER_IMPLEMENTATION.md`

### Step 5: Build and Test
```bash
npm run build:prod
npx cap sync android
npm run build:android
```

---

## Integration Examples

### Example 1: Use in TaskSchedulerService

**Current code (web-only):**
```typescript
private scheduleIntervalTask(task: ScheduledTask): void {
  const intervalMs = task.config.intervalMinutes * 60 * 1000;

  task.intervalId = setInterval(() => {
    this.executeTask(task, 0);
  }, intervalMs);
}
```

**Updated code (web + mobile):**
```typescript
import { BackgroundSchedulerService } from './background-scheduler.service';

export class TaskSchedulerService {
  constructor(
    private configService: ConfigService,
    private bgScheduler: BackgroundSchedulerService
  ) {}

  private scheduleIntervalTask(task: ScheduledTask): void {
    // Automatically uses native scheduling on mobile, JS timers on web
    this.bgScheduler.scheduleJob(
      task.name,
      task.config.intervalMinutes || 60,
      () => this.executeTask(task, 0)
    );
  }
}
```

### Example 2: Use in PositionsComponent

**Current code:**
```typescript
export class PositionsComponent {
  ngOnInit() {
    // Refresh every 5 minutes (stops when app is backgrounded)
    setInterval(() => {
      this.loadPositions();
    }, 5 * 60 * 1000);
  }
}
```

**Updated code:**
```typescript
import { BackgroundSchedulerService } from '@app/core/services/background-scheduler.service';

export class PositionsComponent {
  constructor(private bgScheduler: BackgroundSchedulerService) {}

  ngOnInit() {
    // Refresh every 5 minutes (continues even when backgrounded!)
    this.bgScheduler.scheduleJob(
      'Load Positions',
      5,
      () => this.loadPositions()
    );
  }
}
```

### Example 3: Use in DashboardComponent

```typescript
export class DashboardComponent {
  constructor(private bgScheduler: BackgroundSchedulerService) {}

  startScanning() {
    // Start crypto scanning every 10 minutes
    this.bgScheduler.scheduleJob(
      'Scan Crypto Data',
      10,
      async () => {
        const data = await this.scanCrypto();
        console.log('Scanned:', data);
      }
    );
  }

  stopScanning() {
    this.bgScheduler.cancelJob('Scan Crypto Data');
  }

  viewScheduledJobs() {
    const jobs = this.bgScheduler.getScheduledJobs();
    console.log('Active jobs:', jobs);
  }
}
```

### Example 4: One-Time Job

```typescript
scheduleOrderAtTime() {
  const executionTime = new Date();
  executionTime.setMinutes(executionTime.getMinutes() + 30); // 30 minutes from now

  this.bgScheduler.scheduleJobAt(
    'Place Market Order',
    executionTime,
    () => {
      console.log('Placing order...');
      this.placeMarketOrder();
    }
  );
}
```

---

## API Reference

### scheduleJob()
Schedule a recurring job that runs at regular intervals.

```typescript
async scheduleJob(
  jobName: string,              // Name of the job
  intervalMinutes: number,      // Interval in minutes (1-1440)
  callback: () => void | Promise<void>  // Function to execute
): Promise<void>
```

**Examples:**
```typescript
// Simple job
this.bgScheduler.scheduleJob('MyJob', 5, () => {
  console.log('Running every 5 minutes');
});

// Async job
this.bgScheduler.scheduleJob('MyAsyncJob', 10, async () => {
  const data = await this.fetchData();
  this.processData(data);
});
```

---

### scheduleJobAt()
Schedule a one-time job to run at a specific date/time.

```typescript
async scheduleJobAt(
  jobName: string,              // Name of the job
  scheduledTime: Date,          // When to run
  callback: () => void | Promise<void>  // Function to execute
): Promise<void>
```

**Examples:**
```typescript
// Run in 5 minutes
const time = new Date();
time.setMinutes(time.getMinutes() + 5);
this.bgScheduler.scheduleJobAt('DelayedJob', time, () => {
  console.log('Running after 5 minutes');
});

// Run at specific time
const targetTime = new Date('2024-01-15 10:00:00');
this.bgScheduler.scheduleJobAt('SpecificJob', targetTime, () => {
  this.executeSpecificTask();
});
```

---

### cancelJob()
Cancel a specific scheduled job by name.

```typescript
async cancelJob(jobName: string): Promise<void>
```

**Example:**
```typescript
this.bgScheduler.cancelJob('MyJob');
```

---

### clearAllJobs()
Cancel all scheduled jobs.

```typescript
async clearAllJobs(): Promise<void>
```

**Example:**
```typescript
// Clear everything when logging out
this.bgScheduler.clearAllJobs();
```

---

### getScheduledJobs()
Get information about all active jobs.

```typescript
getScheduledJobs(): {
  webJobs: string[];
  mobileJobs: Array<{
    id: string;
    name: string;
    interval?: number;
    createdAt: Date;
  }>;
  platform: 'mobile' | 'web';
}
```

**Example:**
```typescript
const jobs = this.bgScheduler.getScheduledJobs();
console.log(`Running on ${jobs.platform}`);
console.log(`Active jobs: ${jobs.webJobs.length + jobs.mobileJobs.length}`);
```

---

### isRunningOnMobile()
Check if the app is running on mobile platform.

```typescript
isRunningOnMobile(): boolean
```

**Example:**
```typescript
if (this.bgScheduler.isRunningOnMobile()) {
  console.log('Running on Android/iOS');
} else {
  console.log('Running in web browser');
}
```

---

## Real-World Example: Target/Stop Loss Scheduler

Your current positions component could use it like this:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { BackgroundSchedulerService } from '@app/core/services/background-scheduler.service';
import { TargetStoplossManagerService } from '@app/core/services/target-stoploss-manager.service';

@Component({
  selector: 'app-positions',
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.css']
})
export class PositionsComponent implements OnInit, OnDestroy {
  private jobName = 'Place Targets & Stop Loss';

  constructor(
    private bgScheduler: BackgroundSchedulerService,
    private targetManager: TargetStoplossManagerService
  ) {}

  ngOnInit() {
    // Get scheduler config
    const configuredInterval = 5; // or fetch from config

    // Schedule the job (works on web AND mobile now!)
    this.bgScheduler.scheduleJob(
      this.jobName,
      configuredInterval,
      () => this.executeTargetAndStopLoss()
    );
  }

  async executeTargetAndStopLoss() {
    try {
      console.log(`[${new Date().toLocaleTimeString()}] Executing target/stop loss placement...`);
      await this.targetManager.placeTargetsAndStopLossForAllPositions();
      console.log('✅ Target/Stop loss placement completed');
    } catch (error) {
      console.error('❌ Failed to place target/stop loss:', error);
    }
  }

  viewScheduledJobs() {
    const jobs = this.bgScheduler.getScheduledJobs();
    console.log('=== Scheduled Jobs ===');
    console.log('Platform:', jobs.platform);
    console.log('Web Jobs:', jobs.webJobs);
    jobs.mobileJobs.forEach(job => {
      console.log(`- ${job.name} (${job.interval} min)`);
    });
  }

  ngOnDestroy() {
    // Optionally cancel this job when component is destroyed
    // this.bgScheduler.cancelJob(this.jobName);
  }
}
```

---

## Testing Checklist

### ✅ Web Browser Testing
```bash
npm start
# Open http://localhost:4200
# Jobs should fire normally (every 5 minutes)
# No changes to existing behavior
```

### ✅ Mobile APK Testing
```bash
npm run build:prod
npx cap sync android
npm run build:android
# Install APK: adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Test Scenarios:**
- [ ] App open: Jobs fire ✅
- [ ] App minimized: Jobs still fire ✅
- [ ] Screen locked: Jobs still fire ✅
- [ ] Check logs: `adb logcat | grep -i "executing\|background"`
- [ ] Check notifications: Pull down notification panel

### ✅ Edge Cases
- [ ] Job name with special characters (should work)
- [ ] Very frequent jobs (< 1 minute) - not recommended but supported
- [ ] Multiple jobs with same name (each gets unique ID)
- [ ] Cancel job that doesn't exist (safe, no error)
- [ ] Schedule job in past (runs immediately)

---

## Troubleshooting

### Jobs not firing on mobile?
See `MOBILE_BACKGROUND_SCHEDULER_IMPLEMENTATION.md` troubleshooting section.

### Jobs fire twice?
Ensure you're not calling `scheduleJob()` multiple times for the same job.
Always `await cancelJob()` before scheduling again:

```typescript
await this.bgScheduler.cancelJob('MyJob');
await this.bgScheduler.scheduleJob('MyJob', 5, callback);
```

### Service not found error?
Make sure you've created the file:
```
src/app/core/services/background-scheduler.service.ts
```

And it's properly imported in your component.

### "Cannot find module @capacitor/local-notifications"?
Run: `npm install @capacitor/local-notifications @capacitor/app`

---

## Performance Monitoring

Log the status of scheduled jobs:

```typescript
setInterval(() => {
  const jobs = this.bgScheduler.getScheduledJobs();
  console.log(`[HEALTH] Platform: ${jobs.platform}, Jobs: ${jobs.webJobs.length + jobs.mobileJobs.length}`);
}, 60000); // Every minute
```

Monitor job execution:

```typescript
private async executeTargetAndStopLoss() {
  const startTime = performance.now();

  try {
    await this.targetManager.placeTargetsAndStopLossForAllPositions();
    const duration = performance.now() - startTime;
    console.log(`✅ Job completed in ${duration.toFixed(2)}ms`);
  } catch (error) {
    console.error('❌ Job failed:', error);
  }
}
```

---

## Next Steps

1. ✅ Service file is created (`background-scheduler.service.ts`)
2. 📦 Install packages: `npm install @capacitor/local-notifications @capacitor/app`
3. 🔧 Update AndroidManifest.xml (see implementation guide)
4. 🔌 Inject service into your components (examples above)
5. 🧪 Test on web: `npm start`
6. 📱 Test on mobile: Build APK and install on device
7. 🔒 Test with screen locked to verify
8. ✅ Deploy to production!

---

## Summary

**Before (Web-only):**
```
Web Browser: ✅ Works
Mobile APK: ❌ Stops when backgrounded/locked
```

**After (Web + Mobile):**
```
Web Browser: ✅ Works (unchanged)
Mobile APK: ✅ Works even when backgrounded/locked
```

The service automatically detects the platform and uses the best mechanism for each! 🚀
