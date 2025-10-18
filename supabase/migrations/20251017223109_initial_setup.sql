-- Initial setup for Coin Copilot
-- Creates user_api_keys table to store Lunch Money API keys

-- Create the user_api_keys table
-- This table stores the Lunch Money API key for each authenticated user
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  lunch_money_api_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);

-- Create index for faster lookups by API key (for validation)
CREATE INDEX IF NOT EXISTS idx_user_api_keys_lunch_money_api_key ON user_api_keys(lunch_money_api_key);

-- Enable Row Level Security (RLS)
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can read own API key" ON user_api_keys;
DROP POLICY IF EXISTS "Users can insert own API key" ON user_api_keys;
DROP POLICY IF EXISTS "Users can update own API key" ON user_api_keys;
DROP POLICY IF EXISTS "Users can delete own API key" ON user_api_keys;

-- RLS Policy: Users can only read their own API key
CREATE POLICY "Users can read own API key" ON user_api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own API key
CREATE POLICY "Users can insert own API key" ON user_api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own API key
CREATE POLICY "Users can update own API key" ON user_api_keys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own API key
CREATE POLICY "Users can delete own API key" ON user_api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at on row modification
DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON user_api_keys;
CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
