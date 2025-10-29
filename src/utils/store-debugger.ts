/**
 * Utility functions for debugging Zustand stores
 * This file provides helper functions to monitor and debug state changes in Zustand stores
 */

import { type StateCreator, type StoreApi } from 'zustand';

// Safe check for development environment
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

/**
 * Custom middleware for logging state changes
 * @param config - Configuration options for the logger
 * @returns A middleware function that logs state changes
 */
export function logger<T extends object>(
  config: {
    name?: string;
    enabled?: boolean;
    logActions?: boolean;
    logState?: boolean;
    logSelectors?: boolean;
  } = {}
): (next: StateCreator<T>) => StateCreator<T> {
  const {
    name = 'store',
    enabled = isDev,
    logActions = true,
    logState = true,
    logSelectors = false,
  } = config;

  return (next) => (set, get, api) => {
    // Don't apply in production unless explicitly enabled
    if (!enabled) {
      return next(set, get, api);
    }

    // Create a type-safe wrapper for the set function to log state changes
    // This implementation handles both overloads of Zustand's set function
    const loggedSet = ((stateOrUpdater: any, replace?: boolean) => {
      if (logActions) {
        console.group(`[${name}] Action`);
        console.log('Previous State:', get());
        console.log('Action:', stateOrUpdater);
      }

      // Type-safe handling of the set function
      if (replace === true) {
        // Handle the second overload: set(state, replace: true)
        set(stateOrUpdater as T | ((state: T) => T), true);
      } else {
        // Handle the first overload: set(partial, replace?: false)
        set(stateOrUpdater as T | Partial<T> | ((state: T) => T | Partial<T>), replace as false | undefined);
      }

      if (logActions) {
        console.log('New State:', get());
        console.groupEnd();
      }
    }) as typeof set;

    // Create a wrapper for the get function to log selectors
    const loggedGet: typeof get = () => {
      const state = get();
      if (logSelectors) {
        console.log(`[${name}] Get state:`, state);
      }
      return state;
    };

    // Return the store with logged functions
    return next(loggedSet, loggedGet, api);
  };
}

/**
 * Monitor specific state changes in a store
 * @param store - The Zustand store to monitor
 * @param selector - A function that selects the part of state to monitor
 * @param onChange - Callback function triggered when the selected state changes
 * @param name - Optional name for the monitor (for logging)
 * @returns A function to unsubscribe the monitor
 */
export function monitorState<T extends object, U>(
  store: StoreApi<T>,
  selector: (state: T) => U,
  onChange: (newValue: U, previousValue: U | undefined) => void,
  name = 'state-monitor'
): () => void {
  let previousValue: U | undefined;
  
  // Subscribe to store changes
  const unsubscribe = store.subscribe((state) => {
    const currentValue = selector(state);
    
    // Only trigger if the value has changed
    if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
      if (isDev) {
        console.log(`[${name}] State changed:`, {
          from: previousValue,
          to: currentValue
        });
      }
      
      onChange(currentValue, previousValue);
      previousValue = currentValue;
    }
  });
  
  // Initialize previous value
  previousValue = selector(store.getState());
  
  return unsubscribe;
}

/**
 * Creates a debugging snapshot of the current store state
 * @param store - The Zustand store to snapshot
 * @returns A formatted string representation of the store state
 */
export function createStoreSnapshot<T extends object>(store: StoreApi<T>): string {
  const state = store.getState();
  return JSON.stringify(state, null, 2);
}

/**
 * Logs the current store state to the console
 * @param store - The Zustand store to log
 * @param name - Optional name for the store (for logging)
 */
export function logStoreState<T extends object>(
  store: StoreApi<T>,
  name = 'store'
): void {
  if (isDev) {
    console.group(`[${name}] Current State`);
    console.log(store.getState());
    console.groupEnd();
  }
}
