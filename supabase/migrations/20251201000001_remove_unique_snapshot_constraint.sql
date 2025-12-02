-- Remove unique constraint to allow multiple snapshots per day
-- This enables tracking net worth multiple times per day instead of once

-- Drop the unique constraint
ALTER TABLE net_worth_snapshots
DROP CONSTRAINT IF EXISTS net_worth_snapshots_user_id_snapshot_date_key;

-- Drop the composite index that enforced uniqueness
DROP INDEX IF EXISTS idx_net_worth_snapshots_user_date;

-- Create new composite index without uniqueness for query performance
CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_user_date
ON net_worth_snapshots(user_id, created_at DESC);
