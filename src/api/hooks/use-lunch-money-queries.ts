import { useQueries, useQuery } from '@tanstack/react-query';
import {
    plaidQuery,
    budgetQuery,
    assetsQuery,
    recurringItemsQuery,
    categoriesQuery,
    transactionsQuery,
} from '@/api/constants/queryOptions';
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

export const useGetBudget = ({ start, end }: { start: string; end: string }) => {
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

export const useGetTransactions = ({ start, end }: { start: string; end: string }) => {
    return useQuery(transactionsQuery(start, end));
};
