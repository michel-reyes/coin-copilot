import { useGetAccountSettings } from '@/api/hooks/use-supabase-queries';
import { NormalizedAccount } from '@/api/types/queryTypes';
import { Text, View } from '@/components/commons';
import AccountMask from '@/features/accounts/components/commons/AccountMask';
import { BankLogo } from '@/features/accounts/components/commons/BankLogo';
import HeadsUpAlertMessage from '@/features/accounts/components/commons/HeadsUpAlertMessage';
import useAccountDetails from '@/features/accounts/hooks/useAccountDetails';

export default function Account({ account }: { account: NormalizedAccount }) {
    const {
        data: accountSetting,
        isLoading,
        isError,
    } = useGetAccountSettings(account.id.toString(), account.institution_name);

    const {
        mask,
        balance,
        name,
        dueDay,
        accountInactiveMessage,
        dueDayAtMessage,
        dueMonthDay,
        dueWarningColor,
        limitLabel,
        limitValue,
        usagePercentageText,
        usageColor,
    } = useAccountDetails(account, accountSetting, true);

    return (
        <View>
            <View className='bg-system-surface-secondary m-4 p-0.5 rounded-3xl'>
                <View className='p-4 flex-row gap-2 items-center'>
                    <BankLogo title={name} />
                    <AccountMask mask={mask} />
                    <View className='ml-auto'>
                        <HeadsUpAlertMessage
                            accountInactiveMessage={accountInactiveMessage}
                            dueDayAtMessage={dueDayAtMessage}
                            dueMonthDay={dueMonthDay}
                            dueWarningColor={dueWarningColor}
                            isLoading={isLoading}
                        />
                    </View>
                </View>

                <View
                    variant='card'
                    className='m-1 bg-system-surface rounded-2xl py-6'
                >
                    <View className='flex gap-1'>
                        <Text variant='body' color='secondaryLabel'>
                            Total balance
                        </Text>
                        <Text variant='title2'>{balance}</Text>
                    </View>

                    <View className='flex-row gap-1 justify-between mt-3'>
                        <Text variant='body' color='secondaryLabel'>
                            Spending limit
                        </Text>
                        <Text
                            variant='body'
                            color={limitValue > 0 ? 'label' : 'tertiaryLabel'}
                        >
                            {limitLabel}
                        </Text>
                    </View>
                    <View className='flex-row gap-1 justify-between mt-3'>
                        <Text variant='body' color='secondaryLabel'>
                            Usage percentage
                        </Text>
                        <Text variant='body' color={usageColor}>
                            {usagePercentageText}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
