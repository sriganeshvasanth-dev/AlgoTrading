# 🎮 Configuration Page - Control Reference Guide

## Quick Navigation

**Location:** Click the hamburger menu (☰) → "Configuration"

---

## 📋 All Available Controls

### Section 1: Technical Analysis
- **Days for High/Low Calculation** — Number input (1-365 days)
- **Buffer Percentage (%)** — Decimal input for price adjustments
- **Target Multiplier** — Multiplier for target calculation

### Section 2: Risk Management  
- **Risk Amount per Trade (₹)** — Risk in rupees per trade

### Section 3: Filtering
- **Minimum Price (₹)** — Minimum stock price filter
- **Top Volume Symbols** — Number of top volume stocks to track

### Section 4: Task Scheduler Configuration ⭐️ (NEW)

#### Task 1: Place Limit Order
```
☑ Checkbox: Enable/Disable the task
  ↓ (When enabled)
  Schedule Type:     [Daily ▼] [Hourly] [Interval]
  Time:              [09:00] ← Shows when Daily selected
  Interval Minutes:  [30]    ← Shows when Interval selected
  Retry on Failure:  ☑ Checkbox
  Max Retries:       [3]     ← Shows when Retry checked
```

#### Task 2: Place Target/Stop Loss Orders
```
☑ Checkbox: Enable/Disable the task
  ↓ (When enabled)
  Schedule Type:     [Daily ▼] [Hourly] [Interval]
  Time:              [09:30] ← Shows when Daily selected
  Interval Minutes:  [30]    ← Shows when Interval selected
  Retry on Failure:  ☑ Checkbox
  Max Retries:       [3]     ← Shows when Retry checked
```

#### Task 3: Update Trailing Stop Loss
```
☑ Checkbox: Enable/Disable the task
  ↓ (When enabled)
  Schedule Type:     [Daily ▼] [Hourly] [Interval]
  Time:              [15:15] ← Shows when Daily selected
  Interval Minutes:  [5]     ← Shows when Interval selected
  Retry on Failure:  ☑ Checkbox
  Max Retries:       [3]     ← Shows when Retry checked
```

---

## 🎛️ Control Types Explained

### Checkboxes (☑)
- **Place Limit Order** — Enable/disable this task entirely
- **Place Target/Stop Loss** — Enable/disable this task entirely
- **Update Trailing Stop Loss** — Enable/disable this task entirely
- **Retry on Failure** — Enable automatic retry on failures

**Behavior:** When unchecked, all fields for that task are hidden.

---

### Schedule Type Selector (Dropdown ▼)
Select how often the task should run:

| Option | Meaning | Use Case |
|--------|---------|----------|
| **Daily** | Run at specific time each day | Morning orders, scheduled reviews |
| **Hourly** | Run at top of every hour | Frequent updates |
| **Interval** | Run every N minutes | Continuous monitoring |

---

### Time Input (HH:MM)
**Used for:** Daily schedule only

**Format:** 24-hour format
- Valid: `09:00`, `23:59`, `00:30`, `14:45`
- Invalid: `9:00`, `25:00`, `12:60`, `9:5`

**Examples:**
- Market open: `09:15`
- Post-market: `15:30`
- End of day: `23:55`

---

### Interval Input (Minutes)
**Used for:** Interval schedule only

**Range:** 1 to 1440 minutes (24 hours)

**Common Values:**
- `1` — Every minute (very frequent)
- `5` — Every 5 minutes
- `15` — Every quarter hour
- `30` — Every half hour
- `60` — Every hour
- `120` — Every 2 hours
- `1440` — Once per day

---

### Max Retries Input (Number)
**Used for:** When "Retry on failure" is checked

**Range:** 1 to 10 retries

**Meaning:**
- `1` — Try once more if it fails
- `3` — Try up to 3 more times (default)
- `5` — Try up to 5 more times (aggressive)
- `10` — Maximum retries (very persistent)

---

## ✅ Action Buttons

### Save Changes Button (✅ Save Changes)
- **Color:** Purple gradient
- **Action:** Saves all configuration
- **Feedback:** "✅ Configuration saved successfully!" message appears
- **Location:** Bottom of the page

