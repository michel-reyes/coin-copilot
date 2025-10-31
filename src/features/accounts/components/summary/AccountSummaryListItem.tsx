import { useGetAccountSettings } from '@/api/hooks/use-supabase-queries';
import { NormalizedAccount } from '@/api/types/queryTypes';
import { ListItem, Text, View } from '@/components/commons';
import { IconSymbol } from '@/components/os/IconSymbol';
import { BankLogo } from '@/features/accounts/components/commons/BankLogo';
import {
    calculateUsagePercentage,
    checkAccountDueDay,
    checkInactiveAccount,
    displayAccountLimit,
} from '@/features/accounts/utils/account-helper';
import colors from '@/themes/colors';
import { formatCurrency } from '@/utils/number-formatter';

interface HeadsUpAlertMessageProps {
    accountInactiveMessage?: string | null;
    dueDayAtMessage?: string;
    dueWarningColor?: '' | 'label' | 'tertiaryLabel' | 'error' | 'warning';
}

const HeadsUpAlertMessage = ({
    accountInactiveMessage,
    dueDayAtMessage,
    dueWarningColor,
}: HeadsUpAlertMessageProps) => {
    if (accountInactiveMessage) {
        return (
            <Text
                variant='caption1'
                color='warning'
                className='font-bold uppercase'
                style={{
                    boxShadow: `rgba(254,150,1,0.55) -50px 25px 90px`,
                }}
            >
                {accountInactiveMessage}
            </Text>
        );
    }
    if (dueDayAtMessage) {
        let dueMessageShadowColor = null;
        if (dueWarningColor === 'error') {
            dueMessageShadowColor = 'rgba(254,58,48,0.55)';
        } else if (dueWarningColor === 'warning') {
            dueMessageShadowColor = 'rgba(254,150,1,0.55)';
        }

        return (
            <Text
                variant='caption1'
                color='secondaryLabel'
                className='font-bold uppercase'
                style={{
                    boxShadow: dueMessageShadowColor
                        ? `${dueMessageShadowColor} 0px 30px 90px`
                        : '',
                }}
            >
                Due{` `}
                <Text
                    variant='caption1'
                    color={dueWarningColor}
                    className='font-bold uppercase'
                >
                    {dueDayAtMessage}
                </Text>
            </Text>
        );
    }

    return null;
};

export default function AccountSummaryListItem({
    account,
}: {
    account: NormalizedAccount;
}) {
    // Get the due day from the store if it exists
    const {
        data: accountSetting,
        isLoading,
        isError,
    } = useGetAccountSettings(account.id.toString(), account.institution_name);

    if (account.isClosed) {
        return <Text>Account is closed</Text>;
    }

    if (isLoading) {
        return <Text>Loading...</Text>;
    }

    if (isError) {
        return <Text>Error loading account settings</Text>;
    }

    // format fields
    const settingsLimit = accountSetting?.balance_limit || null;
    const mask = account.mask ? `${account.mask}` : '####';
    const balance = formatCurrency(account.balance);
    const name = account.display_name;

    const dueDay = accountSetting?.due_day || 0;
    const accountInactiveMessage = checkInactiveAccount(
        dueDay,
        account.status,
        account.lastUpdate
    );
    const { dueDayAtMessage, dueWarningColor } = checkAccountDueDay(dueDay);
    const { limitLabel, limitValue } = displayAccountLimit(
        account.limit,
        settingsLimit,
        account.isIncome
    );
    const { usagePercentageText, usageColor } = calculateUsagePercentage(
        limitValue,
        account.limit,
        account.isIncome,
        account.balance
    );

    return (
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
                <HeadsUpAlertMessage
                    accountInactiveMessage={accountInactiveMessage}
                    dueDayAtMessage={dueDayAtMessage}
                    dueWarningColor={dueWarningColor}
                />
            }
            description={
                <Text variant='headline' className='flex-1'>
                    {name}
                </Text>
            }
            descriptionHint={<Text variant='headline'>{balance}</Text>}
            metadata={
                <View className='flex-row items-center gap-3 flex-1'>
                    <View className='flex-row items-center gap-1'>
                        <IconSymbol
                            name='ellipsis'
                            color={colors['system-icon']}
                            size={24}
                        />
                        <Text variant='headline' color='tertiaryLabel'>
                            {mask}
                        </Text>
                    </View>

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
            metadataHint={
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
        />
    );
}
