import {
    AssetsItem,
    PlaidItem,
    Category,
    CategoryItem,
    CategoryGroup,
    RecurringItem,
} from './types/apiTypes';
import { AccountsQueryResult, ForecastItem } from './types/queryTypes';
import { UseQueryResult } from '@tanstack/react-query';

// ----------------------------------------------

type QueryResult = [UseQueryResult<any, Error>, UseQueryResult<any, Error>];

// ----------------------------------------------

// Combine the results of plaid and assets into a single query result
// add due date from local storage (disk storage used with mmkv)
export function combineAccounts(results: QueryResult): AccountsQueryResult {
    // const getDueDate = useDueDateStore.getState().getDueDate;

    return {
        data: results.flatMap((result) => {
            if (!result.data) return [];

            if ('plaid_accounts' in result.data) {
                return result.data.plaid_accounts.map((account: PlaidItem) => ({
                    id: account.id,
                    display_name: account.display_name,
                    name: account.name,
                    balance: account.balance,
                    currency: account.currency,
                    institution_name: account.institution_name,
                    account_type: account.type,
                    account_subtype: account.subtype,
                    balance_updated_at: account.balance_last_update,
                    mask: account.mask,
                    limit: account.limit,
                    isIncome: Boolean(account.type === 'cash'),
                    status: account.status,
                    isClosed: false,
                    lastUpdate: account.balance_last_update,
                }));
            }

            if ('assets' in result.data) {
                return result.data.assets.map((asset: AssetsItem) => ({
                    id: asset.id,
                    display_name: asset.display_name,
                    name: asset.name,
                    balance: asset.balance,
                    currency: asset.currency,
                    institution_name: asset.institution_name,
                    account_type: asset.type_name,
                    account_subtype: asset.subtype_name,
                    balance_updated_at: asset.balance_as_of,
                    limit: null,
                    mask: '',
                    status: 'active',
                    isClosed: false,
                    lastUpdate: asset.balance_as_of,
                    isIncome: Boolean(asset.type_name === 'cash'),
                }));
            }

            return [];
        }),
        isLoading: results.some((result) => result.isPending),
        error: results.find((result) => result.error)?.error || null,
        isError: results.some((result) => result.isError),
    };
}

// ----------------------------------------------

/**
 * Flatten nested categories for better filtering and searching
 * from: [{...children: [{...}]}]
 * to [{...}, {...}]
 */
export function flattenCategories(categories: CategoryItem[]): Category[] {
    const flat: Category[] = [];
    const stack: CategoryItem[] = [...categories];

    while (stack.length) {
        const category = stack.pop()!;
        if (category.is_group) {
            const { children, ...flatCategory } = category as CategoryGroup; // Destructure to exclude children
            flat.push(flatCategory);

            if (children && children.length > 0) {
                stack.push(...children);
            }
        } else {
            flat.push(category);
        }
    }

    return flat;
}

// ----------------------------------------------

/**
 * Flattens recurring items into a single list of occurrences.
 * Each item in the list represents one instance of a recurring transaction
 * on a specific date.
 * from [{...occurrences: {date: [...]}}]
 * to [{occurrenceDate: date, ...itemDetails}]
 */
export function flattenAndGroupRecurring(recurringItems: RecurringItem[]): ForecastItem[] {
    const flattenedOccurrences: ForecastItem[] = [];

    // Helper to format the base item details once
    const formatBaseItem = (item: RecurringItem): Omit<ForecastItem, 'occurrenceDate'> => ({
        title: item.payee,
        amount: Math.abs(parseFloat(item.amount)),
        id: String(item.id), // Convert ID to string
        isIncome: item.is_income,
        cadence: item.cadence,
        accountId: item.plaid_account_id,
        cleared: false, //status depends on the specific occurrence date
        excludeFromTotals: item.exclude_from_totals,
        categoryId: item.category_id, // Retains null if original is null
        categoryGroupId: item.category_group_id, // Retains null if original is null
    });

    // Single pass through items
    recurringItems.forEach((item) => {
        const baseFormattedItem = formatBaseItem(item);

        Object.keys(item.occurrences).forEach((date) => {
            // Determine if this specific occurrence is considered 'cleared'
            // based on the original structure (if the date entry exists and has content) has not been cleared (paid) yet
            const isCleared = Boolean(item.occurrences[date]?.length > 0);

            flattenedOccurrences.push({
                ...baseFormattedItem,
                occurrenceDate: date,
                cleared: isCleared, // Set cleared status for this specific occurrence
            });
        });
    });

    // The list is already flat, no need for grouping or sorting by date here.
    // Sorting can be done by the caller if needed.
    return flattenedOccurrences.sort((a, b) => b.occurrenceDate.localeCompare(a.occurrenceDate));
}
