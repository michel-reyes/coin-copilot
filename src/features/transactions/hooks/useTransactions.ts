import { useGetTransactions } from '@/api/hooks/use-lunch-money-queries';
import { Transaction } from '@/api/types/apiTypes';
import { CURRENT_MONTH_END, LAST_5_MONTHS_START } from '@/utils/date-utils';
import { type TransactionFilterType } from './useTransactionsSortAndFilter';

const useTransactions = () => {
    const startDate = LAST_5_MONTHS_START;
    const endDate = CURRENT_MONTH_END;

    console.log({ startDate, endDate });

    const { data, isLoading, isError } = useGetTransactions({
        start: startDate,
        end: endDate,
    });

    const transactions: Transaction[] = data?.transactions || [];

    /**
     * Get transaction by account
     */
    const getTransactionsByAccount = (accountId: number) => {
        if (!transactions || transactions.length === 0 || !accountId) {
            return [];
        }

        return transactions.filter((transaction) => {
            if (transaction.plaid_account_id != null) {
                return transaction.plaid_account_id === accountId;
            }
            return transaction.asset_id === accountId;
        });
    };

    /**
     * Filters transactions based on the user selected filter type.
     */
    const getFilteredTransactionsByUser = (
        transactions: Transaction[],
        filter: TransactionFilterType
    ) => {
        if (!transactions || transactions.length === 0) return [];

        if (filter === 'all') return transactions;
        if (filter === 'income') return transactions.filter((t) => t.is_income);
        if (filter === 'expense')
            return transactions.filter((t) => !t.is_income);
        // if (filter === "category") return transactions.filter((t) => t.category_id);

        return transactions;
    };

    return {
        isError,
        isLoading,
        transactions,
        getFilteredTransactionsByUser,
        getTransactionsByAccount,
    };
};

export default useTransactions;
