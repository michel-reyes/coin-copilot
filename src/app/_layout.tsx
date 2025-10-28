import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import '../global.css';

import queryClient from '@//api/query-client';
import { SessionProvider, useSession } from '@//context/authContext';
import { NotificationProvider } from '@//context/notificationContext';
import SplashScreenController from '@//splash';
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
