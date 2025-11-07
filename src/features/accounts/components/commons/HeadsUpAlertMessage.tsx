import { Text, View } from '@/components/commons';

interface HeadsUpAlertMessageProps {
    accountInactiveMessage?: string | null;
    dueDayAtMessage?: string;
    dueMonthDay?: string;
    dueWarningColor?: '' | 'label' | 'tertiaryLabel' | 'error' | 'warning';
    isLoading?: boolean;
    isAccountInactive?: boolean;
    isIncome?: boolean;
}

const HeadsUpAlertMessage = ({
    accountInactiveMessage,
    dueDayAtMessage,
    dueMonthDay,
    dueWarningColor,
    isLoading = false,
    isAccountInactive = false,
    isIncome = false,
}: HeadsUpAlertMessageProps) => {
    if (isLoading) {
        return <Text>Loading...</Text>;
    }

    if (isIncome) {
        return (
            <Text variant='caption1' className='font-bold text-right'>
                Debit account
            </Text>
        );
    }

    return (
        <View className='flex-1 gap-1 justify-center'>
            {accountInactiveMessage && (
                <Text
                    variant='caption1'
                    className='font-bold uppercase text-system-yellow'
                >
                    {accountInactiveMessage}
                </Text>
            )}
            {!isAccountInactive && dueDayAtMessage ? ( // Check for account status
                <View className='flex-1 flex-row items-center justify-between'>
                    <Text
                        variant='footnote'
                        color='tertiaryLabel'
                        className='font-bold'
                    >
                        Due{` `}
                        <Text
                            variant='footnote'
                            color={dueWarningColor}
                            className='font-bold'
                        >
                            {dueDayAtMessage}
                        </Text>
                        {` `} on {` `}
                        <Text variant='footnote' className='font-bold'>
                            {dueMonthDay}
                        </Text>
                    </Text>
                </View>
            ) : (
                !isIncome && ( // Check for account status again
                    <View className='flex-1 flex-row items-center justify-between'>
                        <Text
                            variant='footnote'
                            color='tertiaryLabel'
                            className='font-bold'
                        >
                            Due on {` `}
                            <Text variant='footnote' className='font-bold'>
                                {dueMonthDay}
                            </Text>
                        </Text>
                    </View>
                )
            )}
        </View>
    );
};

export default HeadsUpAlertMessage;
