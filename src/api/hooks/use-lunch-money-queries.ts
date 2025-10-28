import {
  assetsQuery,
  budgetQuery,
  categoriesQuery,
  plaidQuery,
  recurringItemsQuery,
  transactionsQuery,
} from '@/src/api/constants/queryOptions';
import { useQueries, useQuery } from '@tanstack/react-query';
import { combineAccounts } from '../utils';

// ----------------------------------------------

// Combine plaid and assets queries
export const useGetAccounts = () => {
  return useQueries({
    queries: [plaidQuery(), assetsQuery()],
    combine: (results) => combineAccounts(results),
  });
};

// ----------------------------------------------

export const useGetBudget = ({
  start,
  end,
}: {
  start: string;
  end: string;
}) => {
  return useQuery(budgetQuery(start, end));
};

// ----------------------------------------------

export const useGetRecurringItems = (month: string) => {
  return useQuery(recurringItemsQuery(month));
};

// ----------------------------------------------

export const useGetCategories = () => {
  return useQuery(categoriesQuery());
};

// ----------------------------------------------

export const useGetTransactions = ({
  start,
  end,
}: {
  start: string;
  end: string;
}) => {
  return useQuery(transactionsQuery(start, end));
};
