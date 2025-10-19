import { createContext, use, useEffect, type PropsWithChildren } from 'react';

import { useNotifications, type NotificationHookState } from '@/app/hooks/useNotifications';
import { setupNotificationHandler } from '@/app/lib/notifications';

type NotificationContextType = NotificationHookState & {
  /**
   * Schedule a local notification for testing purposes
   */
  scheduleTestNotification: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: '',
  notification: undefined,
  channels: [],
  isLoading: false,
  error: null,
  scheduleTestNotification: async () => {},
});

/**
 * Hook to access notification state and functions
 */
export function useNotificationContext() {
  const value = use(NotificationContext);
  if (!value) {
    throw new Error('useNotificationContext must be wrapped in a <NotificationProvider />');
  }
  return value;
}

/**
 * Provider component that manages push notification state
 */
export function NotificationProvider({ children }: PropsWithChildren) {
  const notificationState = useNotifications();

  useEffect(() => {
    // Set up the notification handler when the provider mounts
    setupNotificationHandler();
  }, []);

  // Log the push token when it's available (useful for testing)
  useEffect(() => {
    if (notificationState.expoPushToken) {
      console.log('📱 Expo Push Token:', notificationState.expoPushToken);
    }
  }, [notificationState.expoPushToken]);

  // Log any errors
  useEffect(() => {
    if (notificationState.error) {
      console.error('❌ Notification Error:', notificationState.error);
    }
  }, [notificationState.error]);

  const scheduleTestNotification = async () => {
    const { scheduleLocalNotification } = await import('@/app/lib/notifications');
    await scheduleLocalNotification(
      'Test Notification',
      'This is a test notification from Coin Copilot!',
      2
    );
  };

  return (
    <NotificationContext
      value={{
        ...notificationState,
        scheduleTestNotification,
      }}
    >
      {children}
    </NotificationContext>
  );
}
