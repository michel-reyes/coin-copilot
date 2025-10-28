import { LUNCH_MONEY_KEYS, PRISMA_KEYS } from '@//api/constants/apiSettings';
import {
  fetchAssets,
  fetchBudgets,
  fetchCategories,
  fetchPlaid,
  fetchRecurringItems,
  fetchTransactions,
} from '@//api/lunch-money-api-service';
import {
  createMessageAlert,
  fetchAccountSettings,
  fetchAppSettings,
  fetchMessageAlerts,
  fetchTransactionsAnomaly,
} from '@//api/prisma-api-service';
import { flattenAndGroupRecurring, flattenCategories } from '@//api/utils';
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
