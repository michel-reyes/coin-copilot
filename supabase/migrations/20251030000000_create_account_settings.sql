-- Create account_settings table for storing user-specific account configurations
CREATE TABLE IF NOT EXISTS account_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    balance_limit NUMERIC,
    due_day INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_account UNIQUE (user_id, account_id, institution_name)
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_account_settings_user_id ON account_settings(user_id);

-- Enable Row Level Security
ALTER TABLE account_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for account_settings
-- Users can only see their own account settings
CREATE POLICY "Users can view own account settings"
    ON account_settings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own account settings
CREATE POLICY "Users can insert own account settings"
    ON account_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own account settings
CREATE POLICY "Users can update own account settings"
    ON account_settings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own account settings
CREATE POLICY "Users can delete own account settings"
    ON account_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_account_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_account_settings_timestamp
    BEFORE UPDATE ON account_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_account_settings_updated_at();
