import { NormalizedAccount } from '@/api/types/queryTypes';
import {
    calculateUsagePercentage,
    checkAccountDueDay,
    checkInactiveAccount,
    displayAccountLimit,
} from '@/features/accounts/utils/account-helper';
import { AccountSettingsRecord } from '@/lib/accountSettingsService';
import { formatCurrency } from '@/utils/number-formatter';

const useAccountDetails = (
    account: NormalizedAccount,
    accountSetting: AccountSettingsRecord | null | undefined,
    isLongFormat: boolean = false
) => {
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
        account.isIncome,
        isLongFormat
    );
    const { usagePercentageText, usageColor } = calculateUsagePercentage(
        limitValue,
        account.limit,
        account.isIncome,
        account.balance
    );

    return {
        mask,
        balance,
        name,
        dueDay,
        accountInactiveMessage,
        dueDayAtMessage,
        dueWarningColor,
        limitLabel,
        limitValue,
        usagePercentageText,
        usageColor,
    };
};
export default useAccountDetails;
