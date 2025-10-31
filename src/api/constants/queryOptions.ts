import { LUNCH_MONEY_KEYS, SUPABASE_KEYS } from '@/api/constants/apiSettings';
import {
    fetchAssets,
    fetchBudgets,
    fetchCategories,
    fetchPlaid,
    fetchRecurringItems,
    fetchTransactions,
} from '@/api/lunch-money-api-service';

import { flattenAndGroupRecurring, flattenCategories } from '@/api/utils';
import { fetchAccountSettings } from '@/lib/accountSettingsService';
import { queryOptions } from '@tanstack/react-query';

// ----------------------------------------------

export const plaidQuery = () => {
    return queryOptions({
        queryKey: [LUNCH_MONEY_KEYS.plaid],
        queryFn: fetchPlaid,
    });
};

// ----------------------------------------------

export const assetsQuery = () => {
    return queryOptions({
        queryKey: [LUNCH_MONEY_KEYS.assets],
        queryFn: fetchAssets,
    });
};

// ----------------------------------------------

export const budgetQuery = (start: string, end: string) => {
    return queryOptions({
        queryKey: [LUNCH_MONEY_KEYS.budget, start, end],
        queryFn: () => fetchBudgets(start, end),
    });
};

// ----------------------------------------------

export const recurringItemsQuery = (month: string) => {
    return queryOptions({
        queryKey: [LUNCH_MONEY_KEYS.recurringItems, month],
        queryFn: () => fetchRecurringItems(month),
        select: (data) => flattenAndGroupRecurring(data),
    });
};

// ----------------------------------------------

export const categoriesQuery = () => {
    return queryOptions({
        queryKey: [LUNCH_MONEY_KEYS.categories],
        queryFn: fetchCategories,
        select: (data) => flattenCategories(data?.categories),
    });
};

// ----------------------------------------------

export const transactionsQuery = (start: string, end: string) => {
    return queryOptions({
        queryKey: [LUNCH_MONEY_KEYS.transactions, start, end],
        queryFn: () => fetchTransactions(start, end),
    });
};

// ----------------------------------------------

export const accountSettingsQuery = (
    accountId: string,
    institutionName: string
) => {
    return queryOptions({
        queryKey: [SUPABASE_KEYS.accountSettings, accountId, institutionName],
        queryFn: () => fetchAccountSettings(accountId, institutionName),
    });
};
