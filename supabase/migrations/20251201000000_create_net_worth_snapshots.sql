-- Create net_worth_snapshots table for daily account balance tracking
-- This table stores daily snapshots of user net worth calculated from Lunch Money accounts

-- Create the net_worth_snapshots table
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  net_worth DECIMAL(15, 2) NOT NULL,
  plaid_balance DECIMAL(15, 2) DEFAULT 0,
  assets_balance DECIMAL(15, 2) DEFAULT 0,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure only one snapshot per user per day
  UNIQUE(user_id, snapshot_date)
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_user_id ON net_worth_snapshots(user_id);

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_date ON net_worth_snapshots(snapshot_date DESC);

-- Create composite index for user + date queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_user_date ON net_worth_snapshots(user_id, snapshot_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can read own snapshots" ON net_worth_snapshots;
DROP POLICY IF EXISTS "Users can insert own snapshots" ON net_worth_snapshots;
DROP POLICY IF EXISTS "Users can update own snapshots" ON net_worth_snapshots;
DROP POLICY IF EXISTS "Users can delete own snapshots" ON net_worth_snapshots;

-- RLS Policy: Users can only read their own snapshots
CREATE POLICY "Users can read own snapshots" ON net_worth_snapshots
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own snapshots
CREATE POLICY "Users can insert own snapshots" ON net_worth_snapshots
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own snapshots
CREATE POLICY "Users can update own snapshots" ON net_worth_snapshots
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own snapshots
CREATE POLICY "Users can delete own snapshots" ON net_worth_snapshots
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to auto-update updated_at on row modification
DROP TRIGGER IF EXISTS update_net_worth_snapshots_updated_at ON net_worth_snapshots;
CREATE TRIGGER update_net_worth_snapshots_updated_at
  BEFORE UPDATE ON net_worth_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
