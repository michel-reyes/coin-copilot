/**
 * Events API
 *
 * Client-side utilities for managing recurring events and notification schedules
 */

import { detectUserTimezone, extractWallClockTime } from '@/utils/date-utils';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { daysBeforeToMilliseconds } from './notificationSchedules';
import { supabase } from './supabase';

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export type ReminderType = 'bill' | 'credit_card' | 'budget_review';
export type RecurrenceType =
    | 'one_time'
    | 'daily'
    | 'weekly'
    | 'bi_weekly'
    | 'monthly'
    | 'custom';

export interface Reminder {
    id: string;
    user_id: string;
    reminder_type: ReminderType;
    title: string;
    description?: string;
    due_date: string; // ISO date string (YYYY-MM-DD)
    recurrence_type: RecurrenceType;
    recurrence_interval?: number; // For custom recurrence
    is_active: boolean;
    account_id?: string; // Optional link to Lunch Money account
    created_at: string;
    updated_at: string;
}

export interface NotificationSchedule {
    id: string;
    event_id: string;
    notification_time: string; // HH:MM:SS
    days_before: number;
    is_active: boolean;
    created_at: string;
}

export interface ReminderWithSchedules extends Reminder {
    notification_schedules: NotificationSchedule[];
}

/**
 * * id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text not null,
  body text not null,
  due_at timestamp with time zone not null,
  notify_before integer not null default 0,
  notify_before_schedules jsonb default '[]'::jsonb,
  timezone text not null,
  wall_clock_time time without time zone not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
 */
export interface CreateReminderData {
    user_id?: string;
    title: string;
    body: string;
    due_at: string;
    notify_before?: number; // Legacy single notification support
    notify_before_schedules?: number[]; // Array of days_before (e.g., [7, 3, 0])
    timezone?: string;
    wall_clock_time?: string;
    is_active: boolean;
    account_id?: string;
    recurrence_type?: RecurrenceType; // Type of recurrence (daily, weekly, monthly, etc.)
    recurrence_interval?: number; // For custom recurrence (number of days)
    recurrence_end_date?: string; // Optional date to stop recurring (YYYY-MM-DD)
    notification_times?: string[]; // Array of times for same-day notifications (e.g., ['09:00', '13:00', '17:00'])
}

export interface CreateNotificationScheduleData {
    notification_time: string; // HH:MM:SS
    days_before: number;
}

/**
 * Fetch all reminders for the current user
 */
export async function getReminders(options?: {
    includeInactive?: boolean;
    eventType?: ReminderType;
}): Promise<{ data: Reminder[] | null; error: any }> {
    let query = supabase
        .from('reminders')
        .select('*')
        .order('due_at', { ascending: true });

    if (!options?.includeInactive) {
        query = query.eq('is_active', true);
    }

    if (options?.eventType) {
        query = query.eq('event_type', options.eventType);
    }

    return await query;
}

/**
 * Create a new event with optional notification schedules
 
 */
export async function createReminder(
    reminderData: CreateReminderData
): Promise<{ data: Reminder | null; error: any }> {
    // Get current user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            data: null,
            error: authError || new Error('Not authenticated'),
        };
    }

    // Create the reminder
    const timezone = detectUserTimezone();

    // Parse the due_date string (YYYY-MM-DD) and create a date object
    const dueDate = new Date(reminderData.due_at + 'T00:00:00');
    const wallClockTime = extractWallClockTime(dueDate, timezone);

    // Build the insert object
    const reminderDataToInsert: any = {
        user_id: user.id,
        title: reminderData.title,
        body: reminderData.body || '',
        due_at: dueDate.toISOString(),
        timezone,
        wall_clock_time: wallClockTime,
        is_active: reminderData.is_active,
        ...(reminderData.account_id && { account_id: reminderData.account_id }),
    };

    // Handle notification schedules - prefer new array format over legacy single value
    if (
        reminderData.notify_before_schedules &&
        reminderData.notify_before_schedules.length > 0
    ) {
        // Convert days_before array to milliseconds array for JSONB storage
        // e.g., [7, 3, 0] -> [604800000, 259200000, 0]
        const schedulesInMs = reminderData.notify_before_schedules.map(
            daysBeforeToMilliseconds
        );
        reminderDataToInsert.notify_before_schedules = schedulesInMs;
    } else if (reminderData.notify_before !== undefined) {
        // Legacy support: single notify_before value
        reminderDataToInsert.notify_before = reminderData.notify_before;
    }

    // Handle recurrence settings
    if (reminderData.recurrence_type) {
        reminderDataToInsert.recurrence_type = reminderData.recurrence_type;
    }
    if (reminderData.recurrence_interval) {
        reminderDataToInsert.recurrence_interval =
            reminderData.recurrence_interval;
    }
    if (reminderData.recurrence_end_date) {
        reminderDataToInsert.recurrence_end_date =
            reminderData.recurrence_end_date;
    }
    if (
        reminderData.notification_times &&
        reminderData.notification_times.length > 0
    ) {
        reminderDataToInsert.notification_times =
            reminderData.notification_times;
    }

    const { data: reminder, error: reminderError } = await supabase
        .from('reminders')
        .insert(reminderDataToInsert)
        .select()
        .single();

    if (reminderError || !reminder) {
        return { data: null, error: reminderError };
    }

    // Database trigger will automatically create notification entries
    return {
        data: reminder,
        error: null,
    };
}

