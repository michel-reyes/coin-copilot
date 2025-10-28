-- ============================================
-- Clean Up Orphaned Notification Schedules
-- ============================================
-- Run this to see and clean up orphaned schedules
-- ============================================

-- Step 1: Check how many orphaned schedules exist
SELECT '=== ORPHANED SCHEDULES (schedules with no parent event) ===' as section;

SELECT COUNT(*) as orphaned_count
FROM event_notification_schedules s
WHERE NOT EXISTS (
  SELECT 1 FROM events e WHERE e.id = s.event_id
);

-- Step 2: See the details of orphaned schedules
SELECT
  s.id,
  s.event_id,
  s.notification_time,
  s.days_before,
  s.created_at,
  'ORPHANED - event deleted' as status
FROM event_notification_schedules s
WHERE NOT EXISTS (
  SELECT 1 FROM events e WHERE e.id = s.event_id
)
ORDER BY s.created_at DESC
LIMIT 20;

-- Step 3: Delete orphaned schedules (manual cleanup)
-- Uncomment to run:
-- DELETE FROM event_notification_schedules
-- WHERE NOT EXISTS (
--   SELECT 1 FROM events WHERE events.id = event_notification_schedules.event_id
-- );

-- Step 4: Check orphaned notifications in queue
SELECT '=== ORPHANED NOTIFICATIONS (notifications with no parent event) ===' as section;

SELECT COUNT(*) as orphaned_count
FROM notification_queue nq
WHERE NOT EXISTS (
  SELECT 1 FROM events e WHERE e.id = nq.event_id
);

-- Step 5: See details of orphaned notifications
SELECT
  nq.id,
  nq.event_id,
  nq.scheduled_for,
  nq.sent_at,
  nq.status,
  nq.created_at,
  'ORPHANED - event deleted' as note
FROM notification_queue nq
WHERE NOT EXISTS (
  SELECT 1 FROM events e WHERE e.id = nq.event_id
)
ORDER BY nq.created_at DESC
LIMIT 20;

-- Step 6: Summary - all tables relationship integrity
SELECT '=== SUMMARY - TABLE INTEGRITY ===' as section;

SELECT
  (SELECT COUNT(*) FROM events WHERE is_active = true) as active_events,
  (SELECT COUNT(*) FROM events WHERE is_active = false) as inactive_events,
  (SELECT COUNT(*) FROM event_notification_schedules) as total_schedules,
  (SELECT COUNT(*) FROM event_notification_schedules s
   WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.id = s.event_id)) as orphaned_schedules,
  (SELECT COUNT(*) FROM notification_queue) as total_notifications,
  (SELECT COUNT(*) FROM notification_queue nq
   WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.id = nq.event_id)) as orphaned_notifications;
