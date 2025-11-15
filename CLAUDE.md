# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Coin Copilot is a React Native mobile application built with Expo Router for cryptocurrency management and tracking. The app integrates with the Lunch Money API for financial tracking and uses Supabase for backend services.

**Tech Stack**: Expo (iOS/Android/Web), Expo Router, TypeScript, Supabase, expo-sqlite, expo-secure-store

## Development Commands

### Running the Application
```bash
# Start development server (shows QR code for mobile)
npm start

# Run on specific platforms
npm run ios
npm run android
npm run web
```

### Database Management
```bash
# Push local migrations to remote Supabase instance
npm run db:push

# Link local project to remote Supabase instance
npm run db:link

# Check migration status
npm run db:status
```

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Code Quality
```bash
# Run ESLint
npm run lint
```

### Mock Server
```bash
# Start json-server on port 3005 with mock Lunch Money API data
npm run mock-server
```

### Project Management
```bash
# Reset project (moves starter code to app-example/, creates blank app/)
npm run reset-project
```

## Architecture

### Directory Structure
```
src/
├── app/                           # Expo Router file-based routing
│   ├── _layout.tsx                # Root layout with SessionProvider & NotificationProvider
│   ├── sign-in.tsx                # Public sign-in screen
│   ├── splash.tsx                 # Splash screen controller
│   ├── context/
│   │   ├── authContext.tsx        # Supabase session management
│   │   └── notificationContext.tsx # Push notification state
│   ├── hooks/
│   │   ├── useSecureStorage.ts    # Cross-platform secure storage
│   │   └── useNotifications.ts    # Push notification registration & handlers
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client configuration
│   │   ├── database.ts            # Database operations (user_api_keys table)
│   │   ├── lunchMoneyApi.ts       # Lunch Money API integration
│   │   ├── notifications.ts       # Notification utilities
│   │   └── utils.ts               # Hash & email generation utilities
│   └── (private)/
│       ├── _layout.tsx            # Protected routes stack layout
│       └── index.tsx              # Home screen
├── api/                           # Lunch Money API integration layer
│   ├── api-client.ts              # Axios instance with Bearer auth
│   ├── lunch-money-api-service.ts # API fetch functions
│   ├── query-client.ts            # React Query configuration
│   ├── hooks/                     # React Query hooks
│   │   ├── use-lunch-money-queries.ts
│   │   └── use-supabase-queries.ts
│   ├── constants/
│   │   ├── apiSettings.ts         # Endpoints, DEV_MODE toggle
│   │   └── queryOptions.ts        # Query definitions with transforms
│   ├── types/apiTypes.ts          # API response types
│   ├── utils.ts                   # combineAccounts, flattenCategories
│   └── _mock/db.json              # Mock API data for json-server
├── components/commons/            # Reusable UI components
│   ├── Text.tsx                   # Typography with 12 variants
│   ├── View.tsx                   # Card variant container
│   ├── ListItem.tsx               # Multi-section list item
│   ├── ScreenScrollView.tsx       # Screen-safe scroll wrapper
│   └── Divider.tsx                # Separator line
├── features/                      # Feature-based component modules
│   ├── accounts/                  # Account summary, details, settings
│   ├── transactions/              # Transaction list, sorting/filtering
│   ├── budget/                    # Budget summary, overview
│   └── period-summary/            # Period cash flow summary
├── screens/                       # Screen components
│   └── DashboardScreen.tsx        # Main dashboard layout
└── themes/colors.ts               # System, text, semantic colors

test-area/                         # Test modules (DCP calculator)
├── dcp-budget-calculator.ts       # Core DCP calculation logic
├── index.ts                       # Exports
├── types.ts                       # Type definitions
└── __tests__/                     # Jest test files
    ├── dcp-budget-calculator.test.ts
    └── fixtures/                  # Test fixtures
```

### File-Based Routing with Expo Router
The app uses Expo Router's file-based routing system located in `src/app/`. Routes are organized as:

- **Public Routes**: `sign-in.tsx` (unauthenticated users)
- **Protected Routes**: `(private)/` folder (authenticated users only)
- **Layouts**: `_layout.tsx` files define route structure and protection
- **Stack.Protected** components in root layout automatically filter routes based on session state

