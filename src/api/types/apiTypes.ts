// Only types that are used in the API calls should be defined here
// Any other variations based on these types sgould be defined in respective components

/**
 * Recurrent items API
 */

type Cadence =
    | 'once a week'
    | 'every 2 weeks'
    | 'twice a month'
    | 'monthly'
    | 'every 2 months'
    | 'every 3 months'
    | 'every 4 months'
    | 'twice a year'
    | 'yearly';

type Granularity = 'day' | 'month' | 'week' | 'year';

export interface Occurrence {
    id: number;
    date: string;
    amount: string;
    currency: string;
    payee: string;
    category_id: number;
    recurring_id: number;
    to_base: number;
}

interface Occurrences {
    [date: string]: Occurrence[];
}

// Main recurring item type
export interface RecurringItem {
    id: number;
    start_date: string | null;
    end_date: string | null;
    payee: string;
    currency: string;
    created_by: number;
    created_at: string;
    updated_at: string;
    billing_date: string;
    original_name: string;
    description: string | null;
    plaid_account_id: number | null;
    asset_id: number | null;
    source: string;
    amount: string;
    notes: string | null;
    category_id: number;
    category_group_id: number;
    is_income: boolean;
    exclude_from_totals: boolean;
    cadence: Cadence;
    granularity: Granularity;
    quantity: number;
    occurrences: Occurrences;
}

/**
 * Account items API
 * Plaid API
 * Assets API
 */

export interface AssetsItem {
    id: number;
    display_name: string;
    name: string;
    balance: string;
    currency: string;
    institution_name: string;
    type_name: string;
    subtype_name: string;
    balance_as_of: string;
    closed_on: string | null;
    exclude_transactions: boolean;
    created_at: string;
}

export interface PlaidItem {
    id: number;
    display_name: string;
    name: string;
    balance: string;
    currency: string;
    institution_name: string;
    type: string;
    subtype: string;
    balance_last_update: string;
    mask: string;
    status: string;
    limit: number;
    date_linked: string;
    import_start_date: string | null;
    last_import: string;
    last_fetch: string;
    plaid_last_successful_update: string;
}

/**
 * Categories API
 */
export interface Category {
    id: number;
    name: string;
    description: string | null;
    is_income: boolean;
    exclude_from_budget: boolean;
    exclude_from_totals: boolean;
    updated_at: string;
    created_at: string;
    is_group: boolean;
    group_id: number | null;
    archived: boolean;
    archived_on: string | null;
    order: number;
}

export interface CategoryGroup extends Category {
    children?: Category[];
}

export type CategoryItem = Category | CategoryGroup;

export interface Categories {
    categories: CategoryItem[];
}

/**
 * Budgets API
 */

export interface BudgetItem {
    category_name: string;
    category_id: number;
    category_group_name: string;
    group_id: number | null;
    is_group: boolean | null;
    is_income: boolean;
    exclude_from_budget: boolean;
    exclude_from_totals: boolean;
    order: number;
    archived: boolean;
    data: {
        [date: string]: {
            num_transactions?: number;
            spending_to_base?: number;
            budget_to_base?: number;
            budget_amount?: number;
            budget_currency?: string;
        };
    };
    config: any | null;
    id?: string; // Optional: Present in some API responses
    recurring?: {
        list: {
            payee: string;
            amount: string;
            currency: string;
            to_base: number;
        }[];
    };
}

/**
 * Transactions API
 */

export interface Transaction {
    id: number;
    date: string;
    payee: string;
    amount: string;
    currency: string;
    to_base: number;
    category_id?: number;
    category_name?: string;
    category_group_id?: number;
    category_group_name?: string;
    is_income: boolean;
    exclude_from_budget: boolean;
    exclude_from_totals: boolean;
    created_at: string;
    updated_at: string;
    status?: string;
    is_pending: boolean;
    notes?: string;
    original_name?: string;
    recurring_id?: number;
    recurring_payee?: string;
    recurring_description?: string;
    recurring_cadence?: string;
    recurring_granularity?: string;
    recurring_quantity?: string;
    recurring_type?: string;
    recurring_amount?: string;
    recurring_currency?: string;
    parent_id?: number;
    has_children: boolean;
    group_id?: number;
    is_group: boolean;
    asset_id?: number;
    asset_institution_name?: string;
    asset_name?: string;
    asset_display_name?: string;
    asset_status?: string;
    plaid_account_id?: number;
    plaid_account_name?: string;
    plaid_account_mask?: string;
    institution_name?: string;
    plaid_account_display_name?: string;
    plaid_metadata?: string;
    source: string;
    display_name: string;
    display_notes?: string;
    account_display_name: string;
    tags: Tag[];
    children?: Transaction[];
    external_id?: string;
}

export interface Transactions {
    transactions: Transaction[];
    has_more: boolean;
}

interface Tag {
    id: number;
    name: string;
}

export interface FormatedRecurringItem {
    id: string;
    payee: string;
    amount: string;
    isIncome: boolean;
    cadence: string;
    ocurrences: string[];
}

export interface AccountSettings {
    id: string;
    accountId: string;
    accountName: string;
    balanceLimit: number | null;
    dueDay: number | null;
    createdAt: string;
    updatedAt: string;
}
