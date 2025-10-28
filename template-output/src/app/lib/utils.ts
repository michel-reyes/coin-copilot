/**
 * Simple deterministic hash function for generating consistent identifiers
 * from API keys without storing the raw key as an identifier.
 *
 * Used to create hidden email addresses for Supabase Auth.
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generates a hidden email address from an API key for Supabase Auth.
 * The user never sees or interacts with this email - it's purely for auth purposes.
 *
 * @param apiKey - The Lunch Money API key
 * @returns A deterministic email address (e.g., "lm_abc123@coincopilot.app")
 */
export function generateHiddenEmail(apiKey: string): string {
  const hash = simpleHash(apiKey);
  return `lm_${hash}@coincopilot.app`;
}
