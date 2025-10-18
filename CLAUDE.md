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

### File-Based Routing with Expo Router
The app uses Expo Router's file-based routing system located in `src/app/`. Routes are organized as:

- **Public Routes**: `sign-in.tsx` (unauthenticated users)
- **Protected Routes**: `(private)/` folder (authenticated users only)
- **Layouts**: `_layout.tsx` files define route structure and protection

### Authentication System Architecture

The authentication is built on three key components:

1. **SessionProvider** (`src/app/context/authContext.tsx`): Central authentication state management using React Context
2. **useStorageState Hook** (`src/app/hooks/useSecureStorage.ts`): Cross-platform secure storage abstraction
   - Native (iOS/Android): Uses `expo-secure-store` for encrypted storage
   - Web: Falls back to `localStorage`
3. **Route Protection**: Uses `Stack.Protected` components with guards based on session existence

**Authentication Flow**:
1. App loads → SessionProvider checks secure storage for existing session
2. If session exists → Navigate to `(private)/` routes
3. If no session → Navigate to `sign-in` screen
4. User signs in with Lunch Money API key → Session stored → Auto-redirect to private area
5. User signs out → Session cleared → Auto-redirect to sign-in

### Current Integration Points

- **Lunch Money API**: Users authenticate with Lunch Money API keys (stored as session)
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

## Environment Setup

Required environment variables in `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Platform-Specific Notes

- **Expo Plugins Required**: expo-router, expo-splash-screen, expo-secure-store, expo-sqlite
- **New Architecture Enabled**: React Native's new architecture is enabled (`newArchEnabled: true`)
- **Typed Routes**: Expo Router's typed routes are enabled for type-safe navigation
- **React Compiler**: Experimental React compiler is enabled
