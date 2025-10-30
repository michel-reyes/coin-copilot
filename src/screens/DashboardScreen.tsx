import { ScreenScrollView, Text, View } from '@/components/commons';
import AccountSummary from '@/features/accounts/AccountSummary';
import { Stack } from 'expo-router';

export default function DashboardScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Michel' }} />
            <ScreenScrollView>
                <View className='flex-1'>
                    <Text>Transactions</Text>
                    <Text>Budget</Text>
                    <AccountSummary />
                </View>
            </ScreenScrollView>
        </>
    );
}
