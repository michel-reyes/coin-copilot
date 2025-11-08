import { Transaction } from '@/api/types/apiTypes';
import { TODAY } from '@/utils/date-utils';

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

// -------------------------------------------------------------------

/**
 * Function to get the oldest transaction date from data
 * Define this function before using it in onSuccess
 * @param data
 * @returns string YYYY-MM-DD
 */
export function getOldestTransactionDate(data?: Transaction[]) {
    if (!data || data.length === 0) return TODAY;
    const oldestDate = data.at(-1)?.date || TODAY;
    return oldestDate;
}
