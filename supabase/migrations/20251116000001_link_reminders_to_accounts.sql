-- Add account linking field to reminders table
-- Allows linking reminders (like credit card due dates) to specific accounts

-- Add optional account_id field
ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS account_id TEXT;

-- Add index for faster lookups by account
-- Only index rows where account_id is set (partial index)
CREATE INDEX IF NOT EXISTS idx_reminders_account_link
  ON reminders(user_id, account_id)
  WHERE account_id IS NOT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN reminders.account_id IS 'Optional link to Lunch Money account ID for account-specific reminders (e.g., credit card due dates)';
