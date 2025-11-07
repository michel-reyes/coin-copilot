-- Add timezone support for notification scheduling
-- This migration adds timezone tracking to properly handle notification times across different timezones

-- Add timezone column to user_api_keys table
-- Default to 'America/New_York' for existing users (can be updated via user settings)
ALTER TABLE user_api_keys
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/New_York';

-- Add comment for documentation
COMMENT ON COLUMN user_api_keys.timezone IS 'IANA timezone identifier (e.g., America/New_York, Europe/London). Used to interpret notification times in user''s local timezone.';

-- Create index for timezone lookups (useful for analytics/debugging)
CREATE INDEX IF NOT EXISTS idx_user_api_keys_timezone ON user_api_keys(timezone);
