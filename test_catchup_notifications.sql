-- ============================================
-- Test Catchup Notifications Fix
-- ============================================
-- This tests that one-time events with past due dates
-- now trigger notifications within the 24-hour catchup window
-- ============================================

-- Step 1: Check current server time
SELECT '=== CURRENT TIME ===' as section;
SELECT NOW() as current_time, NOW()::DATE as current_date;

-- Step 2: Show all active one-time events that should trigger catchup
SELECT '=== ONE-TIME EVENTS (should send if due_date within last 24h) ===' as section;
SELECT
  e.id,
  e.title,
  e.due_date,
  e.created_at as event_created_at,
  s.notification_time,
  s.days_before,
  -- Calculate the notification datetime
  (e.due_date::DATE - s.days_before * INTERVAL '1 day' + s.notification_time::TIME) as notification_should_send_at,
  -- Calculate how long ago the notification time was
  NOW() - (e.due_date::DATE - s.days_before * INTERVAL '1 day' + s.notification_time::TIME) as time_since_notification,
  -- Check if it's within 24-hour catchup window
  CASE
    WHEN (e.due_date::DATE - s.days_before * INTERVAL '1 day' + s.notification_time::TIME) >= (NOW() - INTERVAL '24 hours')
     AND (e.due_date::DATE - s.days_before * INTERVAL '1 day' + s.notification_time::TIME) < (NOW() + INTERVAL '1 hour')
    THEN '✅ IN WINDOW - Should send NOW'
    WHEN (e.due_date::DATE - s.days_before * INTERVAL '1 day' + s.notification_time::TIME) < (NOW() - INTERVAL '24 hours')
    THEN '❌ TOO OLD (>24 hours ago)'
    ELSE '⏰ FUTURE (will send later)'
  END as window_status
FROM events e
INNER JOIN event_notification_schedules s ON e.id = s.event_id
WHERE e.is_active = true
  AND e.recurrence_type = 'one_time'
  AND s.is_active = true
ORDER BY notification_should_send_at DESC;

-- Step 3: Manually trigger the edge function to test
SELECT '=== TRIGGER EDGE FUNCTION ===' as section;
SELECT 'Run this in a separate query after replacing YOUR_SERVICE_ROLE_KEY:' as instruction;
SELECT 'SELECT net.http_post(url := ''https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/send-scheduled-notifications'', headers := jsonb_build_object(''Authorization'', ''Bearer YOUR_SERVICE_ROLE_KEY'', ''Content-Type'', ''application/json''), body := ''{}''::jsonb);' as query_to_run;

-- Step 4: Wait a moment, then check notification_queue
SELECT '=== AFTER RUNNING EDGE FUNCTION, CHECK QUEUE ===' as section;
SELECT
  nq.id,
  e.title as event_title,
  nq.scheduled_for,
  nq.sent_at,
  nq.status,
  nq.error_message,
  nq.created_at
FROM notification_queue nq
INNER JOIN events e ON nq.event_id = e.id
WHERE nq.created_at > (NOW() - INTERVAL '5 minutes')
ORDER BY nq.created_at DESC;

-- Step 5: Check if your specific events got notifications
SELECT '=== CHECK SPECIFIC EVENTS ===' as section;
SELECT
  e.id,
  e.title,
  e.due_date,
  nq.id IS NOT NULL as notification_sent,
  nq.status,
  nq.sent_at
FROM events e
LEFT JOIN notification_queue nq ON e.id = nq.event_id
WHERE e.id IN (
  '7e346520-fb0c-4a1e-af8b-3f7471c221b8',  -- Test 1
  '688e3b3b-62ef-49c8-a8ea-8905c02b02ee'   -- Card 2
)
ORDER BY e.title;