/**
 * Update an existing reminder
 */
export async function updateReminder(
    reminderId: string,
    updates: Partial<CreateReminderData>
): Promise<{ data: Reminder | null; error: any }> {
    const timezone = detectUserTimezone();

    // Convert updates to reminders table format
    const reminderUpdates: any = {};

    if (updates.title) reminderUpdates.title = updates.title;
    if (updates.body) reminderUpdates.body = updates.body;
    if (updates.due_at) {
        const dueDate = new Date(updates.due_at + 'T00:00:00');
        reminderUpdates.due_at = dueDate.toISOString();
        reminderUpdates.wall_clock_time = extractWallClockTime(
            dueDate,
            timezone
        );
    }

    const { data, error } = await supabase
        .from('reminders')
        .update(reminderUpdates)
        .eq('id', reminderId)
        .select()
        .single();

    return { data, error };
}

/**
 * Delete a reminder (soft delete - set is_active to false)
 */
export async function deleteReminder(
    reminderId: string
): Promise<{ data: Reminder | null; error: any }> {
    const { data, error } = await supabase
        .from('reminders')
        .update({ is_active: false })
        .eq('id', reminderId)
        .select()
        .single();

    return { data, error };
}

/**
 * Permanently delete a reminder (hard delete)
 */
export async function permanentlyDeleteReminder(
    reminderId: string
): Promise<{ error: any }> {
    const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId);

    return { error };
}

/**
 * Get reminder by account ID
 * Note: Assumes reminders table has account_id column
 */
export async function getReminderByAccount(
    accountId: string
): Promise<{ data: ReminderWithSchedules | null; error: any }> {
    const { data: reminders, error: eventError } = await supabase
        .from('reminders')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .limit(1);

    if (eventError || !reminders || reminders.length === 0) {
        return { data: null, error: eventError };
    }

    const reminder = reminders[0] as any;

    return {
        data: {
            ...reminder,
            notification_schedules: [], // Reminders table stores notify_before directly
        },
        error: null,
    };
}

/**
 * Format a date to YYYY-MM-DD string
 * Preserves the local date (year-month-day) without timezone conversion
 */
export function formatDateForDB(date: Date): string {
    return dayjs(date).format('YYYY-MM-DD');
}

/**
 * Format a time to HH:MM:SS string
 * Preserves local time (no timezone conversion)
 */
export function formatTimeForDB(date: Date): string {
    return dayjs(date).format('HH:mm:ss');
}

/**
 * Parse HH:MM:SS string to time components
 */
export function parseTimeString(timeString: string): {
    hours: number;
    minutes: number;
    seconds: number;
} {
    const [hours, minutes, seconds = 0] = timeString.split(':').map(Number);
    return { hours, minutes, seconds };
}

/**
 * Get a human-readable recurrence description
 */
export function getRecurrenceDescription(event: Reminder): string {
    switch (event.recurrence_type) {
        case 'one_time':
            return 'One time';
        case 'monthly':
            // Parse date and extract day
            const day = dayjs(event.due_date).date();
            const suffix =
                day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
            return `Monthly on the ${day}${suffix}`;
        case 'weekly':
            // Parse date and get day name
            const dayName = dayjs(event.due_date).format('dddd');
            return `Every ${dayName}`;
        case 'custom':
            return `Every ${event.recurrence_interval} days`;
        default:
            return 'Unknown';
    }
}

/**
 * Get a human-readable notification schedule description
 */
export function getNotificationDescription(
    schedule: NotificationSchedule
): string {
    // Parse time and format in 12-hour format
    const timeStr = dayjs(schedule.notification_time, 'HH:mm:ss').format(
        'h:mm A'
    );

    if (schedule.days_before === 0) {
        return `On the day at ${timeStr}`;
    } else if (schedule.days_before === 1) {
        return `1 day before at ${timeStr}`;
    } else {
        return `${schedule.days_before} days before at ${timeStr}`;
    }
}