### Authentication System Architecture

The authentication is built on three key components:

1. **SessionProvider** (`src/app/context/authContext.tsx`): Central authentication state management using React Context
2. **useStorageState Hook** (`src/app/hooks/useSecureStorage.ts`): Cross-platform secure storage abstraction
   - Native (iOS/Android): Uses `expo-secure-store` for encrypted storage
   - Web: Falls back to `localStorage`
3. **Route Protection**: Uses `Stack.Protected` components with guards based on session existence

**Hidden Email Scheme**:
- API keys generate deterministic hidden emails (`lm_{hash}@coincopilot.app`) via `simpleHash()` utility
- Enables passwordless Supabase authentication with API keys as the credential source
- Users never see or interact with these hidden emails

**Authentication Flow**:
1. App loads → SessionProvider checks secure storage for existing session
2. If session exists → Navigate to `(private)/` routes
3. If no session → Navigate to `sign-in` screen
4. User signs in with Lunch Money API key → Hidden email generated → Supabase auth (signup/signin) → API key saved to database
5. User signs out → Session cleared → Auto-redirect to sign-in

### Push Notification Architecture

Two-layer notification management system:

1. **NotificationProvider** (`src/app/context/notificationContext.tsx`): Global notification state
2. **useNotifications Hook** (`src/app/hooks/useNotifications.ts`): Registration, permissions, and event handlers

**Registration Flow**:
- Requires physical device detection (not simulator/emulator)
- Requests user permissions
- Retrieves EAS project ID from constants
- Registers for push notifications and returns Expo push token

**Platform Configuration**:
- **iOS**: APS environment set to "development" in entitlements (`app.json`)
- **Android**: Notification channel with vibration patterns and high importance level
- **Foreground Behavior**: Shows banner and list, but no sound or badge updates

**Event Handling**:
- `receivedListener`: Handles notifications received while app is in foreground
- `responseListener`: Handles user interactions with notifications (supports deep linking via URL data)

### Database Schema

**Single Migration**: `supabase/migrations/20251017223109_initial_setup.sql`

**user_api_keys Table**:
- `id` (UUID, primary key)
- `user_id` (UUID, references auth.users, not null)
- `lunch_money_api_key` (TEXT, not null)
- `created_at` (TIMESTAMPTZ, default now())
- `updated_at` (TIMESTAMPTZ, auto-updated via trigger)

**Indexes**:
- `idx_user_api_keys_user_id`: Fast user lookups
- `idx_user_api_keys_lunch_money_api_key`: Fast API key validation

**Row Level Security (RLS)**:
- Four policies: SELECT, INSERT, UPDATE, DELETE
- All policies enforce `auth.uid() = user_id` for user-scoped access
- RLS enabled on table for security

### API Integration Architecture

**Lunch Money API** (`src/api/`):
- **Client**: Axios instance with Bearer token auth (`api-client.ts`)
- **Service Layer**: Pure fetch functions in `lunch-money-api-service.ts`
- **React Query Layer**: Custom hooks in `hooks/use-lunch-money-queries.ts`
- **Feature Hooks**: Business logic wrappers in `src/features/*/hooks/`

**DEV_MODE Toggle** (`src/api/constants/apiSettings.ts`):
- `true`: Uses `http://localhost:3005` (json-server mock)
- `false`: Uses `https://dev.lunchmoney.app/v1` (real API)

**Mock Data**:
- Location: `src/api/_mock/db.json` (1.3MB test data)
- Endpoints: `/assets`, `/budgets`, `/categories`, `/plaid_accounts`, `/recurring_items`, `/transactions`
- Run: `npm run mock-server` (starts on port 3005)

**Supabase**:
- Environment vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Storage adapter: `expo-sqlite/localStorage/install`
- Features: Auto token refresh, session persistence

**Authentication Flow**:
- User provides Lunch Money API key → Hidden email generated (`lm_{hash}@coincopilot.app`)
- Supabase auth (signup/signin) → API key stored in `user_api_keys` table
- **Note**: Current `lunchMoneyApi.ts` has placeholder validation (TODO: replace with real API call to `/v1/me`)

