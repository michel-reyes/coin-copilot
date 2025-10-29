import * as Notifications from 'expo-notifications';

export async function sendLocalNotification(notification: { title: string; body: string }) {
    try {
        console.log('Sending notification', notification);
        const notificationResponse = await Notifications.scheduleNotificationAsync({
            content: {
                title: notification.title,
                body: notification.body,
            },
            trigger: null, // Send immediately
        });

        console.log('Notification sent', notificationResponse);
    } catch (error) {
        console.error('Error sending notification', error);
    }
}
