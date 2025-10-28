import colors from '@/app/themes/colors';
import { Stack } from 'expo-router';

export default function AppLayout() {
  // This renders the navigation stack for all authenticated app routes.
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors['system-background'] },
        headerShown: false,
      }}
    />
  );
}
