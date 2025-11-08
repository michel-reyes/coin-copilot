import { Transaction } from '@/api/types/apiTypes';

/**
 * Sorts the transactions by date
 *
 * @param transactions the list of transactions
 * @param order the order to sort by
 * @returns the sorted list of transactions
 */
export function sortTransactionsByDate(
    transactions: Transaction[],
    order: 'asc' | 'desc' = 'desc'
) {
    return transactions.sort((a: Transaction, b: Transaction) => {
        return order === 'asc'
            ? a.date.localeCompare(b.date)
            : b.date.localeCompare(a.date);
    });
}
