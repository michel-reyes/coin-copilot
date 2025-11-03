/**
 * Events API
 *
 * Client-side utilities for managing recurring events and notification schedules
 */

import { supabase } from './supabase';

export type EventType = 'bill' | 'credit_card' | 'budget_review';
export type RecurrenceType = 'monthly' | 'weekly' | 'custom' | 'one_time';

export interface Event {
  id: string;
  user_id: string;
  event_type: EventType;
  title: string;
  description?: string;
  due_date: string; // ISO date string (YYYY-MM-DD)
  recurrence_type: RecurrenceType;
  recurrence_interval?: number; // For custom recurrence
  is_active: boolean;
  account_id?: string; // Optional link to Lunch Money account
  institution_name?: string; // Optional institution name for account identification
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

export interface EventWithSchedules extends Event {
  notification_schedules: NotificationSchedule[];
}

export interface CreateEventData {
  event_type: EventType;
  title: string;
  description?: string;
  due_date: string; // YYYY-MM-DD
  recurrence_type: RecurrenceType;
  recurrence_interval?: number;
  account_id?: string;
  institution_name?: string;
}

export interface CreateNotificationScheduleData {
  notification_time: string; // HH:MM:SS
  days_before: number;
}

/**
 * Fetch all events for the current user
 */
export async function getEvents(options?: {
  includeInactive?: boolean;
  eventType?: EventType;
}): Promise<{ data: Event[] | null; error: any }> {
  let query = supabase
    .from('events')
    .select('*')
    .order('due_date', { ascending: true });

  if (!options?.includeInactive) {
    query = query.eq('is_active', true);
  }

  if (options?.eventType) {
    query = query.eq('event_type', options.eventType);
  }

  return await query;
}

/**
 * Fetch a single event by ID with its notification schedules
 */
export async function getEventById(
  eventId: string
): Promise<{ data: EventWithSchedules | null; error: any }> {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(`
      *,
      event_notification_schedules(*)
    `)
    .eq('id', eventId)
    .eq('event_notification_schedules.is_active', true)
    .order('days_before', { ascending: false, referencedTable: 'event_notification_schedules' })
    .single();

  if (eventError || !event) {
    return { data: null, error: eventError };
  }

  const eventData = event as any;

  return {
    data: {
      ...eventData,
      notification_schedules: eventData.event_notification_schedules || [],
    },
    error: null,
  };
}

/**
 * Create a new event with optional notification schedules
 */
export async function createEvent(
  eventData: CreateEventData,
  notificationSchedules?: CreateNotificationScheduleData[]
): Promise<{ data: EventWithSchedules | null; error: any }> {
  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Create the event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      user_id: user.id,
      ...eventData,
      is_active: true,
    })
    .select()
    .single();

  if (eventError || !event) {
    return { data: null, error: eventError };
  }

  // Create notification schedules if provided
  let schedules: NotificationSchedule[] = [];

  if (notificationSchedules && notificationSchedules.length > 0) {
    const { data: createdSchedules, error: schedulesError } = await supabase
      .from('event_notification_schedules')
      .insert(
        notificationSchedules.map((schedule) => ({
          event_id: event.id,
          ...schedule,
          is_active: true,
        }))
      )
      .select();

    if (schedulesError) {
      // Event was created but schedules failed - still return the event
      console.error('Error creating notification schedules:', schedulesError);
    } else {
      schedules = createdSchedules || [];
    }
  }

  return {
    data: {
      ...event,
      notification_schedules: schedules,
    },
    error: null,
  };
}

/**
 * Update an existing event
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<CreateEventData>
): Promise<{ data: Event | null; error: any }> {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete an event (soft delete - set is_active to false)
 */
export async function deleteEvent(
  eventId: string
): Promise<{ data: Event | null; error: any }> {
  const { data, error } = await supabase
    .from('events')
    .update({ is_active: false })
    .eq('id', eventId)
    .select()
    .single();

  return { data, error };
}

/**
 * Permanently delete an event (hard delete)
 */
export async function permanentlyDeleteEvent(
  eventId: string
): Promise<{ error: any }> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);

  return { error };
}

/**
 * Add a notification schedule to an event
 */
