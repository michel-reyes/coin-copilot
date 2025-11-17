-- Create reminders table based on script.js reminder structure
-- This stores reminder definitions that will generate notifications

CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    notify_before INTEGER NOT NULL DEFAULT 0, -- milliseconds before due_at to send notification
    timezone TEXT NOT NULL, -- IANA timezone identifier (e.g., "America/New_York")
    wall_clock_time TIME NOT NULL, -- HH:MM format for display and recurring logic
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for optimized queries
CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX idx_reminders_due_at ON public.reminders(due_at) WHERE is_active = true;
CREATE INDEX idx_reminders_active ON public.reminders(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reminders_updated_at_trigger
    BEFORE UPDATE ON public.reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_reminders_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.reminders IS 'Stores reminder definitions with timezone and scheduling information';
COMMENT ON COLUMN public.reminders.notify_before IS 'Milliseconds before due_at to send the notification';
COMMENT ON COLUMN public.reminders.timezone IS 'IANA timezone identifier for the user when reminder was created';
COMMENT ON COLUMN public.reminders.wall_clock_time IS 'Wall clock time extracted from due_at in the specified timezone';



-- Create notification status enum
CREATE TYPE public.notification_status AS ENUM ('pending', 'sent', 'failed');

-- Create notifications table based on script.js notification queue structure
-- This stores individual notification instances to be sent

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL, -- UTC timestamp when notification should be sent
    sent_at TIMESTAMPTZ, -- When notification was actually sent
    status public.notification_status NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMPTZ, -- When to retry if failed
    timezone TEXT NOT NULL, -- Copied from reminder for reference
    wall_clock_time TIME NOT NULL, -- Copied from reminder for reference
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create optimized indexes for cron job queries
CREATE INDEX idx_notifications_scheduled_at_status ON public.notifications(scheduled_at, status) 
    WHERE status IN ('pending', 'failed') AND attempts < 3;

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_reminder_id ON public.notifications(reminder_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_next_retry ON public.notifications(next_retry_at) 
    WHERE next_retry_at IS NOT NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at_trigger
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.notifications IS 'Notification queue tracking delivery status and preventing duplicate sends';
COMMENT ON COLUMN public.notifications.scheduled_at IS 'UTC timestamp when notification should be sent';
COMMENT ON COLUMN public.notifications.attempts IS 'Number of send attempts (max 3 with exponential backoff)';
COMMENT ON COLUMN public.notifications.next_retry_at IS 'Next retry time for failed notifications (5s, 10s, 20s backoff)';



-- Create trigger to automatically create notification when reminder is created
-- Based on script.js createReminder function (lines 302-364)

CREATE OR REPLACE FUNCTION create_notification_for_reminder()
RETURNS TRIGGER AS $$
DECLARE
    notification_scheduled_at TIMESTAMPTZ;
BEGIN
    -- Calculate when notification should be sent
    -- scheduled_at = due_at - notify_before (milliseconds)
    notification_scheduled_at := NEW.due_at - (NEW.notify_before * INTERVAL '1 millisecond');
    
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after reminder insert
CREATE TRIGGER create_notification_after_reminder_insert
    AFTER INSERT ON public.reminders
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION create_notification_for_reminder();

-- Also create notifications when a reminder is reactivated
CREATE TRIGGER create_notification_after_reminder_reactivate
    AFTER UPDATE ON public.reminders
    FOR EACH ROW
    WHEN (OLD.is_active = false AND NEW.is_active = true)
    EXECUTE FUNCTION create_notification_for_reminder();

COMMENT ON FUNCTION create_notification_for_reminder() IS 'Automatically creates a notification entry when a reminder is created or reactivated';



