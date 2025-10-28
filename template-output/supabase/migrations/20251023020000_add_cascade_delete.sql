-- ============================================
-- Add CASCADE DELETE to Foreign Keys
-- ============================================
--
-- This ensures that when events are deleted, all related
-- notification schedules and queue entries are automatically deleted
--
-- ============================================

-- ============================================
-- 1. Update event_notification_schedules foreign key
-- ============================================

-- Drop existing foreign key constraint
ALTER TABLE event_notification_schedules
DROP CONSTRAINT IF EXISTS event_notification_schedules_event_id_fkey;

-- Add foreign key with CASCADE DELETE
ALTER TABLE event_notification_schedules
ADD CONSTRAINT event_notification_schedules_event_id_fkey
FOREIGN KEY (event_id)
REFERENCES events(id)
ON DELETE CASCADE;

COMMENT ON CONSTRAINT event_notification_schedules_event_id_fkey ON event_notification_schedules IS
  'Automatically delete notification schedules when parent event is deleted';

-- ============================================
-- 2. Update notification_queue foreign key for event_id
-- ============================================

-- Drop existing foreign key constraint
ALTER TABLE notification_queue
DROP CONSTRAINT IF EXISTS notification_queue_event_id_fkey;

-- Add foreign key with CASCADE DELETE
ALTER TABLE notification_queue
ADD CONSTRAINT notification_queue_event_id_fkey
FOREIGN KEY (event_id)
REFERENCES events(id)
ON DELETE CASCADE;

COMMENT ON CONSTRAINT notification_queue_event_id_fkey ON notification_queue IS
  'Automatically delete notification history when parent event is deleted';

-- ============================================
-- 3. Create helper function to delete orphaned schedules
-- ============================================

-- This function finds and deletes notification schedules
-- that reference non-existent events (orphaned records)
CREATE OR REPLACE FUNCTION delete_orphaned_schedules()
RETURNS TABLE (count BIGINT) AS $$
DECLARE
  deleted_count BIGINT;
BEGIN
  -- Delete schedules where event_id doesn't exist in events table
  DELETE FROM event_notification_schedules
  WHERE NOT EXISTS (
    SELECT 1 FROM events WHERE events.id = event_notification_schedules.event_id
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN QUERY SELECT deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION delete_orphaned_schedules IS
  'Delete notification schedules that reference non-existent events';

-- ============================================
-- 4. Create helper function to delete orphaned notifications
-- ============================================

-- This function finds and deletes notification queue entries
-- that reference non-existent events (orphaned records)
CREATE OR REPLACE FUNCTION delete_orphaned_notifications()
RETURNS TABLE (count BIGINT) AS $$
DECLARE
  deleted_count BIGINT;
BEGIN
  -- Delete notifications where event_id doesn't exist in events table
  DELETE FROM notification_queue
  WHERE NOT EXISTS (
    SELECT 1 FROM events WHERE events.id = notification_queue.event_id
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN QUERY SELECT deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION delete_orphaned_notifications IS
  'Delete notification queue entries that reference non-existent events';

-- ============================================
-- 5. Clean up existing orphaned records
-- ============================================

-- Run cleanup functions to remove any existing orphaned records
SELECT delete_orphaned_schedules();
SELECT delete_orphaned_notifications();
