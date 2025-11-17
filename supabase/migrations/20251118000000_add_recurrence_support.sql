-- Add Recurrence Support to Reminders
-- This migration enables recurring reminders (daily, weekly, monthly, etc.)
-- with support for multiple notifications per day

-- Step 1: Add recurrence columns to reminders table
ALTER TABLE public.reminders 
  ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER,
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
  ADD COLUMN IF NOT EXISTS parent_reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notification_times JSONB DEFAULT '[]'::jsonb;

-- Add constraint for recurrence_type
ALTER TABLE public.reminders 
  ADD CONSTRAINT check_recurrence_type 
  CHECK (recurrence_type IN ('one_time', 'daily', 'weekly', 'bi_weekly', 'monthly', 'custom'));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reminders_recurrence_type ON public.reminders(recurrence_type);
CREATE INDEX IF NOT EXISTS idx_reminders_parent_reminder_id ON public.reminders(parent_reminder_id);

-- Add comments for documentation
COMMENT ON COLUMN public.reminders.recurrence_type IS 'Type of recurrence: one_time, daily, weekly, bi_weekly, monthly, custom';
COMMENT ON COLUMN public.reminders.recurrence_interval IS 'Number of days between occurrences (used with custom recurrence_type)';
COMMENT ON COLUMN public.reminders.recurrence_end_date IS 'Optional date to stop recurring (NULL = forever)';
COMMENT ON COLUMN public.reminders.parent_reminder_id IS 'Links to the original reminder for tracking history';
COMMENT ON COLUMN public.reminders.notification_times IS 'Array of times for same-day notifications, e.g., ["09:00", "13:00", "17:00"]';

