import { useGetAccountSettings } from '@/api/hooks/use-supabase-queries';
import { NormalizedAccount } from '@/api/types/queryTypes';
import { ListItem, Text, View } from '@/components/commons';
import { IconSymbol } from '@/components/os/IconSymbol';
import AccountMask from '@/features/accounts/components/commons/AccountMask';
import { BankLogo } from '@/features/accounts/components/commons/BankLogo';
import HeadsUpAlertMessage from '@/features/accounts/components/commons/HeadsUpAlertMessage';
import useAccountDetails from '@/features/accounts/hooks/useAccountDetails';
import colors from '@/themes/colors';

// ------------------------------------------------------------

export default function AccountSummaryListItem({
    account,
}: {
    account: NormalizedAccount;
}) {
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
        dueWarningColor,
        limitLabel,
        usagePercentageText,
        dueMonthDay,
        usageColor,
    } = useAccountDetails(account, accountSetting);

    if (account.isClosed) {
        return <Text>Account is closed</Text>;
    }

    if (isLoading) {
        return <Text>Loading...</Text>;
    }

    if (isError) {
        return <Text>Error loading account settings</Text>;
    }

    return (
        <>
            <ListItem
                href={
                    {
                        pathname: '/accounts/[id]',
                        params: { id: account.id.toString() },
                    } as any
                }
                showLinkIcon={false}
                leadingIcon={<BankLogo title={name} />}
                dividerStartSpace={52}
                density='condensed'
                title={
                    <Text variant='headline' className='flex-1'>
                        {name}
                    </Text>
                }
                hint={<Text variant='headline'>{balance}</Text>}
                description={
                    <View className='flex-row items-center gap-3 flex-1'>
                        <AccountMask mask={mask} />

                        <View className='flex-row items-center gap-1'>
                            <IconSymbol
                                name='triangle.tophalf.filled'
                                color={colors['system-white']}
                                size={18}
                            />

                            <Text variant='headline' color='tertiaryLabel'>
                                {limitLabel}
                            </Text>
                        </View>
                    </View>
                }
                descriptionHint={
                    <Text
                        color='tertiaryLabel'
                        className='font-bold mr-0 pr-0 ml-auto'
                    >
                        Usage {` `}
                        <Text variant='headline' color={usageColor}>
                            {usagePercentageText}
                        </Text>
                    </Text>
                }
                metadata={
                    <View className='mt-3'>
                        <HeadsUpAlertMessage
                            accountInactiveMessage={accountInactiveMessage}
                            dueDayAtMessage={dueDayAtMessage}
                            dueMonthDay={dueMonthDay}
                            dueWarningColor={dueWarningColor}
                            isLoading={isLoading}
                            isIncome={account.isIncome}
                        />
                    </View>
                }
            />
        </>
    );
}
