import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import '../global.css';

import queryClient from '@/src/api/query-client';
import { SessionProvider, useSession } from '@/src/context/authContext';
import { NotificationProvider } from '@/src/context/notificationContext';
import SplashScreenController from '@/src/splash';
import { QueryClientProvider } from '@tanstack/react-query';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <NotificationProvider>
          <SplashScreenController />
          <RootNavigator />
        </NotificationProvider>
      </SessionProvider>
    </QueryClientProvider>
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