### Reset to Defaults Button (↺ Reset to Defaults)
- **Color:** Gray outline
- **Action:** Reverts to last saved state
- **Confirmation:** A dialog will ask for confirmation
- **Location:** Bottom of the page, next to Save

### Back Button (← Back)
- **Action:** Returns to previous page
- **Note:** Unsaved changes will be lost!

---

## 🔄 Typical Workflow

### Step 1: Navigate
Click hamburger menu (☰) → "Configuration"

### Step 2: Configure Tasks
```
1. Check "Place Limit Order" checkbox ✓
2. Select schedule type: "Daily" or "Interval"
3. Enter time (if Daily) or interval (if Interval)
4. Check "Retry on failure" if desired
5. Set max retries (1-10)
6. Repeat for other tasks
```

### Step 3: Save
Click "✅ Save Changes" button at the bottom

### Step 4: Verify
- Success message appears
- Tasks run according to schedule
- Check logs if issues occur

---

## 🚫 What Makes Controls Appear/Disappear

### Time Input Appears When:
- Task checkbox is **checked** ✓
- Schedule Type is set to **"Daily"**

### Interval Input Appears When:
- Task checkbox is **checked** ✓
- Schedule Type is set to **"Interval"**

### Max Retries Input Appears When:
- "Retry on failure" checkbox is **checked** ✓

### Task Content Section Appears When:
- Task enable checkbox is **checked** ✓
- All fields below it become visible

---

## ⏰ Schedule Examples

### Daily Morning Order
```
Schedule Type: Daily
Time: 09:15
Retry on Failure: ✓ Yes (3 retries)
```
→ Task runs every day at 9:15 AM, retries up to 3 times if it fails

### Frequent Interval Updates
```
Schedule Type: Interval
Interval: 5 minutes
Retry on Failure: ✓ Yes (2 retries)
```
→ Task runs every 5 minutes, retries up to 2 times if it fails

### Hourly Check
```
Schedule Type: Hourly
Retry on Failure: ✓ Yes (1 retry)
```
→ Task runs every hour at the top of the hour, retries once if it fails

---

## 🎯 Best Practices

### For Day Traders
```
Place Limit Order: Daily @ 09:15, retry 3x
Target/Stop Loss: Daily @ 09:30, retry 3x
Trailing Stop: Interval 5 min, retry 2x
```

### For Swing Traders
```
Place Limit Order: Daily @ 09:00, retry 2x
Target/Stop Loss: Daily @ 09:30, retry 2x
Trailing Stop: Hourly, retry 1x
```

### For Conservative Traders
```
Place Limit Order: Daily @ 09:00, no retry
Target/Stop Loss: Daily @ 09:30, retry 2x
Trailing Stop: Disabled
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't see time input | Make sure "Daily" is selected in Schedule Type |
| Can't see interval input | Make sure "Interval" is selected in Schedule Type |
| Can't see max retries | Check "Retry on failure" checkbox first |
| Task fields disappearing | Uncheck the task enable checkbox to collapse |
| Time format error | Use HH:MM format like "09:00" (not "9:00") |
| Save button not working | Check all time formats are correct |
| Task not running | Verify task is enabled and scheduler service is active |

---

## 💾 Data Saved

When you click "✅ Save Changes", the following are saved:

✅ Technical Analysis settings
✅ Risk Management settings
✅ Filtering settings
✅ All 3 task scheduler configurations:
   - Enable/Disable status
   - Schedule type (Daily/Hourly/Interval)
   - Time (if Daily)
   - Interval minutes (if Interval)
   - Retry on failure setting
   - Max retries value

---

## 📱 Mobile Usage

On mobile devices:
- Touchscreen compatible
- Large input fields for easy tapping
- Dropdown menu closes after selection
- Vertical layout for smaller screens
- All controls remain fully functional

---

## 🔒 Notes

- Changes are **NOT** saved automatically
- Must click "✅ Save Changes" to persist
- Unsaved changes are lost if you navigate away
- Data is stored in browser's localStorage
- Configuration persists across app restarts

---

**Questions?** Refer back to this guide or check the app's built-in help section.
