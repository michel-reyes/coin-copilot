import { Stack } from "expo-router";

import { SessionProvider, useSession } from "@/app/context/authContext";
import { SplashScreenController } from "@/app/splash";

export default function RootLayout() {
  return (
    <>
      <SessionProvider>
        <SplashScreenController />
        <RootNavigator />
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
