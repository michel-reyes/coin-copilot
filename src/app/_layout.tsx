import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import '../global.css';

import { SessionProvider, useSession } from '@/app/context/authContext';
import { NotificationProvider } from '@/app/context/notificationContext';
import SplashScreenController from '@/app/splash';

export default function RootLayout() {
  return (
    <>
      <SessionProvider>
        <NotificationProvider>
          <SplashScreenController />
          <RootNavigator />
        </NotificationProvider>
      </SessionProvider>
    </>
  );
}

// ------------------------------------------------------------

function RootNavigator() {
  const { session } = useSession();
  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name='(private)' />
        </Stack.Protected>

        <Stack.Protected guard={!session}>
          <Stack.Screen name='sign-in' />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
