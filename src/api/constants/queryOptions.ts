import { queryOptions } from '@tanstack/react-query';
import {
    fetchAssets,
    fetchCategories,
    fetchPlaid,
    fetchRecurringItems,
    fetchTransactions,
    fetchBudgets,
} from '@/api/lunch-money-api-service';
import {
    fetchAccountSettings,
    fetchAppSettings,
    fetchTransactionsAnomaly,
    fetchMessageAlerts,
    createMessageAlert,
} from '@/api/prisma-api-service';
import { LUNCH_MONEY_KEYS, PRISMA_KEYS } from '@/api/constants/apiSettings';
import { flattenCategories, flattenAndGroupRecurring } from '@/api/utils';

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

export const accountSettingsQuery = (accountId?: string) => {
    return queryOptions({
        queryKey: [PRISMA_KEYS.accountSettings, accountId],
        queryFn: () => fetchAccountSettings(accountId),
    });
};

// ----------------------------------------------

export const appSettingsQuery = () => {
    return queryOptions({
        queryKey: [PRISMA_KEYS.appSettings],
        queryFn: fetchAppSettings,
    });
};

// ----------------------------------------------

export const transactionsAnomalyQuery = () => {
    return queryOptions({
        queryKey: [PRISMA_KEYS.transactionsAnomaly],
        queryFn: fetchTransactionsAnomaly,
    });
};

// ----------------------------------------------

export const messageAlertsQuery = () => {
    return queryOptions({
        queryKey: [PRISMA_KEYS.messageAlerts],
        queryFn: fetchMessageAlerts,
    });
};

// ----------------------------------------------

export const createMessageAlertQuery = () => {
    return queryOptions({
        queryKey: [PRISMA_KEYS.messageAlerts],
        queryFn: createMessageAlert,
    });
};