### State Management & Data Fetching

**React Query** (`src/api/query-client.ts`):
- **Cache**: Infinite (`gcTime: Infinity`)
- **Stale Time**: 2 hours (data considered fresh for 2hr)
- **Refetch Interval**: 4 hours (auto-refresh if actively used)
- **No Refetch**: On mount or window focus (prevents unnecessary calls)

**Query Keys**:
- `assets`, `budget`, `categories`, `plaid`, `recurringItems`, `transactions`

**Query Hooks Pattern** (`src/api/hooks/use-lunch-money-queries.ts`):
```typescript
useGetAccounts()        // Combines plaid + assets with combineAccounts()
useGetBudget(start, end) // 5-month budget history
useGetTransactions(start, end) // Transactions with debit_as_negative flag
useGetRecurringItems(month) // Flattened recurring occurrences
useGetCategories()      // Nested categories → flat array
```

**Feature Hooks Pattern** (`src/features/*/hooks/`):
Each feature wraps React Query hooks with business logic:
```typescript
// src/features/accounts/hooks/useAccounts.ts
useAccounts()           // Normalizes accounts, adds getNetWorth() helper
useBudgets()            // Auto-calculates LAST_5_MONTHS_START to CURRENT_MONTH_END
useTransactions()       // Filters by date range
useAccountDetails()     // Formats display fields, calculates limits, due days
```

**Context API** (auth/notifications only):
- `SessionProvider`: Auth state
- `NotificationProvider`: Push notification state

### UI Components & Styling

**Styling**: Tailwind CSS v4.1.16 + uniwind v1.0.0-rc.6 + clsx
- No `tailwind.config.js` (uses defaults)
- All styles via `className` props
- No external CSS files

**Base Components** (`src/components/commons/`):

**Text Component**: 12 typography variants
```typescript
// Variants: largeTitle, title1-3, headline, body, callout, footnote, subhead, caption1-2
<Text variant="headline" color="label">Title</Text>
<Text variant="body" color="secondaryLabel" numeric>$1,234.56</Text>
```
- Colors: `label`, `secondaryLabel`, `tertiaryLabel`, `quaternaryLabel`, `link`, `success`, `error`, `warning`
- `numeric` prop: Monospace font (SFMonoRegular/Semibold) with tabular-nums

**View Component**: Card variant
```typescript
<View variant="card">...</View> // rounded-xl, p-5, styled container
```

**ListItem Component**: Multi-section list structure
```typescript
<ListItem
  leading={<Icon />}
  title="Title"
  description="Description"
  metadata="Metadata"
  trailing={<ChevronRight />}
  density="compact" // condensed | compact | relaxed
/>
```

**Other Components**:
- `ScreenScrollView`: Screen-safe scroll wrapper
- `Divider`: Separator line

**Theme Colors** (`src/themes/colors.ts`):
- System: `black`, `white`, `background`, `surface`, `border`, `input`
- Text: `primary`, `secondary`, `tertiary`, `quaternary`, `placeholder`
- Semantic: `blue`, `green`, `red`, `orange`, `yellow`

**Feature Components** (`src/features/`):
- `accounts/`: AccountSummary, AccountDetails, Account settings
- `transactions/`: Transaction list, sorting/filtering
- `budget/`: BudgetSummary, BudgetOverview
- `period-summary/`: PeriodSummaryCashFlow

### Test Architecture

**Jest Configuration** (`jest.config.js`):
- Test runner: `ts-jest` (TypeScript support)
- Environment: Node
- Test pattern: `**/__tests__/**/*.test.ts`
- Path aliases: `@/` maps to `src/`
- Coverage: `test-area/**/*.ts`

