import { lunchMoneyClient } from '@/src/api/api-client';
import { LUNCH_MONEY_ENDPOINTS } from '@/src/api/constants/apiSettings';

// ----------------------------------------------

export const fetchTransactions = async (start: string, end: string) => {
  // await new Promise((resolve) => setTimeout(resolve, 3000)); // TODO: delete
  const queryParams = `?debit_as_negative=true&limit=5000&start_date=${start}&end_date=${end}`;
  const response = await lunchMoneyClient.get(
    LUNCH_MONEY_ENDPOINTS.TRANSACTIONS + queryParams
  );
  return response.data;
};

// ----------------------------------------------

export const fetchAssets = async () => {
  const response = await lunchMoneyClient.get(LUNCH_MONEY_ENDPOINTS.ASSETS);
  return response.data;
};

// ----------------------------------------------

export const fetchPlaid = async () => {
  // await new Promise((resolve) => setTimeout(resolve, 1400)); // TODO: delete
  const response = await lunchMoneyClient.get(
    LUNCH_MONEY_ENDPOINTS.PLAID_ACCOUNTS
  );
  return response.data;
};

// ----------------------------------------------

export const fetchCategories = async () => {
  const queryParams = `?format=nested`;
  const response = await lunchMoneyClient.get(
    LUNCH_MONEY_ENDPOINTS.CATEGORIES + queryParams
  );
  return response.data;
};

// ----------------------------------------------

export const fetchRecurringItems = async (month: string) => {
  const queryParams = `?start_date=${month}`;
  const response = await lunchMoneyClient.get(
    LUNCH_MONEY_ENDPOINTS.RECURRING_ITEMS + queryParams
  );
  return response.data;
};

// ----------------------------------------------

export const fetchBudgets = async (start: string, end: string) => {
  // await new Promise((resolve) => setTimeout(resolve, 3000)); // TODO: delete
  const queryParams = `?start_date=${start}&end_date=${end}`;
  const response = await lunchMoneyClient.get(
    LUNCH_MONEY_ENDPOINTS.BUDGETS + queryParams
  );
  return response.data;
};
