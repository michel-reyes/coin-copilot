import { Text, View } from '@/components/commons';
import StackBack from '@/components/os/StackBack';
// import Account from '@/features/accounts/components/details/account';
import useAccounts from '@/features/accounts/hooks/useAccounts';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

export default function AccountScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { getAccountById } = useAccounts();
    const router = useRouter();

    const account = getAccountById(id);

    if (!account) {
        return <Text>Account not found</Text>;
    }

    return (
        <View className='flex-1'>
            <Stack.Screen
                options={{
                    title: account.display_name || account.name,
                    headerLargeTitle: true,
                    headerLargeTitleStyle: {
                        fontSize: 29,
                        fontWeight: 'bold',
                        fontFamily: 'SFProRoundedSemibold',
                    },
                    headerLargeTitleShadowVisible: false,
                    headerRight: () => (
                        <Pressable
                            hitSlop={10}
                            onPress={() =>
                                router.push('/accounts/account-settings')
                            }
                        >
                            <Text variant='body' color='link'>
                                Settings
                            </Text>
                        </Pressable>
                    ),
                    headerLeft: () => <StackBack />,
                }}
            />
            {/* <Account account={account} /> */}
        </View>
    );
}
