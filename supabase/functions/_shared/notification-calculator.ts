/**
 * Notification Calculator
 *
 * Logic for calculating when notifications should be sent based on
 * event recurrence patterns and notification schedules
 *
 * Uses dayjs for timezone-aware date/time calculations
 */

import dayjs from 'https://esm.sh/dayjs@1.11.10';
import utc from 'https://esm.sh/dayjs@1.11.10/plugin/utc';
import timezone from 'https://esm.sh/dayjs@1.11.10/plugin/timezone';

// Configure dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

export type RecurrenceType = 'monthly' | 'weekly' | 'custom' | 'one_time';

export interface Event {
  id: string;
  user_id: string;
  event_type: string;
  title: string;
  description?: string;
  due_date: string; // ISO date string
  recurrence_type: RecurrenceType;
  recurrence_interval?: number;
  is_active: boolean;
  user_timezone?: string; // IANA timezone from user_api_keys table
}

export interface NotificationSchedule {
  id: string;
  event_id: string;
  notification_time: string; // HH:MM:SS format
  days_before: number;
  is_active: boolean;
}

export interface PendingNotification {
  event: Event;
  schedule: NotificationSchedule;
  target_date: Date; // The actual event occurrence date
  notification_datetime: Date; // When to send the notification
  user_timezone?: string; // User's IANA timezone (e.g., 'America/New_York')
}

/**
 * Parse ISO date string to Date (date only, no time)
 * Uses UTC to avoid timezone issues
 */
export function parseDate(dateString: string): Date {
  return dayjs.utc(dateString, 'YYYY-MM-DD').toDate();
}

/**
 * Calculate if an event should occur on a given date based on recurrence
 */
export function shouldEventOccurOnDate(
  event: Event,
  checkDate: Date
): boolean {
  const dueDate = dayjs.utc(event.due_date);
  const checkDateUtc = dayjs.utc(checkDate).startOf('day');
  const dueDateUtc = dueDate.startOf('day');

  // Event hasn't started yet
  if (checkDateUtc.isBefore(dueDateUtc)) {
    return false;
  }

  switch (event.recurrence_type) {
    case 'one_time':
      return checkDateUtc.isSame(dueDateUtc, 'day');

    case 'monthly':
      // Occurs on the same day of each month
      return checkDateUtc.date() === dueDateUtc.date();

    case 'weekly':
      // Occurs on the same day of week
      return checkDateUtc.day() === dueDateUtc.day();

    case 'custom':
      // Occurs every N days
      if (!event.recurrence_interval || event.recurrence_interval <= 0) {
        return false;
      }
      const daysSinceDue = checkDateUtc.diff(dueDateUtc, 'day');
      return daysSinceDue % event.recurrence_interval === 0;

    default:
      return false;
  }
}

/**
 * Get the next occurrence date for an event (on or after a given date)
 */
export function getNextOccurrence(
  event: Event,
  fromDate: Date = new Date()
): Date | null {
  const dueDate = dayjs.utc(event.due_date);

  // For one-time events, always return the due date
  // The caller (edge function) will filter by time window (24-hour catchup)
  // This allows notifications to be sent for events created after their due date
  if (event.recurrence_type === 'one_time') {
    return dueDate.toDate();
  }

  // For recurring events, find next occurrence within next 365 days
  let checkDate = dayjs.utc(fromDate).startOf('day');
  for (let i = 0; i < 365; i++) {
    if (shouldEventOccurOnDate(event, checkDate.toDate())) {
      return checkDate.toDate();
    }
    checkDate = checkDate.add(1, 'day');
  }

  return null; // No occurrence found in next year
}

/**
 * Calculate pending notifications for a given time window
 *
 * @param events - Active events
 * @param schedules - Active notification schedules
 * @param windowStart - Start of time window to check
 * @param windowEnd - End of time window to check
 * @returns Array of pending notifications to send
 */
export function calculatePendingNotifications(
  events: Event[],
  schedules: NotificationSchedule[],
  windowStart: Date,
  windowEnd: Date
): PendingNotification[] {
  const pending: PendingNotification[] = [];

  // Group schedules by event_id for efficient lookup
  const schedulesByEvent = new Map<string, NotificationSchedule[]>();
  for (const schedule of schedules) {
    if (!schedule.is_active) continue;

    const eventSchedules = schedulesByEvent.get(schedule.event_id) || [];
    eventSchedules.push(schedule);
    schedulesByEvent.set(schedule.event_id, eventSchedules);
  }

  // Check each event
  for (const event of events) {
    if (!event.is_active) continue;

    const eventSchedules = schedulesByEvent.get(event.id);
    if (!eventSchedules || eventSchedules.length === 0) continue;

    // Find next occurrence of this event
    const nextOccurrence = getNextOccurrence(event, windowStart);
    if (!nextOccurrence) continue;

    // For each notification schedule, calculate when to send
    for (const schedule of eventSchedules) {
      const notificationDatetime = calculateNotificationDatetime(
        nextOccurrence,
        schedule.days_before,
        schedule.notification_time,
        event.user_timezone || 'UTC' // Use user's timezone or default to UTC
      );

      // Check if notification falls within our time window
      if (
        notificationDatetime >= windowStart &&
        notificationDatetime < windowEnd
      ) {
        pending.push({
          event,
          schedule,
          target_date: nextOccurrence,
          notification_datetime: notificationDatetime,
          user_timezone: event.user_timezone,
        });
      }
    }
  }

  return pending;
}

/**
 * Calculate the exact datetime to send a notification
 *
 * @param targetDate - The event occurrence date (in UTC)
 * @param daysBefore - How many days before the event to notify (0 = on the day)
 * @param notificationTime - Time of day in HH:MM:SS format (in user's timezone)
 * @param userTimezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns Exact datetime to send notification (in UTC)
 */
export function calculateNotificationDatetime(
  targetDate: Date,
  daysBefore: number,
  notificationTime: string,
  userTimezone: string = 'UTC'
): Date {
  // Get the target date and subtract days_before
  const targetDateUtc = dayjs.utc(targetDate).startOf('day');
  const notificationDateUtc = targetDateUtc.subtract(daysBefore, 'day');

  // Parse time (HH:MM:SS format)
  const [hours, minutes, seconds = 0] = notificationTime.split(':').map(Number);

  // Create notification datetime in user's timezone
  // This interprets "08:00:00" as 8 AM in user's local time, not UTC
  const notificationDateInUserTz = dayjs.tz(
    notificationDateUtc.format('YYYY-MM-DD'),
    userTimezone
  ).hour(hours).minute(minutes).second(seconds);

  // Convert back to UTC for storage and comparison
  return notificationDateInUserTz.utc().toDate();
}

/**
 * Format a notification message based on event and schedule
 */
export function formatNotificationMessage(
  event: Event,
  schedule: NotificationSchedule,
  targetDate: Date
): { title: string; body: string } {
  const dateStr = targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  let title = event.title;
  let body = '';

  if (schedule.days_before === 0) {
    body = `Due today - ${dateStr}`;
  } else if (schedule.days_before === 1) {
    body = `Due tomorrow - ${dateStr}`;
  } else {
    body = `Due in ${schedule.days_before} days - ${dateStr}`;
  }

  if (event.description) {
    body += `\n${event.description}`;
  }

  return { title, body };
}

/**
 * Format Date to ISO date string (YYYY-MM-DD) in UTC
 */
export function formatISODate(date: Date): string {
  return dayjs.utc(date).format('YYYY-MM-DD');
}
