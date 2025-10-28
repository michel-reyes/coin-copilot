import { supabase } from '@/src/lib/supabase';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export interface NotificationHookState {
  expoPushToken: string;
  notification: Notifications.Notification | undefined;
  isLoading: boolean;
  error: string | null;
}

export function useNotifications(): NotificationHookState {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const [lastNotificationResponse, setLastNotificationResponse] = useState<
    Notifications.NotificationResponse | undefined
  >(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Listen for notifications received while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    // Listen for user interactions with notifications
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        setLastNotificationResponse(response);
        console.log('Notification response:', response);

        // Handle deep linking if URL is provided in notification data
        const url = response.notification.request.content.data?.url;
        if (url && typeof url === 'string') {
          // You can add navigation logic here
          console.log('Navigate to:', url);
        }
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    try {
      setIsLoading(true);
      setError(null);
      let token;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(
          'remindersNotificationChannel',
          {
            name: 'Reminders Notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          }
        );
      }

      if (Device.isDevice) {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          throw new Error('Failed to get push token for push notification!');
        }

        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;

        if (!projectId) {
          throw new Error('Project ID not found');
        }

        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;

        setExpoPushToken(token);

        // Register push token in database via edge function
        try {
          const { data, error: registerError } =
            await supabase.functions.invoke('register-push-token', {
              body: {
                expo_push_token: token,
                device_info: {
                  platform: Platform.OS,
                  device_name: Device.deviceName || 'Unknown',
                  app_version: Constants.expoConfig?.version || 'Unknown',
                },
              },
            });

          if (registerError) {
            console.error(
              'Error registering push token in database:',
              registerError
            );
            // Don't throw - this is non-critical, user can still use the app
          } else {
            console.log('Push token registered successfully:', data);
          }
        } catch (dbError) {
          console.error('Failed to register push token in database:', dbError);
          // Don't throw - this is non-critical
        }
      } else {
        throw new Error('Must use physical device for Push Notifications');
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);

      // Handle iOS entitlement errors gracefully during development
      if (
        errorMessage.includes('aps-environment') ||
        errorMessage.includes('entitlement')
      ) {
        console.warn(
          '⚠️ Push notifications not configured for this build:',
          errorMessage
        );
        console.warn(
          'ℹ️ This is expected in development builds without proper entitlements'
        );
        setError(null); // Don't treat as error, just a warning
      } else {
        setError(errorMessage);
        console.error(
          'Error registering for push notifications:',
          errorMessage
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    expoPushToken,
    notification,
    isLoading,
    error,
  };
}
