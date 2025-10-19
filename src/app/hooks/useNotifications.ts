import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export interface NotificationHookState {
  expoPushToken: string;
  notification: Notifications.Notification | undefined;
  channels: Notifications.NotificationChannel[];
  isLoading: boolean;
  error: string | null;
}

export function useNotifications(): NotificationHookState {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Set up notification listeners
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification response:', response);
      });

    if (Platform.OS === 'android') {
      Notifications.getNotificationChannelsAsync().then((value) =>
        setChannels(value ?? [])
      );
    }

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
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
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
          throw new Error(
            'Project ID not found. Please set up your EAS project ID in app.json'
          );
        }

        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;

        setExpoPushToken(token);
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
    channels,
    isLoading,
    error,
  };
}
