import { useSession } from '@/app/context/authContext';
import { useNotificationContext } from '@/app/context/notificationContext';
import { Link } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function Index() {
  const { expoPushToken, notification } = useNotificationContext();
  const { signOut } = useSession();

  async function sendPushNotification(expoPushToken: string) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: 'Original Title',
      body: 'And here is the body!',
      data: { someData: 'goes here' },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  }

  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'space-around' }}
    >
      <Text>Your Expo push token: {expoPushToken}</Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text>
          Title: {notification && notification.request.content.title}{' '}
        </Text>
        <Text>Body: {notification && notification.request.content.body}</Text>
        <Text>
          Data:{' '}
          {notification && JSON.stringify(notification.request.content.data)}
        </Text>
        <Link href='/(private)/events'>
          <Text>go events</Text>
        </Link>
      </View>
      <Button title='sibg out' onPress={signOut} />
      <Button
        title='Press to Send Notification'
        onPress={async () => {
          await sendPushNotification(expoPushToken);
        }}
      />
    </View>
  );
}
