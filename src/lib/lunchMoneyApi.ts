/**
 * Lunch Money API integration
 * Documentation: https://lunchmoney.dev/
 */

/**
 * Validates a Lunch Money API key by making a test request to their API.
 *
 * TODO: Implement actual validation by calling Lunch Money API
 * Endpoint to use: GET https://dev.lunchmoney.app/v1/me
 * Headers: { Authorization: `Bearer ${apiKey}` }
 * Success: Returns 200 with user data
 * Failure: Returns 401 or other error
 *
 * @param apiKey - The Lunch Money API key to validate
 * @returns Promise<boolean> - true if valid, false if invalid
 */
export async function validateLunchMoneyApiKey(apiKey: string): Promise<boolean> {
  // Mock implementation - always returns true for now
  // TODO: Replace with actual API call when ready to implement validation

  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // For now, accept any non-empty string
  return true;
}

/**
 * Future: Add more Lunch Money API integration functions here
 * - fetchTransactions()
 * - fetchCategories()
 * - fetchBudgets()
 * etc.
 */
