-- Add unique constraint to ensure only one active reminder per account
-- This prevents duplicate reminders for the same account and makes updates deterministic

-- First, clean up any existing duplicates (if any)
-- Keep the most recent reminder for each account
WITH ranked_reminders AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, account_id
      ORDER BY created_at DESC
    ) as rn
  FROM reminders
  WHERE account_id IS NOT NULL
    AND is_active = true
)
UPDATE reminders
SET is_active = false
WHERE id IN (
  SELECT id FROM ranked_reminders WHERE rn > 1
);

-- Add a unique partial index to enforce one active reminder per account per user
-- Using a partial index instead of a unique constraint allows multiple inactive reminders
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_reminder_per_account
  ON reminders(user_id, account_id)
  WHERE is_active = true 
    AND account_id IS NOT NULL;

-- Add comment explaining the constraint
COMMENT ON INDEX unique_active_reminder_per_account IS 
  'Ensures only one active reminder exists per account per user. When a reminder is deactivated, a new one can be created.';

