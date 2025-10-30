import { useGetAccountSettings } from '@/api/hooks/use-prisma-queries';
import { NormalizedAccount } from '@/api/types/queryTypes';
import { Text, View } from '@/components/commons';
import { IconSymbol } from '@/components/os/IconSymbol';
import colors from '@/themes/colors';
import React, { useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import { displayAccountLimit } from '../../utils/account-helper';

interface AccountBalanceLimitProps {
    account: NormalizedAccount;
    /** Limit provided by the API (Plaid), null if not available (Assets) */
    apiLimit: number | null;
    onLimitChange?: (limit: number) => void;
}

/**
 * Component to display and optionally set the balance limit for an account.
 * - If apiLimit is provided, it's displayed read-only.
 * - If apiLimit is null, the user can set a custom limit stored in Zustand.
 */
export default function AccountBalanceLimit({
    account,
    apiLimit,
    onLimitChange,
}: AccountBalanceLimitProps) {
    const {
        data: accountSettings,
        isLoading,
        isError,
    } = useGetAccountSettings(String(account.id));

    // Local state for the input when editable - initialize with empty string
    const [inputValue, setInputValue] = useState<string>('');

    const { limitLabel } = displayAccountLimit(
        account.limit,
        accountSettings?.balanceLimit || 0,
        account.isIncome
    );
    // Determine if the component is in an editable state
    const isEditable = apiLimit === null && !account.isIncome;
    const hasOriginalLimit = account?.limit !== null;

    useEffect(() => {
        if (isLoading || isError) {
            // Don't attempt to set inputValue until loading/error state is resolved
            // or if accountSettings are not yet available.
            return;
        }

        if (!isEditable) {
            // Component is not for user editing (e.g., apiLimit is set, or it's an income account).
            // The editable TextInput isn't rendered or is non-interactive.
            // Set inputValue for consistency if apiLimit is available, though not critical for user input.
            if (apiLimit !== null) {
                setInputValue(String(apiLimit));
            } else if (account.isIncome) {
                setInputValue(''); // Or a placeholder like "N/A" for income accounts
            }
            return;
        }

        // At this point, isEditable is true (apiLimit is null AND !account.isIncome).
        // The user-editable TextInput section is rendered.
        if (hasOriginalLimit) {
            // TextInput is rendered but set to `editable={false}` by its prop.
            // It displays `account.limit` (institution-set limit).
            setInputValue(String(account.limit));
        } else {
            // TextInput is rendered and `editable={true}` by its prop.
            // User can set a custom limit. Initialize from `accountSettings.balanceLimit`.
            const currentCustomLimit = accountSettings?.balanceLimit;
            // If currentCustomLimit is 0, String(0) is "0". If undefined, then ''.
            setInputValue(
                currentCustomLimit !== undefined
                    ? String(currentCustomLimit)
                    : ''
            );
        }
    }, [
        account.id,
        account.limit,
        account.isIncome,
        accountSettings, // This includes accountSettings itself, not just balanceLimit
        isEditable,
        hasOriginalLimit,
        apiLimit,
        isLoading,
        isError,
    ]);

    const handleInputChange = (text: string): void => {
        // Allow only numbers and at most one decimal point
        let numericValue = text.replace(/[^0-9.]/g, '');
        const parts = numericValue.split('.');
        if (parts.length > 2) {
            numericValue = `${parts[0]}.${parts.slice(1).join('')}`;
        }

        setInputValue(numericValue);

        // Conditions for calling onLimitChange:
        // 1. `onLimitChange` callback must exist.
        // 2. The component must be in a state where user can set a limit:
        //    - `isEditable` must be true (apiLimit is null AND !account.isIncome)
        //    - `hasOriginalLimit` must be false (account.limit is null, so it's not an institution-set limit)
        //    The TextInput's own `editable` prop (`!hasOriginalLimit`) ensures user interaction only happens in this case.
        if (!onLimitChange || !isEditable || hasOriginalLimit) {
            return;
        }

        if (numericValue.trim() === '') {
            // If input is cleared, call onLimitChange with 0
            onLimitChange(0);
        } else {
            const parsedLimit = parseFloat(numericValue);
            // Ensure the parsed limit is a non-negative number
            if (!isNaN(parsedLimit) && parsedLimit >= 0) {
                onLimitChange(parsedLimit);
            } else {
                // Invalid number (e.g., "1.2.3", negative, or just ".")
                // Do not call onLimitChange. User sees the invalid input until corrected.
                console.error(
                    'Invalid or negative number entered for limit:',
                    numericValue
                );
            }
        }
    };

    // If still loading or error, show a loading state
    if (isLoading) {
        return (
            <View className='p-4 border mb-4'>
                <Text className='mb-5'>Balance Limit</Text>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (isError || !accountSettings) {
        if (account.isIncome) {
            return (
                <View className='p-4 border mb-4'>
                    <Text className='mb-5'>Balance Limit</Text>
                    <Text>Income accounts do not have a balance limit</Text>
                </View>
            );
        }
        return (
            <View className='p-4 border mb-4'>
                <Text className='mb-5'>Balance Limit</Text>
                <Text>Error loading account settings</Text>
            </View>
        );
    }

    return (
        <View className='p-4'>
            <View className='mb-4 gap-3'>
                <Text variant='headline' color='label'>
                    Balance Limit
                </Text>
                {hasOriginalLimit && (
                    <Text variant='caption1' color='warning'>
                        This limit is set by your financial institution and
                        cannot be modified.
                    </Text>
                )}
                {account.isIncome && (
                    <Text variant='caption1' color='warning'>
                        Debit accounts do not have a balance limit.
                    </Text>
                )}
                {!hasOriginalLimit && !account.isIncome && (
                    <Text variant='caption1' color='tertiaryLabel'>
                        Set a balance limit to help you manage your account.
                    </Text>
                )}
            </View>
            {!isEditable && (
                <View className='flex-row items-center gap-3'>
                    <IconSymbol
                        name='triangle.tophalf.filled'
                        color={colors['system-icon']}
                        size={18}
                    />
                    <Text variant='headline' color='secondaryLabel'>
                        {limitLabel}
                    </Text>
                </View>
            )}
            {isEditable && (
                <View className='flex-row items-center bg-system-input rounded-2xl h-14 px-4 gap-3'>
                    <IconSymbol
                        name='triangle.tophalf.filled'
                        color={colors['system-icon']}
                        size={18}
                    />
                    <TextInput
                        placeholderTextColor={colors['system-text-placeholder']}
                        editable={!hasOriginalLimit}
                        style={{
                            flex: 1,
                            fontSize: 16,
                            color: hasOriginalLimit
                                ? colors['system-text-placeholder']
                                : colors['system-white'],
                            backgroundColor: hasOriginalLimit
                                ? 'transparent'
                                : 'transparent',
                        }}
                        keyboardType='decimal-pad'
                        value={inputValue}
                        onChangeText={handleInputChange}
                        placeholder='Enter account limit'
                    />
                </View>
            )}
        </View>
    );
}
