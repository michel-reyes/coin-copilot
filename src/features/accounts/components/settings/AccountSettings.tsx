import { useUpsertAccountSettings } from '@/api/hooks/use-supabase-queries';
import { Text, View } from '@/components/commons';
import useAccounts from '@/features/accounts/hooks/useAccounts';
import { useGlobalSearchParams, useNavigation } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';
import AccountBalanceLimit from './AccountBalanceLimit';
import AccountDueDay from './AccountDueDay';

export default function AccountSettings() {
    const [dueDay, setDueDay] = useState<number | undefined>(undefined);
    const [balanceLimit, setBalanceLimit] = useState<number | undefined>(
        undefined
    );
    const upsertMutation = useUpsertAccountSettings();
    const { getAccountById } = useAccounts();
    const rootLayout = useNavigation('/(private)/accounts');

    const { id } = useGlobalSearchParams<{ id: string }>();
    const account = getAccountById(id);

    if (!account) {
        return <Text>Account not found</Text>;
    }

    // Save account settings and dismiss modal
    const handleSaveAccountSettings = () => {
        // Save due day
        // updateAccountSetting({
        //     accountId: String(account.id),
        //     updateData: {
        //         dueDay: dueDay,
        //         accountName: account.display_name || account.name,
        //     },
        // });

        // Save limit
        // updateAccountSetting({
        //     accountId: String(account.id),
        //     updateData: { balanceLimit: balanceLimit },
        // });
        upsertMutation.mutate({
            accountId: String(account.id),
            institutionName: account.institution_name,
            balanceLimit: balanceLimit,
        });

        // dismiss account settings modal
        rootLayout.goBack();
    };

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
                    onPress={handleSaveAccountSettings}
                    className='self-start'
                >
                    <Text variant='body' color='link'>
                        Save
                    </Text>
                </Pressable>
            </View>
            <AccountBalanceLimit
                account={account}
                onLimitChange={setBalanceLimit}
            />
            <AccountDueDay account={account} onDueDayChange={setDueDay} />
        </View>
    );
}