export async function addNotificationSchedule(
  eventId: string,
  schedule: CreateNotificationScheduleData
): Promise<{ data: NotificationSchedule | null; error: any }> {
  const { data, error } = await supabase
    .from('event_notification_schedules')
    .insert({
      event_id: eventId,
      ...schedule,
      is_active: true,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update a notification schedule
 */
export async function updateNotificationSchedule(
  scheduleId: string,
  updates: Partial<CreateNotificationScheduleData>
): Promise<{ data: NotificationSchedule | null; error: any }> {
  const { data, error } = await supabase
    .from('event_notification_schedules')
    .update(updates)
    .eq('id', scheduleId)
    .select()
    .single();

  return { data, error };
}

/**
 * Remove a notification schedule (soft delete)
 */
export async function removeNotificationSchedule(
  scheduleId: string
): Promise<{ data: NotificationSchedule | null; error: any }> {
  const { data, error } = await supabase
    .from('event_notification_schedules')
    .update({ is_active: false })
    .eq('id', scheduleId)
    .select()
    .single();

  return { data, error };
}

/**
 * Permanently delete a notification schedule
 */
export async function permanentlyDeleteNotificationSchedule(
  scheduleId: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('event_notification_schedules')
    .delete()
    .eq('id', scheduleId);

  return { error };
}

/**
 * Get notification queue/history for debugging
 */
export async function getNotificationHistory(options?: {
  eventId?: string;
  limit?: number;
}): Promise<{ data: any[] | null; error: any }> {
  let query = supabase
    .from('notification_queue')
    .select(
      `
      *,
      events (
        title,
        event_type
      )
    `
    )
    .order('created_at', { ascending: false });

  if (options?.eventId) {
    query = query.eq('event_id', options.eventId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  return await query;
}

/**
 * Get event by account ID and institution name
 */
export async function getEventByAccount(
  accountId: string,
  institutionName: string
): Promise<{ data: EventWithSchedules | null; error: any }> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select(`
      *,
      event_notification_schedules(*)
    `)
    .eq('account_id', accountId)
    .eq('institution_name', institutionName)
    .eq('is_active', true)
    .eq('event_notification_schedules.is_active', true)
    .order('days_before', { ascending: false, referencedTable: 'event_notification_schedules' })
    .limit(1);

  if (eventError || !events || events.length === 0) {
    return { data: null, error: eventError };
  }

  const event = events[0] as any;

  return {
    data: {
      ...event,
      notification_schedules: event.event_notification_schedules || [],
    },
    error: null,
  };
}

/**
 * Update or create a credit card event for an account
 */
export async function updateOrCreateCreditCardEvent(
  accountId: string,
  institutionName: string,
  accountDisplayName: string,
  dueDay: number
): Promise<{ data: EventWithSchedules | null; error: any }> {
  // Calculate due date: current year/month with the specified day
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const dueDate = new Date(year, month, dueDay);
  const dueDateString = formatDateForDB(dueDate);

  const eventData: CreateEventData = {
    event_type: 'credit_card',
    title: `${accountDisplayName} Payment Due`,
    due_date: dueDateString,
    recurrence_type: 'monthly',
    account_id: accountId,
    institution_name: institutionName,
  };

  const notificationSchedules: CreateNotificationScheduleData[] = [
    { days_before: 7, notification_time: '09:00:00' },
    { days_before: 0, notification_time: '08:00:00' },
  ];

  // Check if event already exists
  const { data: existingEvent } = await getEventByAccount(
    accountId,
    institutionName
  );

  if (existingEvent) {
    // Update existing event
    const { data: updatedEvent, error: updateError } = await updateEvent(
      existingEvent.id,
      {
        title: eventData.title,
        due_date: eventData.due_date,
        recurrence_type: eventData.recurrence_type,
      }
    );

    if (updateError || !updatedEvent) {
      return { data: null, error: updateError };
    }

    // Return updated event with existing schedules (schedules unchanged)
    return {
      data: {
        ...updatedEvent,
        notification_schedules: existingEvent.notification_schedules,
      },
      error: null,
    };
  } else {
    // Create new event
    return await createEvent(eventData, notificationSchedules);
  }
}

/**
 * Delete event by account ID and institution name (soft delete)
 */
export async function deleteEventByAccount(
  accountId: string,
  institutionName: string
): Promise<{ data: Event | null; error: any }> {
  // Directly update to soft-delete in single query
  const { data, error } = await supabase
    .from('events')
    .update({ is_active: false })
    .eq('account_id', accountId)
    .eq('institution_name', institutionName)
    .eq('is_active', true) // Only delete if currently active
    .select()
    .single();

  // If no rows affected, return null (event doesn't exist or already deleted)
  if (error?.code === 'PGRST116') {
    return { data: null, error: null };
  }

  return { data, error };
}

/**
 * Format a date to YYYY-MM-DD string
 */
export function formatDateForDB(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a time to HH:MM:SS string
 */
export function formatTimeForDB(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = '00';
  return `${hours}:${minutes}:${seconds}`;
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
export function getRecurrenceDescription(event: Event): string {
  switch (event.recurrence_type) {
    case 'one_time':
      return 'One time';
    case 'monthly':
      // Parse date string manually to avoid timezone issues
      const [, , dayStr] = event.due_date.split('-');
      const day = parseInt(dayStr, 10);
      const suffix =
        day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
      return `Monthly on the ${day}${suffix}`;
    case 'weekly':
      // Parse date as UTC to avoid timezone shifts
      const [year, month, dayOfMonth] = event.due_date.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
      const dayName = date.toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'UTC',
      });
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
export function getNotificationDescription(schedule: NotificationSchedule): string {
  const { hours, minutes } = parseTimeString(schedule.notification_time);
  const timeStr = new Date(0, 0, 0, hours, minutes).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (schedule.days_before === 0) {
    return `On the day at ${timeStr}`;
  } else if (schedule.days_before === 1) {
    return `1 day before at ${timeStr}`;
  } else {
    return `${schedule.days_before} days before at ${timeStr}`;
  }
}
