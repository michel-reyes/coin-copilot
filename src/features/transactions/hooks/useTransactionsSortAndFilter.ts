import { Transaction } from '@/api/types/apiTypes';
import React, { useEffect, useMemo, useState } from 'react';

// ----------------------------------------------------------------

export type TransactionFilterType = 'all' | 'income' | 'expense' | 'category';

export interface TransactionFilterProps {
    filter: TransactionFilterType;
    setFilter: (filter: TransactionFilterType) => void;
}

// Define filter operators
export type FilterOperator =
    | 'eq'
    | 'neq'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'contains'
    | 'range';

// Define type for filter values, allowing direct value or object with operator
export type FilterValue<T> =
    | T
    | {
          op: FilterOperator;
          value: NonNullable<T> | [NonNullable<T>, NonNullable<T>] | null;
      };

export interface TransactionFilters {
    id?: FilterValue<number>;
    date?: FilterValue<string>; // Supports 'eq', 'range' (YYYY-MM-DD or YYYY-MM)
    payee?: FilterValue<string>; // Supports 'eq', 'contains'
    status?: FilterValue<string>; // Supports 'eq', 'neq'
    to_base?: FilterValue<number>; // Supports 'eq', 'gt', 'gte', 'lt', 'lte'
    category_id?: FilterValue<number>; // Supports 'eq', 'neq'
    category_name?: FilterValue<string>; // Supports 'eq', 'contains'
    is_income?: FilterValue<boolean>; // Supports 'eq', 'neq'
    is_pending?: FilterValue<boolean>; // Supports 'eq', 'neq'
    recurring_id?: FilterValue<number>; // Supports 'eq', 'neq'
    is_group?: FilterValue<boolean>; // Supports 'eq', 'neq'
    exclude_from_budget?: FilterValue<boolean>; // Supports 'eq', 'neq'
    exclude_from_totals?: FilterValue<boolean>; // Supports 'eq', 'neq'
    recurring_type?: FilterValue<string>; // Supports 'eq', 'neq'
}

export type TransactionFilterOption =
    | 'all'
    | 'income'
    | 'expenses'
    | 'recurring'
    | 'purchases'
    | 'transfers';
export type TransactionSortOption = 'date' | 'category' | 'merchant' | 'amount';
export type SortDirection = 'asc' | 'desc';

export interface TransactionFilterState {
    activeFilter: TransactionFilterOption;
    activeSortOption: TransactionSortOption;
    sortDirection: SortDirection;
}

export interface UseTransactionFiltersOptions {
    initialFilter?: TransactionFilterOption;
    initialSortOption?: TransactionSortOption;
    initialSortDirection?: SortDirection;
    pageSize?: number; // Number of items per page for pagination
    enableIndexing?: boolean; // Enable performance optimizations with indexing
}

export interface TransactionsSortFilterProps {
    listTitle: React.ReactNode;
    activeFilter: TransactionFilterOption;
    setFilter: (filter: TransactionFilterOption) => void;
    activeSortOption: TransactionSortOption;
    setSortOption: (sortOption: TransactionSortOption) => void;
    sortDirection: SortDirection;
    setSortDirection: (direction: SortDirection) => void;
    toggleSortDirection: () => void;
}

// ----------------------------------------------------------------

/**
 * Custom hook for filtering and sorting transactions.
 * Uses optimized indexing and pagination for better performance with large datasets.
 */
