# 📐 Configuration Page - Visual Layout Guide

## Full Page Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ⚙️ Configuration Settings                       │
│          Customize trading parameters and filters                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 📊 TECHNICAL ANALYSIS                                               │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐  ┌──────────────────────────────┐   │
│ │ Days for High/Low:          │  │ Buffer Percentage:           │   │
│ │ [___ 30 ___]                │  │ [___ 0.4 ___] %              │   │
│ │ Used for technical calc.    │  │ Applied to entry/SL prices   │   │
│ └─────────────────────────────┘  └──────────────────────────────┘   │
│                                                                     │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Target Multiplier:                                           │   │
│ │ [___ 4 ___] x                                                │   │
│ │ Target = Entry + (SL Diff × Multiplier)                     │   │
│ └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 💰 RISK MANAGEMENT                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Risk Amount per Trade:                                       │   │
│ │ [___ 5000 ___] ₹                                              │   │
│ │ Amount risked per trade                                      │   │
│ └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 🔍 FILTERING                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐  ┌──────────────────────────────┐   │
│ │ Minimum Price:              │  │ Top Volume Symbols:          │   │
│ │ [___ 50 ___] ₹              │  │ [___ 15 ___]                 │   │
│ │ Minimum stock price         │  │ Top symbols to track         │   │
│ └─────────────────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ⏰ TASK SCHEDULER CONFIGURATION                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ☑ Place Limit Order                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ [IF CHECKED ↓]                                                      │
│                                                                     │
│ Schedule Type: [Daily ▼]                                            │
│                                                                     │
│ [IF DAILY SELECTED ↓]                                               │
│ Time (HH:MM): [___ 09:00 ___]     Pattern: ([01]\d|2[0-3]):([0-5]\d)│
│               Placeholder: "09:00"                                  │
│                                                                     │
│ [IF INTERVAL SELECTED ↓]                                            │
│ Interval (min): [___ 30 ___]      Min: 1, Max: 1440                │
│                 Placeholder: "30"                                   │
│                                                                     │
│ ☑ Retry on Failure                                                  │
│ [IF RETRY CHECKED ↓]                                                │
│ Max Retries: [___ 3 ___]          Min: 1, Max: 10                   │
│              Placeholder: "3"                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ☑ Place Target/Stop Loss Orders                                     │
├─────────────────────────────────────────────────────────────────────┤
│ [IF CHECKED ↓]                                                      │
│                                                                     │
│ Schedule Type: [Daily ▼]                                            │
│                                                                     │
│ [IF DAILY SELECTED ↓]                                               │
│ Time (HH:MM): [___ 09:30 ___]     Pattern: ([01]\d|2[0-3]):([0-5]\d)│
│               Placeholder: "09:30"                                  │
│                                                                     │
│ [IF INTERVAL SELECTED ↓]                                            │
│ Interval (min): [___ 30 ___]      Min: 1, Max: 1440                │
│                 Placeholder: "30"                                   │
│                                                                     │
│ ☑ Retry on Failure                                                  │
│ [IF RETRY CHECKED ↓]                                                │
│ Max Retries: [___ 3 ___]          Min: 1, Max: 10                   │
│              Placeholder: "3"                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ☑ Update Trailing Stop Loss                                         │
├─────────────────────────────────────────────────────────────────────┤
│ [IF CHECKED ↓]                                                      │
│                                                                     │
│ Schedule Type: [Daily ▼]                                            │
│                                                                     │
│ [IF DAILY SELECTED ↓]                                               │
│ Time (HH:MM): [___ 15:15 ___]     Pattern: ([01]\d|2[0-3]):([0-5]\d)│
│               Placeholder: "15:15"                                  │
│                                                                     │
│ [IF INTERVAL SELECTED ↓]                                            │
│ Interval (min): [___ 5 ___]       Min: 1, Max: 1440                │
│                 Placeholder: "5"                                    │
│                                                                     │
│ ☑ Retry on Failure                                                  │
│ [IF RETRY CHECKED ↓]                                                │
│ Max Retries: [___ 3 ___]          Min: 1, Max: 10                   │
│              Placeholder: "3"                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│ ┌──────────────────────┐         ┌──────────────────────────────┐  │
│ │ ✅ Save Changes      │         │ ↺ Reset to Defaults         │  │
│ └──────────────────────┘         └──────────────────────────────┘  │
│                                                                     │
│ ✅ Configuration saved successfully!                               │
│                                                                     │
│ ← Back to Previous Page                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎛️ Control Visibility Logic

