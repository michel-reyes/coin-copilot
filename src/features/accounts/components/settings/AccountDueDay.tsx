import { useGetAccountSettings } from '@/api/hooks/use-supabase-queries';
import { NormalizedAccount } from '@/api/types/queryTypes';
import { Text, View } from '@/components/commons';
import CircleSelectedSVG from '@/features/accounts/components/commons/CircleSelectSVG';
import { TODAY_DAY } from '@/utils/date-utils';
import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';

interface AccountDueDayProps {
    account: NormalizedAccount;
    onDueDayChange?: (dueDay: number) => void;
}

export default function AccountDueDay({
    account,
    onDueDayChange,
}: AccountDueDayProps) {
    // Generate days from 1 to 31
    const actualDays = Array.from({ length: 31 }, (_, i) => i + 1);
    // Add 4 blank placeholders at the beginning for the offset
    const days = [null, null, null, null, ...actualDays];

    // Get the due day from the DB if it exists
    const accountId = String(account.id);
    const {
        data: accountSetting,
        isLoading,
        isError,
    } = useGetAccountSettings(accountId, account.institution_name);

    // Local state for the selected day
    const [selectedDay, setSelectedDay] = useState<number | undefined>(
        undefined
    );

    // Load the due day from the DB on mount
    useEffect(() => {
        // wait until all required data is loaded
        if (isLoading || isError || !accountSetting) return;

        // accountSetting is now a single object from Supabase
        const dueDay = accountSetting.due_day;

        if (dueDay !== undefined && dueDay !== null) {
            setSelectedDay(dueDay);
        }
    }, [accountId, accountSetting, isLoading, isError]);

    // Handle day selection
    const handleDayPress = (day: number) => {
        setSelectedDay(day);

        // Save limit into parent state
        if (onDueDayChange) {
            onDueDayChange(day);
        }
    };

    // -------------------------------------------------------------------

    if (isLoading) {
        return (
            <View className='p-4 border mb-4'>
                <Text className='mb-5'>Due Day</Text>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View className='p-4 border mb-4'>
                <Text className='mb-5'>Due Day</Text>
                <Text>Error loading account settings</Text>
            </View>
        );
    }

    // -------------------------------------------------------------------

    // Render a day item
    const renderDayItem = ({ item }: { item: number | null }) => {
        if (item === null) {
            // Render a blank placeholder view with the same dimensions
            return <View className='w-10 h-10 m-0.5' />;
        }

        const isSelected = selectedDay === item;
        const isToday = item === TODAY_DAY;

        return (
            <Pressable
                className='w-12 h-12 justify-center items-center m-0.5 rounded-full bg-transparent'
                onPress={() => handleDayPress(item)}
            >
                {isSelected && (
                    <View className='absolute inset-0 flex justify-center items-center'>
                        <CircleSelectedSVG width={70} height={70} />
                    </View>
                )}
                <Text
                    variant={isToday ? 'headline' : 'body'}
                    color={isToday ? 'link' : 'label'}
                >
                    {item}
                </Text>
            </Pressable>
        );
    };

    return (
        <View className='p-4'>
            <View className='mb-4 gap-3'>
                <Text variant='headline' color='label'>
                    Due Day
                </Text>
                <Text variant='caption1' color='tertiaryLabel'>
                    Choose the day of the month this account is due. We'll
                    notify you when your due day is coming up.
                </Text>
            </View>

            {Array.from({ length: Math.ceil(days.length / 7) }).map(
                (_, rowIndex) => (
                    <View
                        key={`row-${rowIndex}`}
                        className='flex-row justify-around w-full mb-px'
                    >
                        {days
                            .slice(rowIndex * 7, rowIndex * 7 + 7)
                            .map((dayItem, colIndex) => {
                                const element = renderDayItem({
                                    item: dayItem,
                                });
                                return React.cloneElement(element, {
                                    key:
                                        dayItem != null
                                            ? `day-${dayItem}`
                                            : `blank-${rowIndex}-${colIndex}`,
                                });
                            })}
                    </View>
                )
            )}
        </View>
    );
}
