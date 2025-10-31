import { supabase } from './supabase';

/**
 * Database table: account_settings
 * Schema:
 * - id: UUID (primary key)
 * - user_id: UUID (references auth.users)
 * - account_id: TEXT (Lunch Money account ID)
 * - institution_name: TEXT
 * - balance_limit: NUMERIC (nullable)
 * - due_day: INTEGER (nullable)
 * - created_at: TIMESTAMPTZ
 * - updated_at: TIMESTAMPTZ
 */

export interface AccountSettingsRecord {
    id: string;
    user_id: string;
    account_id: string;
    institution_name: string;
    balance_limit: number | null;
    due_day: number | null;
    created_at: string;
    updated_at: string;
}

/**
 * Fetches account settings for a specific account and institution.
 * RLS automatically filters by authenticated user.
 *
 * @param accountId - The Lunch Money account ID
 * @param institutionName - The institution name
 * @returns The account settings if found, null if not found
 * @throws Error if user is not authenticated or database operation fails
 */
export async function fetchAccountSettings(
    accountId: string,
    institutionName: string
): Promise<AccountSettingsRecord | null> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User must be authenticated to fetch account settings');
    }

    const { data, error } = await supabase
        .from('account_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('account_id', accountId)
        .eq('institution_name', institutionName)
        .single();

    if (error) {
        // If no record found, return null (not an error)
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching account settings:', error);
        throw new Error(`Failed to fetch account settings: ${error.message}`);
    }

    return data;
}

/**
 * Upserts (creates or updates) account settings for a specific account.
 * RLS automatically ensures the user can only modify their own settings.
 *
 * @param accountId - The Lunch Money account ID
 * @param institutionName - The institution name
 * @param balanceLimit - Optional balance limit (for editable accounts)
 * @param dueDay - Optional due day (1-31)
 * @returns The upserted account settings record
 * @throws Error if user is not authenticated or database operation fails
 */
export async function upsertAccountSettings(
    accountId: string,
    institutionName: string,
    balanceLimit?: number | null,
    dueDay?: number | null
): Promise<AccountSettingsRecord> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error(
            'User must be authenticated to upsert account settings'
        );
    }

    // Build the update object with only provided values
    const updateData: any = {
        user_id: user.id,
        account_id: accountId,
        institution_name: institutionName,
        updated_at: new Date().toISOString(),
    };

    if (balanceLimit !== undefined) {
        updateData.balance_limit = balanceLimit;
    }

    if (dueDay !== undefined) {
        updateData.due_day = dueDay;
    }

    const { data, error } = await supabase
        .from('account_settings')
        .upsert(updateData, {
            onConflict: 'user_id,account_id,institution_name',
        })
        .select()
        .single();

    if (error) {
        console.error('Error upserting account settings:', error);
        throw new Error(`Failed to upsert account settings: ${error.message}`);
    }

    return data;
}