**Test Commands**:
```bash
npm test              # Single run
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

**Test Modules** (`test-area/`):
- **DCP Budget Calculator**: 24 unit tests (86.66% coverage)
- **Test File**: `test-area/__tests__/dcp-budget-calculator.test.ts`
- **Fixtures**: `test-area/__tests__/fixtures/`
- **Core Logic**: `test-area/dcp-budget-calculator.ts`

**DCP Calculation**:
```
Daily Cash Position = Current Balances - Pending Debits + Pending Credits + Recurring Forecast
```
- Budget constraints cap DCP by remaining budget per category
- Probabilistic weighting for recurring items
- Types: `BudgetConstraint`, `DCPBudgetResult`, `DCPWithRecurringResult`

### Path Aliases

The project uses `@/` as an alias for `./src/`:
```typescript
import { useSession } from '@/app/context/authContext';
```

## Key Implementation Details

### Adding Routes

**Protected Routes**:
1. Create files in `src/app/(private)/`
2. Auto-protected by `Stack.Protected guard={!!session}` in root layout
3. No additional auth checks needed

**Public Routes**:
1. Create files in `src/app/` (outside `(private)`)
2. Add to `Stack.Protected guard={!session}` section in `src/app/_layout.tsx`

### Working with API Data

**Adding New Query**:
1. Add fetch function to `src/api/lunch-money-api-service.ts`
2. Create query hook in `src/api/hooks/use-lunch-money-queries.ts`
3. Define query options in `src/api/constants/queryOptions.ts` (optional transforms)
4. Wrap in feature hook in `src/features/*/hooks/` (add business logic)

**Mock Data for Development**:
1. Add endpoint data to `src/api/_mock/db.json`
2. Ensure DEV_MODE = true in `src/api/constants/apiSettings.ts`
3. Run `npm run mock-server` before `npm start`

**Query Transforms**:
Use `select` in query options for data normalization:
```typescript
// src/api/constants/queryOptions.ts
export const categoriesOptions = queryOptions({
  queryKey: ['categories'],
  queryFn: getCategories,
  select: (data) => flattenCategories(data.categories), // Transform nested → flat
});
```

### Creating UI Components

**Using Base Components**:
```typescript
import { Text, View, ListItem } from '@/components/commons';

<View variant="card">
  <Text variant="headline" color="label">Title</Text>
  <Text variant="body" color="secondaryLabel" numeric>$1,234.56</Text>

  <ListItem
    leading={<Icon />}
    title="Item Title"
    description="Description"
    trailing={<ChevronRight />}
    density="compact"
  />
</View>
```

**Styling Pattern**:
- Use Tailwind classes via `className` prop
- Use `clsx` for conditional classes
- Use `colors` from `@/themes/colors` for consistent theming

### Secure Storage
Use `useStorageState` hook for sensitive data:
```typescript
import { useStorageState } from '@/app/hooks/useSecureStorage';

const [[isLoading, value], setValue] = useStorageState('key-name');
```

### Splash Screen
`SplashScreenController` (`src/app/splash.tsx`) hides splash when `isLoading` becomes false in SessionProvider.

### Push Notifications

**Local Notifications**:
```typescript
import { scheduleLocalNotification } from '@/app/lib/notifications';
await scheduleLocalNotification('Title', 'Body', { url: 'myapp://path' });
```

**Access Token/Response**:
```typescript
const { expoPushToken, notification } = useNotifications();
```

**Requirements**:
- Physical device (not simulators)
- User permission grant
- iOS: "development" APS entitlement
- Android: Auto-configured notification channel

### Database Migrations

**Creating Migrations**:
1. Create `.sql` file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Run `npm run db:push` to apply
3. Verify: `npm run db:status`

**RLS Pattern**:
All policies use `auth.uid() = user_id` for user-scoped access.

## Environment Setup

Required environment variables in `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**EAS Configuration** (`eas.json`):
- Development builds use internal distribution
- Auto-increment version enabled for production builds
- EAS Project ID: `59d5b0a9-ebcf-44e9-beeb-4867c7a996be`

## Platform-Specific Notes

- **Bundle Identifiers**: iOS (`com.mreyesh85.coincopilot`) / Android (`com.mreyesh85.coincopilot`)
- **Expo Plugins Required**: expo-router, expo-splash-screen, expo-secure-store, expo-sqlite, expo-notifications
- **New Architecture Enabled**: React Native's new architecture is enabled (`newArchEnabled: true`)
- **Typed Routes**: Expo Router's typed routes are enabled for type-safe navigation
- **React Compiler**: Experimental React compiler is enabled
- **Versions**: React Native 0.81.4, Expo 54.0.13, React 19.1.0
