-- Test Recurring Reminders Auto-Regeneration
-- This script tests the recurring reminder functionality including:
-- 1. Creating reminders with different recurrence types
-- 2. Simulating notification completion
-- 3. Verifying auto-regeneration of recurring reminders
-- 4. Testing date calculations for different recurrence patterns

-- Prerequisites: Run this after the migration 20251118000000_add_recurrence_support.sql

\echo '=== Testing Recurring Reminders System ==='
\echo ''

-- Setup: Create a test user (or use existing)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get or create test user
    SELECT id INTO test_user_id
    FROM auth.users
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found. Please create a user first.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Using test user: %', test_user_id;
    
    -- Store for later use
    CREATE TEMP TABLE test_context (user_id UUID);
    INSERT INTO test_context VALUES (test_user_id);
END $$;

\echo ''
\echo '=== Test 1: Monthly Recurring Reminder ==='

-- Create a monthly recurring reminder for credit card payment
DO $$
DECLARE
    test_user_id UUID;
    test_reminder_id UUID;
    test_due_date TIMESTAMPTZ;
BEGIN
    SELECT user_id INTO test_user_id FROM test_context;
    
    -- Set due date to 5 days from now
    test_due_date := NOW() + INTERVAL '5 days';
    
    -- Create monthly recurring reminder with multiple notification schedules
    INSERT INTO public.reminders (
        user_id,
        title,
        body,
        due_at,
        notify_before_schedules,
        timezone,
        wall_clock_time,
        is_active,
        recurrence_type,
        account_id
    ) VALUES (
        test_user_id,
        'Test Credit Card Payment',
        'Monthly recurring payment reminder',
        test_due_date,
        jsonb_build_array(
            days_to_milliseconds(7),
            days_to_milliseconds(3),
            days_to_milliseconds(0)
        ),
        'America/New_York',
        '09:00:00',
        true,
        'monthly',
        'test-account-123'
    )
    RETURNING id INTO test_reminder_id;
    
    RAISE NOTICE 'Created monthly recurring reminder: %', test_reminder_id;
    
    -- Verify notifications were created
    RAISE NOTICE 'Notifications created: %', (
        SELECT COUNT(*) 
        FROM public.notifications 
        WHERE reminder_id = test_reminder_id
    );
    
    -- Store reminder ID for next tests
    INSERT INTO test_context VALUES (test_reminder_id);
END $$;

\echo ''
\echo '=== Test 2: Verify Notification Creation ==='

SELECT 
    n.id,
    n.reminder_id,
    n.title,
    n.scheduled_at,
    n.status,
    EXTRACT(DAY FROM (r.due_at - n.scheduled_at)) as days_before
FROM public.notifications n
JOIN public.reminders r ON r.id = n.reminder_id
WHERE r.title = 'Test Credit Card Payment'
  AND r.is_active = true
ORDER BY n.scheduled_at;

\echo ''
\echo '=== Test 3: Simulate Notification Completion ==='

-- Mark all notifications as sent to trigger regeneration
DO $$
DECLARE
    test_reminder_id UUID;
    initial_reminder_count INTEGER;
    notification_id UUID;
BEGIN
    -- Get the test reminder
    SELECT user_id INTO test_reminder_id 
    FROM test_context 
    WHERE user_id IS NOT NULL 
    LIMIT 1 OFFSET 1;
    
    -- Count reminders before regeneration
    SELECT COUNT(*) INTO initial_reminder_count
    FROM public.reminders
    WHERE title = 'Test Credit Card Payment';
    
    RAISE NOTICE 'Reminders before completion: %', initial_reminder_count;
    
    -- Mark each notification as sent one by one
    FOR notification_id IN 
        SELECT id FROM public.notifications 
        WHERE reminder_id = test_reminder_id
        ORDER BY scheduled_at
    LOOP
        UPDATE public.notifications
        SET status = 'sent', sent_at = NOW()
        WHERE id = notification_id;
        
        RAISE NOTICE 'Marked notification % as sent', notification_id;
    END LOOP;
    
    -- Check if new reminder was created
    RAISE NOTICE 'Reminders after completion: %', (
        SELECT COUNT(*) 
        FROM public.reminders 
        WHERE title = 'Test Credit Card Payment'
    );
END $$;

