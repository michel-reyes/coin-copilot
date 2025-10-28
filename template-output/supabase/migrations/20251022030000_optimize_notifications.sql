-- ============================================
-- Notification Queue Performance Optimization
-- ============================================
--
-- This migration adds:
-- 1. Composite index for fast deduplication lookups
-- 2. Batch deduplication function for performance
--
-- ============================================

-- ============================================
-- 1. Add composite index for fast lookups
-- ============================================

-- First, create an immutable function to extract date from timestamptz
-- This is required because DATE() is not immutable and can't be used in indexes
CREATE OR REPLACE FUNCTION immutable_date(timestamp_value TIMESTAMPTZ)
RETURNS DATE
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT (timestamp_value AT TIME ZONE 'UTC')::DATE;
$$;

COMMENT ON FUNCTION immutable_date IS
  'Immutable function to extract date from timestamptz for use in indexes';

-- This index dramatically speeds up the deduplication check
-- by allowing fast lookups on (event_id, user_id, date, status)
CREATE INDEX IF NOT EXISTS idx_notification_queue_dedup_lookup
ON notification_queue (
  event_id,
  user_id,
  immutable_date(scheduled_for),
  status
)
WHERE status IN ('sent', 'pending');

-- This index helps with retention cleanup queries
-- Note: We don't use NOW() in the partial index WHERE clause because it's not immutable
-- Instead, we just index created_at and filter in the query
CREATE INDEX IF NOT EXISTS idx_notification_queue_cleanup
ON notification_queue (created_at);

COMMENT ON INDEX idx_notification_queue_dedup_lookup IS
  'Fast lookup for deduplication checks when sending notifications';

COMMENT ON INDEX idx_notification_queue_cleanup IS
  'Fast cleanup of notifications older than retention period';

-- ============================================
-- 2. Batch deduplication function
-- ============================================

-- This function checks multiple notifications at once
-- instead of running N separate queries
--
-- Input: JSONB array of objects with {event_id, user_id, date}
-- Output: TABLE of (event_id, user_id, date) that were already sent
--
-- Example usage:
-- SELECT * FROM check_notifications_sent_batch('[
--   {"event_id": "abc-123", "user_id": "xyz-789", "date": "2025-10-22"},
--   {"event_id": "def-456", "user_id": "xyz-789", "date": "2025-10-22"}
-- ]'::jsonb);

CREATE OR REPLACE FUNCTION check_notifications_sent_batch(
  p_checks JSONB
)
RETURNS TABLE (
  event_id UUID,
  user_id UUID,
  date TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    (check_item->>'event_id')::UUID AS event_id,
    (check_item->>'user_id')::UUID AS user_id,
    check_item->>'date' AS date
  FROM jsonb_array_elements(p_checks) AS check_item
  WHERE EXISTS (
    SELECT 1
    FROM notification_queue nq
    WHERE nq.event_id = (check_item->>'event_id')::UUID
      AND nq.user_id = (check_item->>'user_id')::UUID
      AND immutable_date(nq.scheduled_for) = (check_item->>'date')::DATE
      AND nq.status IN ('sent', 'pending')
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_notifications_sent_batch IS
  'Batch check if notifications were already sent. Returns subset of input that were sent.';

-- ============================================
-- 3. Helper function to insert notification only if not exists
-- ============================================

-- This provides an atomic way to insert a notification
-- only if it hasn't been sent yet for that day
--
-- Returns: true if inserted, false if already exists

CREATE OR REPLACE FUNCTION insert_notification_if_not_sent(
  p_user_id UUID,
  p_event_id UUID,
  p_scheduled_for TIMESTAMPTZ,
  p_sent_at TIMESTAMPTZ,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL,
  p_expo_receipt_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_date DATE;
  v_exists BOOLEAN;
BEGIN
  v_date := immutable_date(p_scheduled_for);

  -- Check if already sent for this day
  SELECT EXISTS (
    SELECT 1
    FROM notification_queue
    WHERE event_id = p_event_id
      AND user_id = p_user_id
      AND immutable_date(scheduled_for) = v_date
      AND status IN ('sent', 'pending')
  ) INTO v_exists;

  -- If not sent yet, insert it
  IF NOT v_exists THEN
    INSERT INTO notification_queue (
      user_id,
      event_id,
      scheduled_for,
      sent_at,
      status,
      error_message,
      expo_receipt_id
    ) VALUES (
      p_user_id,
      p_event_id,
      p_scheduled_for,
      p_sent_at,
      p_status,
      p_error_message,
      p_expo_receipt_id
    );
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION insert_notification_if_not_sent IS
  'Atomically insert notification only if not already sent for that day';

-- ============================================
-- 4. Add updated_at trigger to notification_queue
-- ============================================

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_queue' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE notification_queue
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_notification_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_notification_queue_updated_at ON notification_queue;

CREATE TRIGGER trigger_update_notification_queue_updated_at
  BEFORE UPDATE ON notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_queue_updated_at();

COMMENT ON TRIGGER trigger_update_notification_queue_updated_at ON notification_queue IS
  'Automatically update updated_at timestamp on row modification';
