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
            <Stack.Screen
                name='accounts/[id]'
                options={{
                    headerShown: true,
                    headerBackButtonDisplayMode: 'minimal',
                    contentStyle: {
                        backgroundColor: colors['system-background'],
                    },
                    headerStyle: {
                        backgroundColor: colors['system-background'],
                    },
                }}
            />
            <Stack.Screen
                name='accounts/account-settings'
                options={{
                    presentation: 'modal',
                    headerShown: false,
                }}
            />
        </Stack>
    );
}
