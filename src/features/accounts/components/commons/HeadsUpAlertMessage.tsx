import { Text, View } from '@/components/commons';

interface HeadsUpAlertMessageProps {
    dueDay?: number;
    accountInactiveMessage?: string | null;
    dueDayAtMessage?: string;
    dueWarningColor?: '' | 'label' | 'tertiaryLabel' | 'error' | 'warning';
}

const HeadsUpAlertMessage = ({
    dueDay,
    accountInactiveMessage,
    dueDayAtMessage,
    dueWarningColor,
}: HeadsUpAlertMessageProps) => {
    if (accountInactiveMessage) {
        return (
            <Text
                variant='caption1'
                className='font-bold uppercase text-system-yellow'
            >
                {accountInactiveMessage}
            </Text>
        );
    }
    if (dueDayAtMessage) {
        return (
            <View className='flex-1 flex-row items-center justify-between'>
                <Text
                    variant='caption1'
                    color='tertiaryLabel'
                    className='font-bold uppercase'
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
            </View>
        );
    }

    return null;
};

export default HeadsUpAlertMessage;