\echo ''
\echo '=== Test 4: Verify Auto-Regeneration ==='

-- Check that original reminder is inactive and new one is active
SELECT 
    id,
    title,
    due_at,
    recurrence_type,
    is_active,
    parent_reminder_id,
    created_at
FROM public.reminders
WHERE title = 'Test Credit Card Payment'
ORDER BY created_at;

\echo ''
\echo '=== Test 5: Verify New Reminder Has Correct Due Date ==='

-- Check that new reminder's due date is approximately 1 month after original
SELECT 
    r1.id as original_id,
    r1.due_at as original_due_at,
    r2.id as new_id,
    r2.due_at as new_due_at,
    EXTRACT(DAY FROM (r2.due_at - r1.due_at)) as days_difference,
    r2.parent_reminder_id as links_to_original
FROM public.reminders r1
JOIN public.reminders r2 ON r2.parent_reminder_id = r1.id
WHERE r1.title = 'Test Credit Card Payment'
  AND r1.is_active = false
  AND r2.is_active = true;

\echo ''
\echo '=== Test 6: Verify New Notifications Were Created ==='

-- Check that new reminder has its own set of notifications
SELECT 
    r.id as reminder_id,
    r.is_active,
    COUNT(n.id) as notification_count,
    MIN(n.scheduled_at) as first_notification,
    MAX(n.scheduled_at) as last_notification
FROM public.reminders r
LEFT JOIN public.notifications n ON n.reminder_id = r.id
WHERE r.title = 'Test Credit Card Payment'
GROUP BY r.id, r.is_active
ORDER BY r.created_at;

\echo ''
\echo '=== Test 7: Test Different Recurrence Types ==='

-- Test weekly recurrence
DO $$
DECLARE
    test_user_id UUID;
    weekly_reminder_id UUID;
    test_due_date TIMESTAMPTZ;
BEGIN
    SELECT user_id INTO test_user_id FROM test_context LIMIT 1;
    test_due_date := NOW() + INTERVAL '3 days';
    
    INSERT INTO public.reminders (
        user_id, title, body, due_at,
        notify_before_schedules, timezone, wall_clock_time,
        is_active, recurrence_type
    ) VALUES (
        test_user_id,
        'Test Weekly Reminder',
        'Weekly recurring reminder',
        test_due_date,
        jsonb_build_array(days_to_milliseconds(1)),
        'America/New_York',
        '10:00:00',
        true,
        'weekly'
    ) RETURNING id INTO weekly_reminder_id;
    
    RAISE NOTICE 'Created weekly reminder: %', weekly_reminder_id;
END $$;

-- Test bi-weekly recurrence
DO $$
DECLARE
    test_user_id UUID;
    biweekly_reminder_id UUID;
    test_due_date TIMESTAMPTZ;
BEGIN
    SELECT user_id INTO test_user_id FROM test_context LIMIT 1;
    test_due_date := NOW() + INTERVAL '3 days';
    
    INSERT INTO public.reminders (
        user_id, title, body, due_at,
        notify_before_schedules, timezone, wall_clock_time,
        is_active, recurrence_type
    ) VALUES (
        test_user_id,
        'Test Bi-Weekly Reminder',
        'Bi-weekly recurring reminder',
        test_due_date,
        jsonb_build_array(days_to_milliseconds(2)),
        'America/New_York',
        '11:00:00',
        true,
        'bi_weekly'
    ) RETURNING id INTO biweekly_reminder_id;
    
    RAISE NOTICE 'Created bi-weekly reminder: %', biweekly_reminder_id;
END $$;

-- Test daily recurrence
DO $$
DECLARE
    test_user_id UUID;
    daily_reminder_id UUID;
    test_due_date TIMESTAMPTZ;
BEGIN
    SELECT user_id INTO test_user_id FROM test_context LIMIT 1;
    test_due_date := NOW() + INTERVAL '1 day';
    
    INSERT INTO public.reminders (
        user_id, title, body, due_at,
        notify_before_schedules, timezone, wall_clock_time,
        is_active, recurrence_type,
        notification_times
    ) VALUES (
        test_user_id,
        'Test Daily Reminder',
        'Daily recurring reminder with multiple times',
        test_due_date,
        jsonb_build_array(days_to_milliseconds(0)),
        'America/New_York',
        '09:00:00',
        true,
        'daily',
        '["09:00", "13:00", "17:00"]'::jsonb
    ) RETURNING id INTO daily_reminder_id;
    
    RAISE NOTICE 'Created daily reminder with 3 notification times: %', daily_reminder_id;
