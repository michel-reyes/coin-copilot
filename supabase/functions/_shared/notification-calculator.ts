/**
 * Notification Calculator
 *
 * Logic for calculating when notifications should be sent based on
 * event recurrence patterns and notification schedules
 */

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
}

/**
 * Parse ISO date string to Date (date only, no time)
 * Avoids timezone issues by parsing YYYY-MM-DD directly
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Calculate if an event should occur on a given date based on recurrence
 */
export function shouldEventOccurOnDate(
  event: Event,
  checkDate: Date
): boolean {
  const dueDate = parseDate(event.due_date); // Fix timezone issue
  const checkDateOnly = new Date(
    checkDate.getFullYear(),
    checkDate.getMonth(),
    checkDate.getDate()
  );
  const dueDateOnly = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate()
  );

  // Event hasn't started yet
  if (checkDateOnly < dueDateOnly) {
    return false;
  }

  switch (event.recurrence_type) {
    case 'one_time':
      return checkDateOnly.getTime() === dueDateOnly.getTime();

    case 'monthly':
      // Occurs on the same day of each month
      return checkDateOnly.getDate() === dueDateOnly.getDate();

    case 'weekly':
      // Occurs on the same day of week
      return checkDateOnly.getDay() === dueDateOnly.getDay();

    case 'custom':
      // Occurs every N days
      if (!event.recurrence_interval || event.recurrence_interval <= 0) {
        return false;
      }
      const daysSinceDue = Math.floor(
        (checkDateOnly.getTime() - dueDateOnly.getTime()) / (1000 * 60 * 60 * 24)
      );
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
  const dueDate = parseDate(event.due_date); // Fix timezone issue
  const checkDate = new Date(fromDate);

  // For one-time events, return due date if it's in the future
  if (event.recurrence_type === 'one_time') {
    return checkDate <= dueDate ? dueDate : null;
  }

  // For recurring events, find next occurrence within next 365 days
  for (let i = 0; i < 365; i++) {
    if (shouldEventOccurOnDate(event, checkDate)) {
      return checkDate;
    }
    checkDate.setDate(checkDate.getDate() + 1);
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
        schedule.notification_time
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
        });
      }
    }
  }

  return pending;
}

/**
 * Calculate the exact datetime to send a notification
 *
 * @param targetDate - The event occurrence date
 * @param daysBefore - How many days before the event to notify (0 = on the day)
 * @param notificationTime - Time of day in HH:MM:SS format
 * @returns Exact datetime to send notification
 */
export function calculateNotificationDatetime(
  targetDate: Date,
  daysBefore: number,
  notificationTime: string
): Date {
  const notificationDate = new Date(targetDate);
  notificationDate.setDate(notificationDate.getDate() - daysBefore);

  // Parse time (HH:MM:SS format)
  const [hours, minutes, seconds = '0'] = notificationTime.split(':').map(Number);

  notificationDate.setHours(hours, minutes, parseInt(seconds.toString()), 0);

  return notificationDate;
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
 * Format Date to ISO date string (YYYY-MM-DD)
 */
export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
