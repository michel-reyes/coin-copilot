import colors from '@/themes/colors';
import { Stack } from 'expo-router';

export default function AppLayout() {
    // DashboardScreen
    return (
        <Stack
            screenOptions={{
                contentStyle: { backgroundColor: colors['system-black'] },
                headerShown: false,
            }}
        >
            <Stack.Screen name='index' />
        </Stack>
    );
}