### Task Enable Checkbox (☑)
```
Task Config Section
    ↓
    ☑ [Task Name]  ← Main checkbox
    ├─ ☐ = All fields below are HIDDEN
    └─ ✓ = All fields below are VISIBLE
```

### Schedule Type Dropdown
```
☑ Task Enabled
    ↓
    Schedule Type: [Dropdown ▼]
    ├─ Daily    → Shows "Time (HH:MM)" input
    ├─ Hourly   → Shows NOTHING below (auto hourly)
    └─ Interval → Shows "Interval (minutes)" input
```

### Retry Configuration
```
☑ Task Enabled
    ↓
    [Schedule fields...]
    ↓
    ☑ Retry on Failure  ← Retry checkbox
    ├─ ☐ = "Max Retries" field is HIDDEN
    └─ ✓ = "Max Retries" field is VISIBLE
```

---

## 📱 Mobile Layout (< 768px)

```
┌──────────────────────────┐
│  ⚙️ Configuration        │
│  Customize trading...    │
└──────────────────────────┘

┌──────────────────────────┐
│  📊 TECHNICAL ANALYSIS   │
├──────────────────────────┤
│ Days for High/Low:       │
│ [________]               │
│                          │
│ Buffer Percentage (%):   │
│ [________]               │
│                          │
│ Target Multiplier:       │
│ [________]               │
└──────────────────────────┘

┌──────────────────────────┐
│  💰 RISK MANAGEMENT      │
├──────────────────────────┤
│ Risk Amount (₹):         │
│ [________]               │
└──────────────────────────┘

[... continues vertically ...]
```

---

## 🖱️ Interactive State Transitions

### Example: Enable a Task & Configure

**Initial State:**
```
☐ Place Limit Order
  [All fields hidden - task section collapses]
```

**After Clicking Checkbox:**
```
☑ Place Limit Order
  ├─ Schedule Type: [Daily ▼]
  ├─ Time (HH:MM): [09:00]
  ├─ ☐ Retry on Failure
  └─ [ Max Retries is hidden since retry unchecked ]
```

**After Checking Retry:**
```
☑ Place Limit Order
  ├─ Schedule Type: [Daily ▼]
  ├─ Time (HH:MM): [09:00]
  ├─ ☑ Retry on Failure
  └─ Max Retries: [3]  ← NOW VISIBLE
```

**After Changing to Interval:**
```
☑ Place Limit Order
  ├─ Schedule Type: [Interval ▼]
  ├─ Time (HH:MM): [HIDDEN - was Daily only]
  ├─ Interval (min): [30]  ← NOW VISIBLE
  ├─ ☑ Retry on Failure
  └─ Max Retries: [3]
```

---

## 🎨 Color & Style Guide

### Task Cards
```
┌─ Border: 1px solid --border-color
│  Background: var(--bg-secondary)
│  Radius: 8px
│  Padding: 1rem
│  Margin-bottom: 1.5rem
│
│  On Hover:
│  └─ Box-shadow: 0 2px 8px rgba(0,0,0,0.1)
```

### Checkboxes
```
Size: 1.25rem × 1.25rem
Accent Color: #667eea (purple)
Cursor: pointer
Margin: 0
```

### Dropdowns
```
Padding: 0.75rem
Border: 1px solid --border-color
Radius: 6px
Background: var(--bg-primary)
Text: var(--text-primary)

On Focus:
├─ Border-color: #667eea
├─ Outline: none
└─ Box-shadow: 0 0 0 3px rgba(102,126,234,0.1)

Custom Arrow:
└─ SVG chevron-down in #667eea
```

