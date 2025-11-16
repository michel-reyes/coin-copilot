import { useUpsertAccountSettings } from '@/api/hooks/use-supabase-queries';
import { Text, View } from '@/components/commons';
import useAccounts from '@/features/accounts/hooks/useAccounts';
import {
    deleteEventByAccount,
    updateOrCreateCreditCardEvent,
} from '@/lib/eventsApi';
import { useGlobalSearchParams, useRouter } from 'expo-router';
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
    const router = useRouter();

    const { id } = useGlobalSearchParams<{ id: string }>();
    const account = getAccountById(id);

    if (!account) {
        return <Text>Account not found</Text>;
    }

    // Save account settings and dismiss modal
    const handleSaveAccountSettings = async () => {
        // Save account settings to database
        upsertMutation.mutate({
            accountId: String(account.id),
            institutionName: account.institution_name,
            balanceLimit: balanceLimit,
            dueDay: dueDay,
        });

        // Handle event creation/update/deletion based on dueDay
        // for push notifications
        try {
            if (dueDay !== undefined && dueDay !== null) {
                // Create or update credit card event
                await updateOrCreateCreditCardEvent(
                    String(account.id),
                    account.institution_name,
                    account.display_name || account.name,
                    dueDay
                );
            } else {
                // Delete event if dueDay is cleared
                await deleteEventByAccount(
                    String(account.id),
                    account.institution_name
                );
            }
        } catch (error) {
            console.error('Error managing credit card event:', error);
            // Continue even if event creation fails - account settings are still saved
        }

        // dismiss account settings modal
        router.back();
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
                    <Text variant='body'>Save</Text>
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
