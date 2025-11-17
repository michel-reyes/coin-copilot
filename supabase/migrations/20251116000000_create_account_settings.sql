-- Create account_settings table to store per-account settings
-- This table stores settings like balance limits and due days for credit cards

CREATE TABLE IF NOT EXISTS public.account_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    balance_limit NUMERIC,
    due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index to ensure one settings record per account per user
-- This allows upsert operations using ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_account
    ON public.account_settings(user_id, account_id, institution_name);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_account_settings_user_id 
    ON public.account_settings(user_id);

-- Enable Row Level Security
ALTER TABLE public.account_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own account settings
CREATE POLICY "Users can view own account settings"
    ON public.account_settings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own account settings"
    ON public.account_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own account settings"
    ON public.account_settings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own account settings"
    ON public.account_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_account_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at timestamp
CREATE TRIGGER update_account_settings_timestamp
    BEFORE UPDATE ON public.account_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_account_settings_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.account_settings IS 'Stores per-account settings like balance limits and payment due days';
COMMENT ON COLUMN public.account_settings.account_id IS 'Lunch Money account ID';
COMMENT ON COLUMN public.account_settings.institution_name IS 'Institution name (e.g., "Chase", "Amex")';
COMMENT ON COLUMN public.account_settings.balance_limit IS 'Credit limit or balance threshold for alerts';
COMMENT ON COLUMN public.account_settings.due_day IS 'Day of month when payment is due (1-31)';

