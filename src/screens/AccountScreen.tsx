import { Text, View } from '@/components/commons';
import Account from '@/features/accounts/Account';
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

    const screenTitle = account.display_name || account.name;

    return (
        <View className='flex-1'>
            <Stack.Screen
                options={{
                    title: screenTitle,
                    headerRight: () => (
                        <Pressable
                            hitSlop={10}
                            onPress={() =>
                                router.push({
                                    pathname: '/accounts/account-settings',
                                    params: { id },
                                })
                            }
                        >
                            <Text variant='body' className='px-4'>
                                Settings
                            </Text>
                        </Pressable>
                    ),
                }}
            />
            <Account account={account} />
        </View>
    );
}
