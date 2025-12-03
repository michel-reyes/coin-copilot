-- Add back unique constraint to ensure 1 row per user per day
-- Multiple runs on same day will UPDATE, different days will INSERT

-- Add unique constraint back
ALTER TABLE net_worth_snapshots
ADD CONSTRAINT net_worth_snapshots_user_id_snapshot_date_key
UNIQUE (user_id, snapshot_date);
