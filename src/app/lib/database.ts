import { supabase } from './supabase';

/**
 * Database table: user_api_keys
 * Schema:
 * - id: UUID (primary key)
 * - user_id: UUID (references auth.users, unique)
 * - lunch_money_api_key: TEXT (unique, not null)
 * - created_at: TIMESTAMPTZ
 * - updated_at: TIMESTAMPTZ
 */

export interface UserApiKey {
  id: string;
  user_id: string;
  lunch_money_api_key: string;
  created_at: string;
  updated_at: string;
}

/**
 * Saves the Lunch Money API key to the database for the current authenticated user.
 * Uses upsert to handle both insert and update cases.
 *
 * @param apiKey - The Lunch Money API key to save
 * @throws Error if user is not authenticated or database operation fails
 */
export async function saveLunchMoneyApiKey(apiKey: string): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User must be authenticated to save API key');
  }

  const { error } = await supabase.from('user_api_keys').upsert(
    {
      user_id: user.id,
      lunch_money_api_key: apiKey,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    }
  );

  if (error) {
    console.error('Error saving API key to database:', error);
    throw new Error(`Failed to save API key: ${error.message}`);
  }
}

/**
 * Retrieves the Lunch Money API key for the current authenticated user.
 *
 * @returns The API key if found, null if not found
 * @throws Error if user is not authenticated or database operation fails
 */
export async function getLunchMoneyApiKey(): Promise<string | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User must be authenticated to retrieve API key');
  }

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('lunch_money_api_key')
    .eq('user_id', user.id)
    .single();

  if (error) {
    // If no record found, return null (not an error)
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching API key from database:', error);
    throw new Error(`Failed to fetch API key: ${error.message}`);
  }

  return data?.lunch_money_api_key || null;
}

/**
 * Deletes the Lunch Money API key for the current authenticated user.
 * Used during sign-out or when user wants to remove their stored key.
 *
 * @throws Error if user is not authenticated or database operation fails
 */
export async function deleteLunchMoneyApiKey(): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User must be authenticated to delete API key');
  }

  const { error } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting API key from database:', error);
    throw new Error(`Failed to delete API key: ${error.message}`);
  }
}
