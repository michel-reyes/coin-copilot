import { AccountSettings } from '@/api/types/apiTypes';
import { type ThemedTextProps } from '@/components/commons/Text';
import { LAST_15_DAYS, TODAY_DAY, getMonthName } from '@/utils/date-utils';
import { formatShortCurrency } from '@/utils/number-formatter';
import dayjs from 'dayjs';

const PAYMENT_DUE_SOON_THRESHOLD = 7;

/**
 * Checks if the account's due date is approaching or past due.
 * Returns true if the current day is within 7 days of the due date.
 * @param dueDay The due day of the month for the account.
 * @param threshold Number of days before due date to consider payment as "due soon".
 * @returns boolean indicating if payment is due soon

 */
export function isAccountPaymentDueSoon(
    dueDay: number | null,
    threshold = PAYMENT_DUE_SOON_THRESHOLD,
    today: Date | null = null
) {
    if (dueDay) {
        // Number of days before due date to consider payment as "due soon"
        const _today = today !== null ? new Date().getDate() : TODAY_DAY;
        const dueDayRange = _today + threshold;
        if (dueDay >= _today && dueDay <= dueDayRange) {
            return true;
        }
    }
    return false;
}

/**
 * Checks accounts for upcoming payments based on their due days.
 * Returns an array of account IDs that have payments due soon.
 * @param accountDueDays A record mapping account IDs to their due day of the month.
 * @param threshold Number of days before due date to consider payment as "due soon".
 * @returns Array of account IDs with upcoming payments
 */
export function checkAccountsDueDay(
    accountDueDays: AccountSettings[],
    threshold = PAYMENT_DUE_SOON_THRESHOLD,
    today: Date | null = null
) {
    // Array to store account IDs that have upcoming due dates
    let accountsWithUpcomingPayments: string[] = [];

    // check each account due day
    for (const account of accountDueDays) {
        const dueDay = account.dueDay;
        const isDueSoon = isAccountPaymentDueSoon(dueDay, threshold, today);
        if (isDueSoon) {
            accountsWithUpcomingPayments.push(account.accountName);
        }
    }

    return accountsWithUpcomingPayments;
}

// ------------------------------------------------------------------

export function checkInactiveAccount(dueDay = 0, status = '', lastUpdate = '') {
    let accountInactiveMessage = null;
    if (!lastUpdate) {
        accountInactiveMessage;
    }

    const isInactiveAccount = status !== 'active';
    // check outdated account
    const _lastUpdate = dayjs(lastUpdate).format('YYYY-MM-DD');
    const outDated = _lastUpdate < LAST_15_DAYS;

    // generate attention message
    if (isInactiveAccount) {
        accountInactiveMessage = 'Account needs attention';
    } else if (outDated) {
        accountInactiveMessage = 'Account is outdated';
    }

    return accountInactiveMessage;
}

// ------------------------------------------------------------------

export function checkAccountDueDay(dueDay = 0) {
    // due day logic
    const isToday = (date: any) => date.isSame(dayjs(), 'day');
    const isTomorrow = (date: any) => date.isSame(dayjs().add(1, 'day'), 'day');

    let dueDayAtMessage = '';
    let dueWarningColor: ThemedTextProps['color'] = '';
    if (dueDay) {
        const now = dayjs();
        let calculatedFullDueDay = now.date(dueDay);
        if (calculatedFullDueDay.isBefore(now, 'day')) {
            calculatedFullDueDay = calculatedFullDueDay.add(1, 'month');
        }

        const daysDifference = calculatedFullDueDay
            .startOf('day')
            .diff(now.startOf('day'), 'days');

        if (isToday(calculatedFullDueDay)) {
            dueDayAtMessage = 'Today';
            dueWarningColor = 'error';
        } else if (isTomorrow(calculatedFullDueDay)) {
            dueDayAtMessage = 'Tomorrow';
            dueWarningColor = 'error';
        } else if (daysDifference >= 2 && daysDifference <= 3) {
            dueDayAtMessage = `in ${daysDifference} days`;
            dueWarningColor = 'error';
        } else if (daysDifference >= 4 && daysDifference <= 6) {
            dueDayAtMessage = `in ${daysDifference} days`;
            dueWarningColor = 'warning';
        } else if (daysDifference >= 7 && daysDifference <= 8) {
            dueDayAtMessage = `in ${daysDifference} days`;
            dueWarningColor = 'label';
        } else if (daysDifference >= 9 && daysDifference <= 13) {
            // Corresponds to "more than 8 days and less than 14 days"
            dueDayAtMessage = `${getMonthName(
                calculatedFullDueDay.format('YYYY-MM-DD')
            )} ${calculatedFullDueDay.format('DD')}`;
            dueWarningColor = 'tertiaryLabel';
        } else {
            // No specific message for other ranges (e.g., > 13 days or past due beyond 'Today')
            // `at` remains empty, so dueDayMessage will not be set by the `if (at)` block later
        }
    }

    return { dueDayAtMessage, dueWarningColor };
}

// ------------------------------------------------------------------

export function displayAccountLimit(
    accountLimit: number | null,
    settingsLimit: number | null,
    isIncome: boolean
) {
    let limitValue: number | null = 0;
    // Handle limit rendering based on different conditions
    let limitLabel: string | number | null = null;
    if (accountLimit === 0) {
        limitLabel = 'open limit'; // Infinite spending
    } else if (accountLimit !== null) {
        limitLabel = formatShortCurrency(accountLimit);
        limitValue = accountLimit;
    } else if (isIncome) {
        limitLabel = 'Debit acct.'; // Not applicable for income accounts
    } else if (settingsLimit !== null) {
        limitLabel = settingsLimit;
        limitLabel = formatShortCurrency(settingsLimit);
        limitValue = Number(settingsLimit);
    } else {
        limitLabel = 'Not set'; // Limit not set yet for expense accounts
    }

    return { limitLabel, limitValue };
}

// ------------------------------------------------------------------

export function calculateUsagePercentage(
    limitValue: number | null,
    accountLimit: number | null,
    isIncome: boolean,
    accountBalance: string
) {
    // Calculate usage percentage and determine its color
    let usagePercentageText: string = 'N/A';
    let usageColor: ThemedTextProps['color'] = 'tertiaryLabel'; // Default for N/A or non-calculable cases

    if (limitValue !== null && limitValue > 0) {
        const percentage = (Number(accountBalance) / limitValue) * 100;
        const displayPercentage = Math.max(0, percentage); // Ensure usage isn't negative
        usagePercentageText = `${Math.round(displayPercentage)}%`;

        if (displayPercentage > 25) {
            usageColor = 'error';
        } else if (displayPercentage > 20) {
            usageColor = 'warning';
        } else if (displayPercentage > 15) {
            usageColor = 'label';
        } else {
            // 0% to 15%
            usageColor = 'tertiaryLabel';
        }
    } else {
        usagePercentageText = '--';
        usageColor = 'tertiaryLabel';
    }

    if (accountLimit === 0 || isIncome) {
        // Specifically for 'open limit'
        usagePercentageText = '--';
        usageColor = 'tertiaryLabel';
    }

    return { usagePercentageText, usageColor };
}
