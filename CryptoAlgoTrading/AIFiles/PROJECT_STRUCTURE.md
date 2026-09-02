# CryptoCurrency Scanner - Project Structure

## Overview
This project follows Angular best practices with a feature-based folder organization.

## Folder Structure

```
src/app/
├── core/                          # Core singleton services
│   └── services/
│       └── delta.service.ts       # Delta Exchange API service
│
├── features/                      # Feature modules
│   ├── scanner/                   # Scanner feature
│   │   └── dashboard.component.ts # 3-Day High/Low crossover scanner
│   │
│   └── positions/                 # Positions feature
│       └── positions.component.ts # Live trading positions table
│
├── shared/                        # Shared components
│   └── components/
│       └── nav-menu/
│           └── nav-menu.component.ts  # Top navigation menu
│
├── app.ts                        # Root component
├── app.html                      # Root template
├── app-module.ts                 # Root NgModule
└── app-routing-module.ts         # App routing configuration
```

## Architecture

### Core Layer (`core/`)
- **Purpose**: Contains singleton services used throughout the app
- **Services**:
  - `DeltaService`: Handles all Delta Exchange API interactions
    - Public endpoints: products, tickers, candles
    - Authenticated endpoints: positions with HMAC-SHA256 signature

### Features Layer (`features/`)
- **Purpose**: Feature-specific components organized by business domain
- **Features**:
  - **Scanner**: 3-Day High/Low crossover detection for crypto futures
  - **Positions**: Real-time trading positions with P&L tracking

### Shared Layer (`shared/`)
- **Purpose**: Reusable components, directives, pipes used across features
- **Components**:
  - `NavMenuComponent`: Top navigation bar with route links

## Component Details

### Scanner (Dashboard)
- **Path**: `/scanner`
- **Component**: `DashboardComponent`
- **Location**: `features/scanner/dashboard.component.ts`
- **Features**:
  - Real-time crypto futures monitoring
  - 3-day high/low crossover detection
  - Auto-refresh with configurable interval
  - Sortable results table

### Positions
- **Path**: `/positions`
- **Component**: `PositionsComponent`
- **Location**: `features/positions/positions.component.ts`
- **Features**:
  - Live trading positions display
  - Real-time mark price fetching
  - Calculated P&L and P&L percentage
  - Professional table layout with color-coded profit/loss
  - Total P&L aggregation

### Navigation Menu
- **Component**: `NavMenuComponent`
- **Location**: `shared/components/nav-menu/nav-menu.component.ts`
- **Features**:
  - Responsive navigation bar
  - Active route highlighting
  - Scanner and Positions links

## Routing

```typescript
Routes:
  /scanner     → DashboardComponent  (default)
  /positions   → PositionsComponent
  /            → redirects to /scanner
  /**          → redirects to /scanner
```

## Service Dependencies

### DeltaService
- **Location**: `core/services/delta.service.ts`
- **Used By**: DashboardComponent, PositionsComponent
- **API Base URL**: `https://api.india.delta.exchange`
- **Authentication**: HMAC-SHA256 signature (api-key, signature, timestamp headers)
- **Methods**:
  - `getAllProducts()`: Fetch all live perpetual futures
  - `getTicker(symbol)`: Get real-time ticker data for a symbol
  - `getCandles(...)`: Historical candle data for charting
  - `getPositions()`: Authenticated - fetch user's open positions

## Build & Development

### Build
```bash
npm run build
# or
ng build
```

### Development Server
```bash
npm start
# or
ng serve
```

### Project Verification
After restructuring, all builds are successful with no errors.

## Best Practices Applied

1. **Feature-based organization**: Related components grouped by feature
2. **Core services**: Singleton services in dedicated folder
3. **Shared components**: Reusable UI components separated
4. **Clear naming**: Descriptive folder and file names
5. **Import paths**: Relative imports from feature to core (`../../core/services/`)
6. **No debug logs**: Production-ready code without console.log statements
7. **Standalone components**: Modern Angular standalone architecture
8. **TypeScript strict**: Type-safe component properties and service methods

## Migration Notes

All components have been moved to their respective folders with updated import paths:
- ✅ `delta.service.ts` → `core/services/`
- ✅ `dashboard.component.ts` → `features/scanner/`
- ✅ `positions.component.ts` → `features/positions/`
- ✅ `nav-menu.component.ts` → `shared/components/nav-menu/`
- ✅ All imports updated in `app-module.ts` and `app-routing-module.ts`
- ✅ Cross-component imports updated with correct relative paths
- ✅ Build verified and successful
