import { Stack } from "expo-router";

import { SessionProvider, useSession } from "@/app/context/authContext";
import { NotificationProvider } from "@/app/context/notificationContext";
import { SplashScreenController } from "@/app/splash";

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
    <Stack>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(private)" />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  )
}
