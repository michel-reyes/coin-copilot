import { useGetAccountSettings } from '@/api/hooks/use-supabase-queries';
import { NormalizedAccount } from '@/api/types/queryTypes';
import { ListItem, Text, View } from '@/components/commons';
import { IconSymbol } from '@/components/os/IconSymbol';
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

    // if (isError) {
    //     return <Text>Error loading account settings</Text>;
    // }

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
                hint={
                    <Text
                        variant='headline'
                        isNumeric
                        color={account.isIncome ? 'success' : 'label'}
                    >
                        {balance}
                    </Text>
                }
                description={
                    <View className='flex-row gap-2 flex-1'>
                        {accountInactiveMessage && (
                            <IconSymbol
                                weight='bold'
                                name='bolt.slash.fill'
                                color={colors['system-yellow']}
                                size={20}
                            />
                        )}
                        <HeadsUpAlertMessage
                            accountInactiveMessage=''
                            dueDayAtMessage={dueDayAtMessage}
                            dueMonthDay={dueMonthDay}
                            dueWarningColor={dueWarningColor}
                            isLoading={isLoading}
                            isIncome={account.isIncome}
                        />
                    </View>
                }
                descriptionHint={
                    <Text
                        color='tertiaryLabel'
                        variant='footnote'
                        className='mr-0 pr-0 ml-auto font-bold'
                    >
                        Used {` `}
                        <Text
                            variant='footnote'
                            color={usageColor}
                            className=' font-bold'
                        >
                            {usagePercentageText}
                        </Text>
                    </Text>
                }
            />
        </>
    );
}
