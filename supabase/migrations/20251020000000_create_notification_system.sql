-- Notification System Migration
-- Adds support for recurring event reminders with customizable notification schedules

-- ============================================================================
-- 1. EXTEND EXISTING user_api_keys TABLE
-- ============================================================================

-- Add push notification columns to existing user_api_keys table
ALTER TABLE user_api_keys
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT,
  ADD COLUMN IF NOT EXISTS expo_push_token_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS device_info JSONB;

-- Add index for push token lookups
CREATE INDEX IF NOT EXISTS idx_user_api_keys_expo_push_token
  ON user_api_keys(expo_push_token)
  WHERE expo_push_token IS NOT NULL;

-- ============================================================================
-- 2. CREATE EVENTS TABLE
-- ============================================================================

-- Create enum for event types
DO $$ BEGIN
  CREATE TYPE event_type AS ENUM ('bill', 'credit_card', 'budget_review');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create enum for recurrence types
DO $$ BEGIN
  CREATE TYPE recurrence_type AS ENUM ('monthly', 'weekly', 'custom', 'one_time');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Main events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type event_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  recurrence_type recurrence_type NOT NULL DEFAULT 'one_time',
  recurrence_interval INTEGER, -- For custom recurrence (e.g., every 14 days)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_due_date ON events(due_date);
CREATE INDEX IF NOT EXISTS idx_events_user_active ON events(user_id, is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
DROP POLICY IF EXISTS "Users can read own events" ON events;
CREATE POLICY "Users can read own events" ON events
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own events" ON events;
CREATE POLICY "Users can insert own events" ON events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own events" ON events;
CREATE POLICY "Users can update own events" ON events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own events" ON events;
CREATE POLICY "Users can delete own events" ON events
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. CREATE EVENT NOTIFICATION SCHEDULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_notification_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  notification_time TIME NOT NULL DEFAULT '09:00:00',
  days_before INTEGER NOT NULL DEFAULT 0, -- 0 = on the day, 1 = 1 day before, etc.
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_event_notification_schedules_event_id
  ON event_notification_schedules(event_id);
CREATE INDEX IF NOT EXISTS idx_event_notification_schedules_active
  ON event_notification_schedules(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE event_notification_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification schedules (based on event ownership)
DROP POLICY IF EXISTS "Users can read own event schedules" ON event_notification_schedules;
CREATE POLICY "Users can read own event schedules" ON event_notification_schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_notification_schedules.event_id
      AND events.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own event schedules" ON event_notification_schedules;
CREATE POLICY "Users can insert own event schedules" ON event_notification_schedules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_notification_schedules.event_id
      AND events.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own event schedules" ON event_notification_schedules;
CREATE POLICY "Users can update own event schedules" ON event_notification_schedules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_notification_schedules.event_id
      AND events.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own event schedules" ON event_notification_schedules;
CREATE POLICY "Users can delete own event schedules" ON event_notification_schedules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_notification_schedules.event_id
      AND events.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. CREATE NOTIFICATION QUEUE TABLE
-- ============================================================================

-- Create enum for notification status
DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status notification_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  expo_receipt_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_event_id ON notification_queue(event_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);

-- Composite index for deduplication checks
-- Note: Deduplication is handled in application logic (edge function)
-- We use a regular index instead of unique to avoid immutability issues with DATE()
CREATE INDEX IF NOT EXISTS idx_notification_queue_dedup
  ON notification_queue(user_id, event_id, scheduled_for)
  WHERE status IN ('pending', 'sent');

-- Enable RLS
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification queue
DROP POLICY IF EXISTS "Users can read own notification queue" ON notification_queue;
CREATE POLICY "Users can read own notification queue" ON notification_queue
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert/update (for edge functions)
DROP POLICY IF EXISTS "Service role can manage notification queue" ON notification_queue;
CREATE POLICY "Service role can manage notification queue" ON notification_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if an event should notify on a given date
CREATE OR REPLACE FUNCTION should_event_notify_on_date(
  p_event_id UUID,
  p_check_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
  v_event events%ROWTYPE;
  v_days_since_due INTEGER;
BEGIN
  SELECT * INTO v_event FROM events WHERE id = p_event_id;

  IF NOT FOUND OR NOT v_event.is_active THEN
    RETURN FALSE;
  END IF;

  CASE v_event.recurrence_type
    -- One-time event: only notify on exact due date
    WHEN 'one_time' THEN
      RETURN p_check_date = v_event.due_date;

    -- Monthly: notify on same day of month
    WHEN 'monthly' THEN
      RETURN EXTRACT(DAY FROM p_check_date) = EXTRACT(DAY FROM v_event.due_date)
         AND p_check_date >= v_event.due_date;

    -- Weekly: notify on same day of week
    WHEN 'weekly' THEN
      RETURN EXTRACT(DOW FROM p_check_date) = EXTRACT(DOW FROM v_event.due_date)
         AND p_check_date >= v_event.due_date;

    -- Custom: notify every N days
    WHEN 'custom' THEN
      v_days_since_due := p_check_date - v_event.due_date;
      RETURN v_days_since_due >= 0
         AND v_event.recurrence_interval IS NOT NULL
         AND v_days_since_due % v_event.recurrence_interval = 0;

    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment to migration
COMMENT ON TABLE events IS 'Stores recurring events (bills, credit cards, budget reviews) with customizable notification schedules';
COMMENT ON TABLE event_notification_schedules IS 'Stores multiple notification times per event (e.g., 3 days before, on the day)';
COMMENT ON TABLE notification_queue IS 'Tracks notification delivery status and prevents duplicate sends';
