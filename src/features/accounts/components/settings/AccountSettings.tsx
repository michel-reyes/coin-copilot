import { Text, View } from '@/components/commons';
import useAccounts from '@/features/accounts/hooks/useAccounts';
import { useGlobalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';
import AccountBalanceLimit from './AccountBalanceLimit';
import AccountDueDay from './AccountDueDay';

export default function AccountSettings() {
    const [dueDay, setDueDay] = useState<number | undefined>(undefined);
    const [limit, setLimit] = useState<number | undefined>(undefined);
    const { getAccountById } = useAccounts();

    const { id } = useGlobalSearchParams<{ id: string }>();
    const account = getAccountById(id);

    if (!account) {
        return <Text>Account not found</Text>;
    }

    return (
        <View className='gap-4'>
            <View className='flex-row items-center p-4 justify-between'>
                <View className='gap-1'>
                    <Text variant='title2'>Settings</Text>
                    <Text variant='title3' color='tertiaryLabel'>
                        {account.display_name || account.name}
                    </Text>
                </View>
                <Pressable
                    hitSlop={10}
                    onPress={() => null}
                    className='self-start'
                >
                    <Text variant='body' color='link'>
                        Save
                    </Text>
                </Pressable>
            </View>
            <AccountBalanceLimit
                account={account}
                apiLimit={account.limit}
                onLimitChange={setLimit}
            />
            <AccountDueDay account={account} onDueDayChange={setDueDay} />
        </View>
    );
}
