/**
 * useGetAccounts: merge of plaid and assets queries
 */

export interface NormalizedAccount {
    id: number;
    display_name: string;
    name: string;
    balance: string;
    currency: string;
    institution_name: string;
    account_type: string;
    account_subtype: string;
    balance_updated_at: string;
    mask: string;
    isIncome: boolean;
    status: string;
    isClosed: boolean;
    lastUpdate: string;
    limit: number | null; // Can be null when no limit exists
}

export interface AccountsQueryResult {
    data: NormalizedAccount[];
    isLoading: boolean;
    error: Error | null;
    isError: boolean;
}

/**
 * useGetRecurringItems: recurring items query
 */

export interface ForecastItem {
    occurrenceDate: string;
    title: string;
    amount: number;
    id: string; // Ensure ID is string here if needed
    isIncome: boolean;
    cadence: string;
    accountId: number | null;
    cleared: boolean; // This will be set per occurrence
    excludeFromTotals: boolean;
    categoryId: number | null;
    categoryGroupId: number | null;
}

export type YearMonth = string & { format: 'YYYY-MM' };
export type YearMonthDay = string & { format: 'YYYY-MM-DD' };