-- Step 2: Create function to calculate next due date based on recurrence type
CREATE OR REPLACE FUNCTION calculate_next_due_date(
    current_due_at TIMESTAMPTZ,
    recurrence_type TEXT,
    recurrence_interval INTEGER DEFAULT NULL
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    next_due_at TIMESTAMPTZ;
BEGIN
    CASE recurrence_type
        WHEN 'daily' THEN
            next_due_at := current_due_at + INTERVAL '1 day';
        WHEN 'weekly' THEN
            next_due_at := current_due_at + INTERVAL '7 days';
        WHEN 'bi_weekly' THEN
            next_due_at := current_due_at + INTERVAL '14 days';
        WHEN 'monthly' THEN
            -- Handle month-end edge cases (e.g., Jan 31 -> Feb 28)
            next_due_at := current_due_at + INTERVAL '1 month';
            -- If we want the same day of month, PostgreSQL handles this automatically
            -- E.g., '2024-01-31'::date + interval '1 month' = '2024-02-29'
        WHEN 'custom' THEN
            IF recurrence_interval IS NULL OR recurrence_interval <= 0 THEN
                RAISE EXCEPTION 'recurrence_interval must be positive for custom recurrence type';
            END IF;
            next_due_at := current_due_at + (recurrence_interval || ' days')::INTERVAL;
        ELSE
            -- one_time or unknown type - no recurrence
            RETURN NULL;
    END CASE;
    
    RETURN next_due_at;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_next_due_date IS 'Calculates the next due date based on recurrence rules. Returns NULL for one_time reminders.';

-- Step 3: Create function to regenerate recurring reminder
CREATE OR REPLACE FUNCTION regenerate_recurring_reminder(reminder_id UUID)
RETURNS UUID AS $$
DECLARE
    original_reminder RECORD;
    next_due_at TIMESTAMPTZ;
    new_reminder_id UUID;
BEGIN
    -- Get the original reminder
    SELECT * INTO original_reminder
    FROM public.reminders
    WHERE id = reminder_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reminder not found: %', reminder_id;
    END IF;
    
    -- Check if reminder is recurring
    IF original_reminder.recurrence_type = 'one_time' THEN
        -- Not a recurring reminder, just mark as inactive
        UPDATE public.reminders
        SET is_active = false
        WHERE id = reminder_id;
        RETURN NULL;
    END IF;
    
    -- Check if recurrence has ended
    IF original_reminder.recurrence_end_date IS NOT NULL 
       AND original_reminder.due_at::DATE >= original_reminder.recurrence_end_date THEN
        -- Recurrence has ended, mark as inactive
        UPDATE public.reminders
        SET is_active = false
        WHERE id = reminder_id;
        RETURN NULL;
    END IF;
    
    -- Calculate next due date
    next_due_at := calculate_next_due_date(
        original_reminder.due_at,
        original_reminder.recurrence_type,
        original_reminder.recurrence_interval
    );
    
    IF next_due_at IS NULL THEN
        -- No next occurrence, mark as inactive
        UPDATE public.reminders
        SET is_active = false
        WHERE id = reminder_id;
        RETURN NULL;
    END IF;
    
    -- Mark original reminder as inactive
    UPDATE public.reminders
    SET is_active = false
    WHERE id = reminder_id;
    
    -- Create new reminder with same settings but new due_at
    INSERT INTO public.reminders (
        user_id,
        title,
        body,
        due_at,
        notify_before,
        notify_before_schedules,
        timezone,
        wall_clock_time,
        is_active,
        recurrence_type,
        recurrence_interval,
        recurrence_end_date,
        parent_reminder_id,
        notification_times,
        account_id
    ) VALUES (
        original_reminder.user_id,
        original_reminder.title,
        original_reminder.body,
        next_due_at,
        original_reminder.notify_before,
        original_reminder.notify_before_schedules,
        original_reminder.timezone,
        original_reminder.wall_clock_time,
        true, -- is_active
        original_reminder.recurrence_type,
        original_reminder.recurrence_interval,
        original_reminder.recurrence_end_date,
        COALESCE(original_reminder.parent_reminder_id, reminder_id), -- Link to original parent or self
        original_reminder.notification_times,
        original_reminder.account_id
    )
    RETURNING id INTO new_reminder_id;
    
    RETURN new_reminder_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION regenerate_recurring_reminder IS 'Creates the next occurrence of a recurring reminder. Marks original as inactive and creates new reminder with updated due_at. Returns new reminder ID or NULL if no more occurrences.';

-- Step 4: Create trigger to auto-regenerate after all notifications sent
CREATE OR REPLACE FUNCTION check_and_regenerate_after_notification_sent()
RETURNS TRIGGER AS $$
DECLARE
    reminder_id UUID;
    total_notifications INTEGER;
    sent_notifications INTEGER;
BEGIN
    -- Only proceed if notification was just marked as sent
    IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
        reminder_id := NEW.reminder_id;
        
        -- Count total notifications for this reminder
        SELECT COUNT(*) INTO total_notifications
        FROM public.notifications
        WHERE reminder_id = reminder_id;
        
        -- Count sent notifications for this reminder
        SELECT COUNT(*) INTO sent_notifications
        FROM public.notifications
        WHERE reminder_id = reminder_id
        AND status = 'sent';
        
        -- If all notifications are sent, regenerate if recurring
        IF total_notifications = sent_notifications THEN
            -- Call regeneration function (it handles checking if recurring)
            PERFORM regenerate_recurring_reminder(reminder_id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_and_regenerate_after_notification_sent IS 'Checks if all notifications for a reminder are sent, and if so, regenerates the reminder if it is recurring';

-- Create trigger that fires after notification status update
CREATE TRIGGER trigger_regenerate_after_all_notifications_sent
    AFTER UPDATE OF status ON public.notifications
    FOR EACH ROW
    WHEN (NEW.status = 'sent')
    EXECUTE FUNCTION check_and_regenerate_after_notification_sent();

COMMENT ON TRIGGER trigger_regenerate_after_all_notifications_sent ON public.notifications IS 'Automatically regenerates recurring reminders when all their notifications have been sent';

