-- Add support for multiple notifications per reminder
-- This migration adds a JSONB array field to store multiple notification offsets
-- and updates the trigger to create multiple notification entries

-- Step 1: Add notify_before_schedules column to reminders table
-- This stores an array of millisecond offsets for multiple notifications
-- Example: [604800000, 259200000, 0] = [7 days, 3 days, 0 days] before due date
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS notify_before_schedules JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.reminders.notify_before_schedules IS 'Array of millisecond offsets for multiple notifications (e.g., [604800000, 259200000, 0] for 7 days, 3 days, and day-of)';

-- Step 2: Create index for JSONB column queries
CREATE INDEX IF NOT EXISTS idx_reminders_notify_before_schedules 
  ON public.reminders USING gin(notify_before_schedules);

-- Step 3: Drop the old trigger functions that create single notifications
DROP TRIGGER IF EXISTS create_notification_after_reminder_insert ON public.reminders;
DROP TRIGGER IF EXISTS create_notification_after_reminder_reactivate ON public.reminders;
DROP FUNCTION IF EXISTS create_notification_for_reminder();

-- Step 4: Create new trigger function that handles multiple notifications
CREATE OR REPLACE FUNCTION create_notifications_for_reminder()
RETURNS TRIGGER AS $$
DECLARE
    notification_scheduled_at TIMESTAMPTZ;
    notify_offset BIGINT;
    schedule_item JSONB;
BEGIN
    -- Check if we have schedules in the new JSONB array
    IF jsonb_array_length(NEW.notify_before_schedules) > 0 THEN
        -- Iterate over each schedule in the JSONB array
        FOR schedule_item IN SELECT * FROM jsonb_array_elements(NEW.notify_before_schedules)
        LOOP
            -- Extract the millisecond offset from JSONB
            notify_offset := (schedule_item)::text::bigint;
            
            -- Calculate when notification should be sent
            -- scheduled_at = due_at - notify_offset (milliseconds)
            notification_scheduled_at := NEW.due_at - (notify_offset * INTERVAL '1 millisecond');
            
            -- Insert notification into queue
            INSERT INTO public.notifications (
                user_id,
                reminder_id,
                title,
                body,
                scheduled_at,
                status,
                timezone,
                wall_clock_time
            ) VALUES (
                NEW.user_id,
                NEW.id,
                NEW.title,
                NEW.body,
                notification_scheduled_at,
                'pending',
                NEW.timezone,
                NEW.wall_clock_time
            );
        END LOOP;
    ELSE
        -- Backward compatibility: if no schedules array, use old notify_before field
        IF NEW.notify_before IS NOT NULL AND NEW.notify_before > 0 THEN
            notification_scheduled_at := NEW.due_at - (NEW.notify_before * INTERVAL '1 millisecond');
            
            INSERT INTO public.notifications (
                user_id,
                reminder_id,
                title,
                body,
                scheduled_at,
                status,
                timezone,
                wall_clock_time
            ) VALUES (
                NEW.user_id,
                NEW.id,
                NEW.title,
                NEW.body,
                notification_scheduled_at,
                'pending',
                NEW.timezone,
                NEW.wall_clock_time
            );
        ELSE
            -- Default: create notification for day-of if no schedules specified
            INSERT INTO public.notifications (
                user_id,
                reminder_id,
                title,
                body,
                scheduled_at,
                status,
                timezone,
                wall_clock_time
            ) VALUES (
                NEW.user_id,
                NEW.id,
                NEW.title,
                NEW.body,
                NEW.due_at,
                'pending',
                NEW.timezone,
                NEW.wall_clock_time
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_notifications_for_reminder() IS 'Creates multiple notification entries when a reminder is created or reactivated, supporting both new JSONB schedules and legacy notify_before field';

-- Step 5: Create triggers using the new function
CREATE TRIGGER create_notifications_after_reminder_insert
    AFTER INSERT ON public.reminders
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION create_notifications_for_reminder();

CREATE TRIGGER create_notifications_after_reminder_reactivate
    AFTER UPDATE ON public.reminders
    FOR EACH ROW
    WHEN (OLD.is_active = false AND NEW.is_active = true)
    EXECUTE FUNCTION create_notifications_for_reminder();

-- Step 6: Add helpful function to convert days to milliseconds for easier usage
CREATE OR REPLACE FUNCTION days_to_milliseconds(days INTEGER)
RETURNS BIGINT AS $$
BEGIN
    RETURN days::bigint * 24 * 60 * 60 * 1000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION days_to_milliseconds(INTEGER) IS 'Helper function to convert days to milliseconds for notification schedules';

-- Example usage:
-- To create a reminder with notifications at 7 days, 3 days, and day-of:
-- INSERT INTO reminders (..., notify_before_schedules)
-- VALUES (..., jsonb_build_array(days_to_milliseconds(7), days_to_milliseconds(3), days_to_milliseconds(0)));

