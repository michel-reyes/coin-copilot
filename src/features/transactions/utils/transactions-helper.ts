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
 * Function to get transaction date range
 * @param data
 * @returns <Record> {.start, end }
 */
export function getTransactionDateRange(data?: Transaction[]) {
    if (!data || data.length === 0)
        return {
            start: TODAY,
            end: TODAY,
        };

    const endDate = data.at(-1)?.date || TODAY;
    const startDate = data.at(0)?.date || TODAY;
    return {
        start: startDate,
        end: endDate,
    };
}
