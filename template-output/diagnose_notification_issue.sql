-- ============================================
-- Diagnostic Query for Notification Issue
-- ============================================
-- Run this in the Supabase SQL Editor to diagnose why notifications aren't sending
--
-- Event ID: 7e346520-fb0c-4a1e-af8b-3f7471c221b8
-- ============================================

-- 1. Check the event details
SELECT '=== EVENT DETAILS ===' as section;
SELECT
  id,
  title,
  event_type,
  due_date,
  recurrence_type,
  is_active,
  created_at,
  updated_at
FROM events
WHERE id = '7e346520-fb0c-4a1e-af8b-3f7471c221b8';

-- 2. Check notification schedules for this event
SELECT '=== NOTIFICATION SCHEDULES ===' as section;
SELECT
  id,
  event_id,
  notification_time,
  days_before,
  is_active,
  created_at
FROM event_notification_schedules
WHERE event_id = '7e346520-fb0c-4a1e-af8b-3f7471c221b8';

-- 3. Check current server time
SELECT '=== SERVER TIME ===' as section;
SELECT
  NOW() as server_time_utc,
  NOW()::DATE as server_date,
  NOW()::TIME as server_time;

-- 4. Check if notification was already sent
SELECT '=== NOTIFICATION QUEUE (sent history) ===' as section;
SELECT
  id,
  event_id,
  scheduled_for,
  sent_at,
  status,
  error_message,
  created_at
FROM notification_queue
WHERE event_id = '7e346520-fb0c-4a1e-af8b-3f7471c221b8'
ORDER BY created_at DESC;

-- 5. Check if user has push token
SELECT '=== USER PUSH TOKEN ===' as section;
SELECT
  e.id as event_id,
  e.user_id,
  u.expo_push_token IS NOT NULL as has_push_token,
  u.expo_push_token_updated_at,
  u.device_info
FROM events e
LEFT JOIN user_api_keys u ON e.user_id = u.user_id
WHERE e.id = '7e346520-fb0c-4a1e-af8b-3f7471c221b8';

-- 6. Calculate what the notification time SHOULD be
SELECT '=== CALCULATED NOTIFICATION TIME ===' as section;
SELECT
  e.id as event_id,
  e.title,
  e.due_date,
  e.recurrence_type,
  s.notification_time,
  s.days_before,
  -- Calculate when notification should be sent
  (e.due_date::DATE - s.days_before * INTERVAL '1 day')::DATE as notification_date,
  (e.due_date::DATE - s.days_before * INTERVAL '1 day' + s.notification_time::TIME) as notification_datetime,
  -- Check if it's in the processing window (last 24 hours to next hour)
  CASE
    WHEN (e.due_date::DATE - s.days_before * INTERVAL '1 day' + s.notification_time::TIME) >= (NOW() - INTERVAL '24 hours')
     AND (e.due_date::DATE - s.days_before * INTERVAL '1 day' + s.notification_time::TIME) < (NOW() + INTERVAL '1 hour')
    THEN '✅ IN WINDOW - Should send'
    WHEN (e.due_date::DATE - s.days_before * INTERVAL '1 day' + s.notification_time::TIME) < (NOW() - INTERVAL '24 hours')
    THEN '❌ TOO OLD (>24 hours ago)'
    ELSE '⏰ FUTURE (not yet in window)'
  END as status
FROM events e
INNER JOIN event_notification_schedules s ON e.id = s.event_id
WHERE e.id = '7e346520-fb0c-4a1e-af8b-3f7471c221b8';

-- 7. Check cron job status
SELECT '=== CRON JOB STATUS ===' as section;
SELECT
  jobname,
  schedule,
  active,
  jobid
FROM cron.job
WHERE jobname = 'send-scheduled-notifications';

-- 8. Check recent cron executions
SELECT '=== RECENT CRON RUNS ===' as section;
SELECT
  jobid,
  runid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-scheduled-notifications')
ORDER BY start_time DESC
LIMIT 5;

-- 9. Check edge function invocations (if available)
SELECT '=== EDGE FUNCTION LOGS ===' as section;
SELECT 'Go to: https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_REF/functions/send-scheduled-notifications/invocations';

-- 10. Test the batch deduplication function
SELECT '=== TEST BATCH FUNCTION ===' as section;
SELECT * FROM check_notifications_sent_batch('[
  {"event_id": "7e346520-fb0c-4a1e-af8b-3f7471c221b8", "user_id": "00000000-0000-0000-0000-000000000000", "date": "2025-10-23"}
]'::jsonb);

-- 11. Check all active events and their notification schedules
SELECT '=== ALL ACTIVE EVENTS WITH SCHEDULES ===' as section;
SELECT
  e.id,
  e.title,
  e.due_date,
  e.recurrence_type,
  COUNT(s.id) as schedule_count,
  string_agg(s.notification_time::TEXT || ' (' || s.days_before || ' days before)', ', ') as schedules
FROM events e
LEFT JOIN event_notification_schedules s ON e.id = s.event_id AND s.is_active = true
WHERE e.is_active = true
GROUP BY e.id, e.title, e.due_date, e.recurrence_type
ORDER BY e.created_at DESC
LIMIT 10;
