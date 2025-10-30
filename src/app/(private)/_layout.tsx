import colors from '@/themes/colors';
import { Stack } from 'expo-router';

export default function AppLayout() {
    return (
        <Stack
            screenOptions={{
                contentStyle: { backgroundColor: colors['system-background'] },
                headerShown: false,
            }}
        >
            <Stack.Screen name='index' />
        </Stack>
    );
}
