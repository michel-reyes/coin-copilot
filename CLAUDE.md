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

### Code Quality
```bash
# Run ESLint
npm run lint
```

### Project Management
```bash
# Reset project (moves starter code to app-example/, creates blank app/)
npm run reset-project
```

## Architecture

### Directory Structure
```
src/app/
├── _layout.tsx                    # Root layout with SessionProvider & NotificationProvider
├── sign-in.tsx                    # Public sign-in screen
├── splash.tsx                     # Splash screen controller
├── context/
│   ├── authContext.tsx            # Supabase session management
│   └── notificationContext.tsx    # Push notification state
├── hooks/
│   ├── useSecureStorage.ts        # Cross-platform secure storage
│   └── useNotifications.ts        # Push notification registration & handlers
├── lib/
│   ├── supabase.ts                # Supabase client configuration
│   ├── database.ts                # Database operations (user_api_keys table)
│   ├── lunchMoneyApi.ts           # Lunch Money API integration
│   ├── notifications.ts           # Notification utilities
│   └── utils.ts                   # Hash & email generation utilities
└── (private)/
    ├── _layout.tsx                # Protected routes stack layout
    └── index.tsx                  # Home screen
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

### Current Integration Points

- **Lunch Money API**: Users authenticate with Lunch Money API keys
  - **Note**: Current implementation in `lunchMoneyApi.ts` is a placeholder (mock validation)
  - **TODO**: Replace with actual API call to `GET https://dev.lunchmoney.app/v1/me`
- **Supabase**: Configured with environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
  - Uses `expo-sqlite/localStorage/install` for storage adapter
  - Auto token refresh and session persistence enabled

### Path Aliases

The project uses `@/` as an alias for `./src/`:
```typescript
import { useSession } from '@/app/context/authContext';
```

## Key Implementation Details

### Adding New Protected Routes
1. Create files inside `src/app/(private)/` folder
2. Routes automatically protected by `Stack.Protected guard={!!session}` in root layout
3. No additional authentication checks needed

### Adding New Public Routes
1. Create files in `src/app/` (outside `(private)` folder)
2. Add to `Stack.Protected guard={!session}` section in `src/app/_layout.tsx`

### Secure Storage Usage
Always use the `useStorageState` hook for persisting sensitive data:
```typescript
import { useStorageState } from '@/app/hooks/useSecureStorage';

// In component
const [[isLoading, value], setValue] = useStorageState('key-name');
```

### Splash Screen Management
The `SplashScreenController` component (`src/app/splash.tsx`) manages splash screen visibility based on authentication loading state. The splash screen automatically hides when `isLoading` becomes false in the SessionProvider.

### Implementing Push Notifications

**Sending Test Notifications**:
```typescript
import { scheduleLocalNotification } from '@/app/lib/notifications';

await scheduleLocalNotification('Title', 'Body text', { url: 'myapp://path' });
```

**Handling Notification Responses**:
The `useNotifications` hook automatically sets up response listeners. Access the last notification response via:
```typescript
const { expoPushToken, notification } = useNotifications();
```

**Platform Requirements**:
- Physical device required (simulators/emulators not supported)
- User must grant notification permissions
- iOS: Development builds require "development" APS entitlement
- Android: Notification channel auto-configured on first use

### Working with Database Migrations

**Creating New Migrations**:
1. Create `.sql` file in `supabase/migrations/` with timestamp prefix (format: `YYYYMMDDHHMMSS_description.sql`)
2. Run `npm run db:push` to apply migrations to remote
3. Use `npm run db:status` to verify migration status

**Database Connection**:
- Local Supabase: `postgresql://postgres:postgres@localhost:54322/postgres`
- Remote: Configured via Supabase project settings

**RLS Policy Pattern**:
All policies use `auth.uid() = user_id` to ensure users can only access their own data.

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