### Buttons
```
Primary (Save):
├─ Background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
├─ Color: white
├─ Padding: 12px 24px
├─ Border-radius: 6px
├─ Box-shadow: 0 4px 12px rgba(102,126,234,0.3)
│
└─ On Hover:
   ├─ Transform: translateY(-2px)
   └─ Box-shadow: 0 6px 16px rgba(102,126,234,0.4)

Secondary (Reset):
├─ Background: var(--bg-primary)
├─ Border: 2px solid --border-color
├─ Color: var(--text-primary)
│
└─ On Hover:
   ├─ Border-color: #667eea
   ├─ Color: #667eea
   └─ Background: rgba(102,126,234,0.05)
```

---

## 🔤 Form Labels & Placeholders

### Technical Analysis Section
```
"Days for High/Low Calculation"
  Help: "Used for entry price, stop loss, and target calculations"
  Placeholder: "3"
  Range: 1-365

"Buffer Percentage (%)"
  Help: "Applied as (1 ± buffer%) to entry and stop loss prices"
  Placeholder: "0.4"
  Step: 0.01

"Target Multiplier"
  Help: "Target = Entry + (SL Difference × Multiplier)"
  Placeholder: "4"
  Step: 1
```

### Risk Management Section
```
"Risk Amount per Trade (₹)"
  Help: "Amount risked per trade"
  Placeholder: "5000"
  Step: 1
```

### Filtering Section
```
"Minimum Price (₹)"
  Help: "Minimum stock price"
  Placeholder: "50"
  Step: 1

"Top Volume Symbols"
  Help: "Top symbols to track"
  Placeholder: "15"
  Step: 1
```

### Task Scheduler Section
```
Task Headers:
  "Place Limit Order"
  "Place Target/Stop Loss Orders"
  "Update Trailing Stop Loss"

Common Labels:
  "Schedule Type"
    Options: "Daily (at specific time)"
             "Hourly"
             "Interval (every N minutes)"

  "Time (HH:MM format)"
    Placeholder: "09:00" (Daily), "09:30" (Target), "15:15" (Trailing)
    Pattern: /^([01]\d|2[0-3]):([0-5]\d)$/

  "Interval (minutes)"
    Placeholder: "30"
    Step: 1
    Min: 1
    Max: 1440

  "Retry on failure"
    Label below checkbox

  "Max retries"
    Placeholder: "3"
    Step: 1
    Min: 1
    Max: 10
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  HTML Template (config.component.html)                      │
│  - Form inputs with [(ngModel)] = two-way binding          │
│  - *ngIf conditions for visibility                         │
│  - Class bindings for styling                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  Component Logic (config.component.ts)                      │
│  - config: AppConfig {                                      │
│      daysHighLow: number                                    │
│      bufferPercentage: number                               │
│      targetMultiplier: number                               │
│      riskAmountInr: number                                  │
│      minimumPrice: number                                   │
│      topVolumeSymbols: number                               │
│      taskSchedules: {                                       │
│        placeLimitOrder: TaskScheduleConfig                  │
│        placeTargetStopLoss: TaskScheduleConfig              │
│        updateTrailingStopLoss: TaskScheduleConfig           │
│      }                                                      │
│    }                                                        │
│  - saveConfig(): saves to service                          │
│  - resetToDefaults(): reverts changes                      │
│  - goBack(): navigates away                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  Service (config.service.ts)                                │
│  - Persists to localStorage                                 │
│  - Provides default config                                  │
│  - Used by task-scheduler.service                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Key Points

✅ **Responsive:** Works on desktop, tablet, mobile
✅ **Accessible:** Large touch targets, proper labels, keyboard nav
✅ **Validated:** Time format validation, range checks
✅ **Fast:** Smooth animations, instant feedback
✅ **Professional:** Gradient buttons, theme support
✅ **Intuitive:** Progressive disclosure, clear field labeling
✅ **Persistent:** Saves to localStorage
✅ **Explicit:** No auto-save, must click "Save Changes"