END $$;

\echo ''
\echo '=== Test 8: View All Test Reminders ==='

SELECT 
    id,
    title,
    due_at,
    recurrence_type,
    is_active,
    notification_times,
    (SELECT COUNT(*) FROM public.notifications WHERE reminder_id = r.id) as notification_count
FROM public.reminders r
WHERE title LIKE 'Test %'
ORDER BY created_at;

\echo ''
\echo '=== Test 9: Test Date Calculation Functions ==='

-- Test calculate_next_due_date function
SELECT 
    'daily' as recurrence_type,
    calculate_next_due_date(NOW(), 'daily', NULL) as next_due_date,
    EXTRACT(DAY FROM (calculate_next_due_date(NOW(), 'daily', NULL) - NOW())) as days_added;

SELECT 
    'weekly' as recurrence_type,
    calculate_next_due_date(NOW(), 'weekly', NULL) as next_due_date,
    EXTRACT(DAY FROM (calculate_next_due_date(NOW(), 'weekly', NULL) - NOW())) as days_added;

SELECT 
    'bi_weekly' as recurrence_type,
    calculate_next_due_date(NOW(), 'bi_weekly', NULL) as next_due_date,
    EXTRACT(DAY FROM (calculate_next_due_date(NOW(), 'bi_weekly', NULL) - NOW())) as days_added;

SELECT 
    'monthly' as recurrence_type,
    calculate_next_due_date(NOW(), 'monthly', NULL) as next_due_date,
    EXTRACT(DAY FROM (calculate_next_due_date(NOW(), 'monthly', NULL) - NOW())) as days_added;

SELECT 
    'custom (10 days)' as recurrence_type,
    calculate_next_due_date(NOW(), 'custom', 10) as next_due_date,
    EXTRACT(DAY FROM (calculate_next_due_date(NOW(), 'custom', 10) - NOW())) as days_added;

\echo ''
\echo '=== Test 10: Test Recurrence End Date ==='

-- Create a reminder with end date
DO $$
DECLARE
    test_user_id UUID;
    limited_reminder_id UUID;
    test_due_date TIMESTAMPTZ;
    end_date DATE;
BEGIN
    SELECT user_id INTO test_user_id FROM test_context LIMIT 1;
    test_due_date := NOW() + INTERVAL '2 days';
    end_date := (NOW() + INTERVAL '45 days')::DATE;
    
    INSERT INTO public.reminders (
        user_id, title, body, due_at,
        notify_before_schedules, timezone, wall_clock_time,
        is_active, recurrence_type, recurrence_end_date
    ) VALUES (
        test_user_id,
        'Test Limited Recurring Reminder',
        'Monthly reminder that ends in 45 days',
        test_due_date,
        jsonb_build_array(days_to_milliseconds(1)),
        'America/New_York',
        '12:00:00',
        true,
        'monthly',
        end_date
    ) RETURNING id INTO limited_reminder_id;
    
    RAISE NOTICE 'Created limited recurring reminder: % (ends: %)', limited_reminder_id, end_date;
END $$;

\echo ''
\echo '=== Cleanup: Remove Test Data ==='

-- Uncomment to clean up test data
-- DELETE FROM public.notifications WHERE reminder_id IN (
--     SELECT id FROM public.reminders WHERE title LIKE 'Test %'
-- );
-- DELETE FROM public.reminders WHERE title LIKE 'Test %';

\echo ''
\echo '=== Test Summary ==='
\echo 'All tests completed! Review the output above to verify:'
\echo '1. Monthly reminders auto-regenerate after notifications complete'
\echo '2. New reminders have correct due dates (1 month later)'
\echo '3. Parent-child relationships are properly maintained'
\echo '4. Multiple notification schedules work correctly'
\echo '5. Different recurrence types (daily, weekly, bi-weekly, monthly) are supported'
\echo '6. Date calculation functions work as expected'
\echo '7. Recurrence end dates are respected'
\echo ''
\echo 'To clean up test data, uncomment the DELETE statements above and re-run.'

