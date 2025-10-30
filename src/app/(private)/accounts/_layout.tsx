import colors from '@/themes/colors';
import { Stack } from 'expo-router';

export default function AccountsLayout() {
    return (
        <Stack
            screenOptions={{
                contentStyle: { backgroundColor: colors['system-background'] },
            }}
        >
            <Stack.Screen
                name='[id]'
                options={{
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: colors['system-background'],
                    },
                }}
            />
            <Stack.Screen
                name='account-settings'
                options={{
                    presentation: 'formSheet',
                    headerShown: false,
                }}
            />
        </Stack>
    );
}
