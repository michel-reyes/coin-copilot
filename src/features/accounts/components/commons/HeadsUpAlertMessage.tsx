import { Text, View } from '@/components/commons';

interface HeadsUpAlertMessageProps {
    accountInactiveMessage?: string | null;
    dueDayAtMessage?: string;
    dueMonthDay?: string;
    dueWarningColor?: '' | 'label' | 'tertiaryLabel' | 'error' | 'warning';
    isLoading?: boolean;
}

const HeadsUpAlertMessage = ({
    accountInactiveMessage,
    dueDayAtMessage,
    dueMonthDay,
    dueWarningColor,
    isLoading = false,
}: HeadsUpAlertMessageProps) => {
    if (isLoading) {
        return <Text>Loading...</Text>;
    }

    return (
        <View className='flex-1 gap-1'>
            {accountInactiveMessage && (
                <Text
                    variant='caption1'
                    className='font-bold uppercase text-system-yellow'
                >
                    {accountInactiveMessage}
                </Text>
            )}
            {dueDayAtMessage && (
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
            )}
        </View>
    );
};

export default HeadsUpAlertMessage;
