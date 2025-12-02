// Supabase Edge Function: Daily Net Worth Sync
// Runs daily at 8:00 AM UTC to fetch account balances and calculate net worth for all users

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const LUNCH_MONEY_BASE_URL = 'https://dev.lunchmoney.app/v1';

interface PlaidAccount {
  id: number;
  name: string;
  balance: string;
  type?: string;
  subtype?: string;
}

interface Asset {
  id: number;
  name: string;
  balance: string;
  type_name?: string;
}

interface LunchMoneyResponse {
  plaid_accounts?: PlaidAccount[];
  assets?: Asset[];
}

interface SyncResult {
  userId: string;
  success: boolean;
  netWorth?: number;
  error?: string;
}

/**
 * Calculate net worth from accounts
 * Matches logic from src/features/accounts/hooks/useAccounts.ts:20
 */
function calculateNetWorth(
  plaidAccounts: PlaidAccount[],
  assets: Asset[]
): { netWorth: number; plaidBalance: number; assetsBalance: number } {
  let plaidBalance = 0;
  let assetsBalance = 0;

  // Process Plaid accounts
  plaidAccounts.forEach((account) => {
    const balance = Number(account.balance);
    // Income accounts (like credit cards with positive balances) are subtracted
    const isIncome =
      account.subtype === 'credit card' || account.type === 'credit';
    if (isIncome) {
      plaidBalance -= balance;
    } else {
      plaidBalance += balance;
    }
  });

  // Process Assets
  assets.forEach((asset) => {
    const balance = Number(asset.balance);
    assetsBalance += balance;
  });

  // Calculate net worth (inverted for proper accounting)
  const netWorth = (plaidBalance + assetsBalance) * -1;

  return {
    netWorth,
    plaidBalance: plaidBalance * -1,
    assetsBalance: assetsBalance * -1,
  };
}

/**
 * Fetch accounts from Lunch Money API
 */
async function fetchLunchMoneyAccounts(
  apiKey: string
): Promise<{ plaidAccounts: PlaidAccount[]; assets: Asset[] }> {
  const headers = { Authorization: `Bearer ${apiKey}` };

  // Fetch Plaid accounts
  const plaidResponse = await fetch(
    `${LUNCH_MONEY_BASE_URL}/plaid_accounts`,
    { headers }
  );
  if (!plaidResponse.ok) {
    throw new Error(
      `Plaid API error: ${plaidResponse.status} ${plaidResponse.statusText}`
    );
  }
  const plaidData: LunchMoneyResponse = await plaidResponse.json();

  // Fetch Assets
  const assetsResponse = await fetch(`${LUNCH_MONEY_BASE_URL}/assets`, {
    headers,
  });
  if (!assetsResponse.ok) {
    throw new Error(
      `Assets API error: ${assetsResponse.status} ${assetsResponse.statusText}`
    );
  }
  const assetsData: LunchMoneyResponse = await assetsResponse.json();

  return {
    plaidAccounts: plaidData.plaid_accounts || [],
    assets: assetsData.assets || [],
  };
}

Deno.serve(async (req) => {
  try {
    // Create Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fallbackApiKey = Deno.env.get('LUNCH_MONEY_API_KEY'); // Optional fallback API key

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Fetch all users with API keys
    const { data: users, error: usersError } = await supabase
      .from('user_api_keys')
      .select('user_id, lunch_money_api_key');

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No users to process',
          results: [],
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${users.length} users...`);
    if (fallbackApiKey) {
      console.log('Using fallback API key for all users');
    }

    // Process each user
    const results: SyncResult[] = [];

    // Get current date in America/New_York timezone
    const nyDate = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [month, day, year] = nyDate.split('/');
    const today = `${year}-${month}-${day}`; // YYYY-MM-DD in NY timezone

    for (const user of users) {
      try {
        // Use fallback API key if available, otherwise use user's individual key
        const apiKeyToUse = fallbackApiKey || user.lunch_money_api_key;

        // Fetch account data from Lunch Money
        const { plaidAccounts, assets } = await fetchLunchMoneyAccounts(
          apiKeyToUse
        );

        // Calculate net worth
        const { netWorth, plaidBalance, assetsBalance } = calculateNetWorth(
          plaidAccounts,
          assets
        );

        // Insert new snapshot (allows multiple per day)
        const { error: insertError } = await supabase
          .from('net_worth_snapshots')
          .insert({
            user_id: user.user_id,
            net_worth: netWorth,
            plaid_balance: plaidBalance,
            assets_balance: assetsBalance,
            snapshot_date: today,
          });

        if (insertError) {
          throw new Error(`DB insert failed: ${insertError.message}`);
        }

        results.push({
          userId: user.user_id,
          success: true,
          netWorth,
        });

        console.log(
          `✓ User ${user.user_id}: Net Worth = ${netWorth.toFixed(2)}`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        results.push({
          userId: user.user_id,
          success: false,
          error: errorMessage,
        });
        console.error(`✗ User ${user.user_id}: ${errorMessage}`);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${users.length} users: ${successCount} succeeded, ${failureCount} failed`,
        summary: {
          total: users.length,
          succeeded: successCount,
          failed: failureCount,
        },
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Edge function error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
