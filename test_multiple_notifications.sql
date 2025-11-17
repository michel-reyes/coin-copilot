-- Test script for multiple notifications per reminder
-- Run this after applying the migration: 20251117000000_add_multiple_notifications_support.sql
--
-- This script tests:
-- 1. Creating a reminder with multiple notification schedules
-- 2. Verifying that multiple notifications are created
-- 3. Backward compatibility with single notify_before field

-- Clean up any existing test data
DELETE FROM public.notifications WHERE title LIKE 'Test:%';
DELETE FROM public.reminders WHERE title LIKE 'Test:%';

-- Test 1: Create a reminder with multiple notification schedules
-- This simulates what the AccountSettings component does for credit cards
-- Schedule: 7 days before, 3 days before, and day-of

DO $$
DECLARE
    test_user_id UUID;
    test_reminder_id UUID;
    notification_count INTEGER;
BEGIN
    -- Get the first user (or use a specific test user ID)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found. Please create a test user first.';
    END IF;
    
    RAISE NOTICE 'Using user ID: %', test_user_id;
    
    -- Insert a test reminder with multiple notification schedules
    INSERT INTO public.reminders (
        user_id,
        title,
        body,
        due_at,
        notify_before_schedules,
        timezone,
        wall_clock_time,
        is_active
    ) VALUES (
        test_user_id,
        'Test: Credit Card Payment',
        'Test reminder for credit card payment',
        NOW() + INTERVAL '10 days',  -- Due in 10 days
        jsonb_build_array(
            days_to_milliseconds(7),  -- 7 days before
            days_to_milliseconds(3),  -- 3 days before
            days_to_milliseconds(0)   -- Day of
        ),
        'America/New_York',
        '09:00:00',
        true
    )
    RETURNING id INTO test_reminder_id;
    
    RAISE NOTICE 'Created test reminder with ID: %', test_reminder_id;
    
    -- Wait a moment for trigger to execute
    PERFORM pg_sleep(0.5);
    
    -- Count the notifications created for this reminder
    SELECT COUNT(*) INTO notification_count
    FROM public.notifications
    WHERE reminder_id = test_reminder_id;
    
    RAISE NOTICE 'Number of notifications created: %', notification_count;
    
    -- Verify we have 3 notifications
    IF notification_count = 3 THEN
        RAISE NOTICE '✓ TEST PASSED: 3 notifications created as expected';
    ELSE
        RAISE WARNING '✗ TEST FAILED: Expected 3 notifications, but got %', notification_count;
    END IF;
    
    -- Display the notifications with their scheduled times
    RAISE NOTICE '--- Notification Details ---';
    FOR notification_count IN 
        SELECT 
            title,
            scheduled_at,
            status,
            EXTRACT(DAY FROM (due_at - scheduled_at)) as days_before
        FROM public.notifications n
        JOIN public.reminders r ON n.reminder_id = r.id
        WHERE n.reminder_id = test_reminder_id
        ORDER BY scheduled_at
    LOOP
        RAISE NOTICE 'Notification scheduled % days before due date', 
            (SELECT EXTRACT(DAY FROM (r.due_at - n.scheduled_at))::INTEGER
             FROM public.notifications n
             JOIN public.reminders r ON n.reminder_id = r.id
             WHERE n.reminder_id = test_reminder_id
             ORDER BY n.scheduled_at
             LIMIT 1);
    END LOOP;
    
END $$;

-- Test 2: Verify backward compatibility with legacy notify_before field
DO $$
DECLARE
    test_user_id UUID;
    test_reminder_id UUID;
    notification_count INTEGER;
BEGIN
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Test 2: Legacy notify_before Field ===';
    
    -- Insert a test reminder using the old single notify_before field
    INSERT INTO public.reminders (
        user_id,
        title,
        body,
        due_at,
        notify_before,  -- Legacy field
        timezone,
        wall_clock_time,
        is_active
    ) VALUES (
        test_user_id,
        'Test: Legacy Notification',
        'Test reminder with legacy single notification',
        NOW() + INTERVAL '5 days',
        604800000,  -- 7 days in milliseconds
        'America/New_York',
        '09:00:00',
        true
    )
    RETURNING id INTO test_reminder_id;
    
    RAISE NOTICE 'Created legacy test reminder with ID: %', test_reminder_id;
    
    -- Wait a moment for trigger to execute
    PERFORM pg_sleep(0.5);
    
    -- Count the notifications created for this reminder
    SELECT COUNT(*) INTO notification_count
    FROM public.notifications
    WHERE reminder_id = test_reminder_id;
    
    RAISE NOTICE 'Number of notifications created: %', notification_count;
    
    -- Verify we have 1 notification (legacy behavior)
    IF notification_count = 1 THEN
        RAISE NOTICE '✓ TEST PASSED: 1 notification created for legacy field';
    ELSE
        RAISE WARNING '✗ TEST FAILED: Expected 1 notification, but got %', notification_count;
    END IF;
END $$;

-- Display summary of all test notifications
SELECT 
    r.title as reminder_title,
    r.due_at,
    COUNT(n.id) as notification_count,
    array_agg(n.scheduled_at ORDER BY n.scheduled_at) as scheduled_times
FROM public.reminders r
LEFT JOIN public.notifications n ON r.reminder_id = n.reminder_id
WHERE r.title LIKE 'Test:%'
GROUP BY r.id, r.title, r.due_at
ORDER BY r.created_at;

RAISE NOTICE '';
RAISE NOTICE '=== Tests Complete ===';
RAISE NOTICE 'Review the output above to verify:';
RAISE NOTICE '1. First reminder should have 3 notifications (7d, 3d, 0d before)';
RAISE NOTICE '2. Second reminder should have 1 notification (legacy support)';

