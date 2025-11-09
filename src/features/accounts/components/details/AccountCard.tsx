import { NormalizedAccount } from '@/api/types/queryTypes';
import { Text, View } from '@/components/commons';
import { type ThemedTextProps } from '@/components/commons/Text';
import AccountMask from '@/features/accounts/components/commons/AccountMask';
import { BankLogo } from '@/features/accounts/components/commons/BankLogo';
import HeadsUpAlertMessage from '@/features/accounts/components/commons/HeadsUpAlertMessage';

export interface AccountCardProps {
    name: string;
    mask: string;
    balance: string | number;
    dueDay: number;
    accountInactiveMessage: string | null;
    dueDayAtMessage: string;
    dueMonthDay: string;
    dueWarningColor: '' | 'label' | 'tertiaryLabel' | 'error' | 'warning';
    limitLabel: string | number;
    limitValue: number;
    usagePercentageText: string;
    usageColor: ThemedTextProps['color'];
    isLoading: boolean;
    account: NormalizedAccount;
}

export default function AccountCard({
    name,
    mask,
    balance,
    accountInactiveMessage,
    dueDayAtMessage,
    dueMonthDay,
    dueWarningColor,
    limitLabel,
    limitValue,
    usagePercentageText,
    usageColor,
    isLoading,
    account,
}: AccountCardProps) {
    return (
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
                        isIncome={account.isIncome}
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
                    <Text variant='title2' isNumeric>
                        {balance}
                    </Text>
                </View>

                <View className='flex-row gap-1 justify-between mt-3'>
                    <Text variant='body' color='secondaryLabel'>
                        Spending limit
                    </Text>
                    <Text
                        variant='body'
                        isNumeric
                        color={limitValue > 0 ? 'label' : 'tertiaryLabel'}
                    >
                        {limitLabel}
                    </Text>
                </View>
                <View className='flex-row gap-1 justify-between mt-3'>
                    <Text variant='body' color='secondaryLabel'>
                        Used percentage
                    </Text>
                    <Text variant='body' color={usageColor} isNumeric>
                        {usagePercentageText}
                    </Text>
                </View>
            </View>
        </View>
    );
}
