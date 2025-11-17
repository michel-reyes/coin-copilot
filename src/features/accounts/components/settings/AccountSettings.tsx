import { useUpsertAccountSettings } from '@/api/hooks/use-supabase-queries';
import { Text, View } from '@/components/commons';
import useAccounts from '@/features/accounts/hooks/useAccounts';
import {
    createReminder,
    deleteReminder,
    getReminderByAccount,
} from '@/lib/eventsApi';
import { getNotificationSchedule } from '@/lib/notificationSchedules';
import dayjs from 'dayjs';
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

        // Handle reminder creation/update/deletion based on dueDay
        // for push notifications
        try {
            if (dueDay !== undefined && dueDay !== null) {
                // Create a proper date from the day of the month
                // Use current month, or next month if the day has already passed
                let dueDate = dayjs().date(dueDay);

                // If the date is in the past, use next month
                if (dueDate.isBefore(dayjs(), 'day')) {
                    dueDate = dueDate.add(1, 'month');
                }

                // Format as YYYY-MM-DD for the API
                const dueDateString = dueDate.format('YYYY-MM-DD');

                // First, check if a reminder already exists for this account
                const { data: existingReminder } = await getReminderByAccount(
                    String(account.id)
                );

                // If reminder exists, delete it first before creating a new one
                if (existingReminder) {
                    await deleteReminder(existingReminder.id);
                }

                // Get notification schedule for credit card reminders
                // This will return an array like [7, 3, 0] for notifications
                // at 7 days before, 3 days before, and day-of
                const notificationSchedule =
                    getNotificationSchedule('credit_card');

                await createReminder({
                    title: `${account.display_name || account.name} Payment Due`,
                    body: `${account.display_name || account.name} Payment Due`,
                    due_at: dueDateString,
                    notify_before_schedules: notificationSchedule,
                    is_active: true,
                    account_id: String(account.id),
                });
            } else {
                // Delete reminder if dueDay is cleared
                const { data: existingReminder } = await getReminderByAccount(
                    String(account.id)
                );

                if (existingReminder) {
                    await deleteReminder(existingReminder.id);
                }
            }
        } catch (error) {
            console.error('Error managing credit card event:', error);
            // Continue even if reminder creation fails - account settings are still saved
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
