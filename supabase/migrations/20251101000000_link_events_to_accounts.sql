-- Add account linking fields to events table
-- Allows linking events (like credit card due dates) to specific accounts

-- Add optional account_id and institution_name fields
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS account_id TEXT,
  ADD COLUMN IF NOT EXISTS institution_name TEXT;

-- Add index for faster lookups by account
-- Only index rows where both fields are set (partial index)
CREATE INDEX IF NOT EXISTS idx_events_account_link
  ON events(user_id, account_id, institution_name)
  WHERE account_id IS NOT NULL AND institution_name IS NOT NULL;

-- Add comment explaining the fields
COMMENT ON COLUMN events.account_id IS 'Optional link to Lunch Money account ID for account-specific events (e.g., credit card due dates)';
COMMENT ON COLUMN events.institution_name IS 'Optional institution name to uniquely identify account with account_id';
