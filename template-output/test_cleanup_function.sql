-- ============================================
-- Test the cleanup-events Edge Function
-- ============================================
--
-- INSTRUCTIONS:
-- 1. Get your service role key from: https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_REF/settings/api
-- 2. Replace YOUR_SERVICE_ROLE_KEY_HERE below with the actual key
-- 3. Run this SQL in the SQL Editor
-- 4. Check the result to see what was cleaned up
--
-- ============================================

-- First, check what events exist BEFORE cleanup
SELECT
  'BEFORE CLEANUP' as status,
  recurrence_type,
  is_active,
  COUNT(*) as count
FROM events
GROUP BY recurrence_type, is_active
ORDER BY recurrence_type, is_active;

-- Call the cleanup function
SELECT net.http_post(
  url := 'https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/cleanup-events',
  headers := jsonb_build_object(
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE',
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb,
  timeout_milliseconds := 30000
) as cleanup_response;

-- Wait a moment for the function to complete, then check what events exist AFTER cleanup
SELECT
  'AFTER CLEANUP' as status,
  recurrence_type,
  is_active,
  COUNT(*) as count
FROM events
GROUP BY recurrence_type, is_active
ORDER BY recurrence_type, is_active;

-- Show detailed list of remaining events
SELECT
  id,
  title,
  event_type,
  due_date,
  recurrence_type,
  is_active,
  created_at
FROM events
ORDER BY recurrence_type, is_active, created_at DESC;