function useTransactionsSortAndFilter(
    transactions: Transaction[] = [],
    options: UseTransactionFiltersOptions = {}
) {
    // Performance measurement for development
    const startTime = performance.now();

    // Feature flags for enabling optimizations
    const useIndexing = options.enableIndexing !== false; // Default to true
    const pageSize = options.pageSize || 50; // Default page size

    // Set initial states with defaults or provided values
    const [filterState, setFilterState] = useState<TransactionFilterState>({
        activeFilter: options.initialFilter || 'all',
        activeSortOption: options.initialSortOption || 'date',
        sortDirection: options.initialSortDirection || 'desc',
    });

    // We'll use displayCount instead of page for better infinite scrolling support

    const { activeFilter, activeSortOption, sortDirection } = filterState;

    // Set filter function
    function setFilter(filter: TransactionFilterOption) {
        setFilterState((prev) => ({
            ...prev,
            activeFilter: filter,
        }));
        setDisplayCount(pageSize); // Reset displayed items when filter changes
    }

    // Set sort option function
    function setSortOption(sortOption: TransactionSortOption) {
        setFilterState((prev) => ({
            ...prev,
            activeSortOption: sortOption,
        }));
    }

    // Toggle sort direction function
    function toggleSortDirection() {
        setFilterState((prev) => ({
            ...prev,
            sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc',
        }));
    }

    // Set sort direction explicitly
    function setSortDirection(direction: SortDirection) {
        setFilterState((prev) => ({
            ...prev,
            sortDirection: direction,
        }));
    }

    // Memoized index creation for efficient filtering
    const transactionIndexes = useMemo(() => {
        if (!transactions.length || !useIndexing) {
            return {
                income: [],
                expenses: [],
                recurring: [],
                purchases: [],
                transfers: [],
            };
        }

        // Precompute indexes for each filter type
        const indexes = {
            income: [] as number[],
            expenses: [] as number[],
            recurring: [] as number[],
            purchases: [] as number[],
            transfers: [] as number[],
        };

        // Single pass through data to build all indexes
        transactions.forEach((t, i) => {
            // Income transactions
            if (t.is_income) {
                indexes.income.push(i);
            }

            // Expense transactions
            if (t.is_income === false) {
                indexes.expenses.push(i);

                // Recurring expenses
                if (t.recurring_id !== null) {
                    indexes.recurring.push(i);
                }

                // Purchases (non-recurring expenses that aren't transfers)
                if (t.category_name !== 'Transfer' && t.recurring_id === null) {
                    indexes.purchases.push(i);
                }
            }

            // Transfers
            if (t.category_name === 'Transfer') {
                indexes.transfers.push(i);
            }
        });

        return indexes;
    }, [transactions, useIndexing]);

    // Filtered and sorted transactions using optimized approach
    const filteredAndSortedTransactions = useMemo(() => {
        if (!transactions.length) return [];

        // PHASE 1: FILTERING
        let result: Transaction[];

        if (useIndexing && activeFilter !== 'all') {
            // Use indexed approach for filtering
            const indexes = transactionIndexes[activeFilter] || [];
            result = indexes.map((idx) => transactions[idx]);
        } else {
            // Fallback to traditional filtering
            result = [...transactions];

            switch (activeFilter) {
                case 'income':
                    result = result.filter((t) => t.is_income);
                    break;
                case 'expenses':
                    result = result.filter((t) => t.is_income === false);
                    break;
                case 'recurring':
                    result = result.filter(
                        (t) => t.is_income === false && t.recurring_id !== null
                    );
                    break;
                case 'purchases':
                    result = result.filter(
                        (t) =>
                            t.is_income === false &&
                            t.category_name !== 'Transfer' &&
                            t.recurring_id === null
                    );
                    break;
                case 'transfers':
                    result = result.filter(
                        (t) => t.category_name === 'Transfer'
                    );
                    break;
                case 'all':
                default:
                    break;
            }
        }

        // PHASE 2: SORTING
        // Optimized sorting that handles each sort field appropriately
        result.sort((a, b) => {
            switch (activeSortOption) {
                case 'date':
                    // Date comparison is always handled separately
                    return sortDirection === 'asc'
                        ? a.date.localeCompare(b.date)
                        : b.date.localeCompare(a.date);

                case 'category':
                    const categoryA = a.category_name ?? '';
                    const categoryB = b.category_name ?? '';
                    const catComparison = categoryA.localeCompare(categoryB);
                    return sortDirection === 'asc'
                        ? catComparison
                        : -catComparison;

                case 'merchant':
                    const merchantComparison = a.payee.localeCompare(b.payee);
                    return sortDirection === 'asc'
                        ? merchantComparison
                        : -merchantComparison;

                case 'amount':
                    const amountComparison = a.to_base - b.to_base;
                    return sortDirection === 'asc'
                        ? amountComparison
                        : -amountComparison;

                default:
                    // Default to date sorting descending
                    return b.date.localeCompare(a.date);
            }
        });

        return result;
    }, [
        transactions,
        activeFilter,
        activeSortOption,
        sortDirection,
        transactionIndexes,
        useIndexing,
    ]);

    // State to track the number of items to display for infinite scrolling
    const [displayCount, setDisplayCount] = useState(pageSize);

    // Reset display count when filter or sort changes
    useEffect(() => {
        setDisplayCount(pageSize);
    }, [activeFilter, activeSortOption, sortDirection, pageSize]);

    // Visible transactions with infinite scrolling support
    const paginatedTransactions = useMemo(() => {
        return filteredAndSortedTransactions.slice(0, displayCount);
    }, [filteredAndSortedTransactions, displayCount]);

    // Calculate if there are more items to load
    const hasMoreItems = filteredAndSortedTransactions.length > displayCount;

    // Calculate total pages for reference
    const totalPages = useMemo(
        () =>
            Math.max(
                1,
                Math.ceil(filteredAndSortedTransactions.length / pageSize)
            ),
        [filteredAndSortedTransactions.length, pageSize]
    );

    // Current page based on display count
    const page = Math.ceil(displayCount / pageSize);

    // Load more items for infinite scrolling
    function goToNextPage() {
        if (hasMoreItems) {
            setDisplayCount((prev) => prev + pageSize);
        }
    }

    // This is not typically used with infinite scroll, but kept for API compatibility
    function goToPreviousPage() {
        if (displayCount > pageSize) {
            setDisplayCount((prev) => prev - pageSize);
        }
    }

    // Performance measurement
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            const endTime = performance.now();
            console.log(
                `Transaction processing took ${endTime - startTime}ms for ${transactions.length} items`
            );
            console.log(
                `Active filter: ${activeFilter}, Sort: ${activeSortOption} (${sortDirection})`
            );
            console.log(
                `Filtered count: ${filteredAndSortedTransactions.length}, Page: ${page}/${totalPages}`
            );
        }
    }, [
        filteredAndSortedTransactions,
        page,
        totalPages,
        activeFilter,
        activeSortOption,
        sortDirection,
        transactions.length,
        startTime,
    ]);

    return {
        // State
        activeFilter,
        activeSortOption,
        sortDirection,

        // State setters
        setFilter,
        setSortOption,
        toggleSortDirection,
        setSortDirection,

        // Original data (for backward compatibility)
        transactions: filteredAndSortedTransactions,

        // Infinite scrolling features
        paginatedTransactions,
        page,
        totalPages,
        goToNextPage,
        goToPreviousPage,
        hasMoreItems,
        displayCount,
        setDisplayCount,
        totalCount: filteredAndSortedTransactions.length,
    };
}

export default useTransactionsSortAndFilter;
