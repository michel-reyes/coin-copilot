import { Transaction } from '@/api/types/apiTypes';
import { TODAY } from '@/utils/date-utils';
import {
  FilterOperator,
  FilterValue,
  TransactionFilters,
} from '../hooks/useTransactionsSortAndFilter';

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

// -------------------------------------------------------------------

/**
 * Checks if a value matches a filter condition.
 * @param value The value from the transaction.
 * @param filter The filter criteria.
 * @returns True if the value matches the filter, false otherwise.
 */
export function matchesFilter<T>(
  value: T | undefined | null,
  filter: FilterValue<T>
): boolean {
  // For direct equality checks (when filter is not an object with op/value)
  if (typeof filter !== 'object' || filter === null || Array.isArray(filter)) {
    return value === filter;
  }

  // At this point, filter is an object with op and value
  const { op, value: filterValue } = filter as {
    op: FilterOperator;
    value: T | [T, T] | null;
  };

  // Special handling for null values
  if (op === 'eq' && filterValue === null) {
    return value === null;
  }

  if (op === 'neq' && filterValue === null) {
    return value !== null;
  }

  // If the transaction field is null/undefined and we're not specifically looking for null,
  // it can't match other filter conditions
  if (value === undefined || value === null) {
    return false;
  }

  // At this point, we've already handled the null filterValue cases above,
  // so we can safely assert that filterValue is not null for the remaining operations
  const nonNullFilterValue = filterValue as Exclude<typeof filterValue, null>;

  switch (op) {
    case 'eq':
      return value === nonNullFilterValue;
    case 'neq':
      return value !== nonNullFilterValue;
    case 'gt':
      return value > nonNullFilterValue;
    case 'gte':
      return value >= nonNullFilterValue;
    case 'lt':
      return value < nonNullFilterValue;
    case 'lte':
      return value <= nonNullFilterValue;
    case 'contains':
      if (typeof value === 'string' && typeof nonNullFilterValue === 'string') {
        return value.toLowerCase().includes(nonNullFilterValue.toLowerCase());
      }
      return false; // Contains only applicable to strings
    case 'range':
      if (
        Array.isArray(nonNullFilterValue) &&
        nonNullFilterValue.length === 2
      ) {
        const [start, end] = nonNullFilterValue;
        // Assuming string comparison works for dates (YYYY-MM-DD or YYYY-MM)
        return value >= start && value <= end;
      }
      return false; // Range requires a two-element array
    default:
      return false;
  }
}

// -------------------------------------------------------------------

/**
 * Filters an array of transactions based on multiple criteria.
 *
 * @param transactions The array of Transaction objects to filter.
 * @param filters An object containing the filter criteria.
 * @returns A new array containing only the transactions that match all specified filters.
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const filterKeys = Object.keys(filters) as (keyof TransactionFilters)[];

  // Return early if no filters are provided
  if (filterKeys.length === 0) {
    return transactions;
  }

  return transactions.filter((transaction) => {
    // Check if the transaction matches ALL specified filters
    return filterKeys.every((key) => {
      const filterValue = filters[key];
      if (filterValue === undefined) {
        // Skip if filter for this key is not set
        return true;
      }

      return matchesFilter(
        transaction[key as keyof Transaction],
        filterValue as FilterValue<any>
      );
    });
  });
}
