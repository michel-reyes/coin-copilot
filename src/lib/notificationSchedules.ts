/**
 * Notification Schedules Configuration
 *
 * Developer-configurable notification schedules per reminder type.
 * Each reminder type can have multiple notification offsets (in days before due date)
 * and multiple notification times per day.
 */

export interface NotificationScheduleConfig {
    days_before: number;
    label: string;
    times?: string[]; // Optional: specific times for notifications (e.g., ['09:00', '13:00', '17:00'])
}

export type ReminderTypeKey = 'credit_card' | 'bill' | 'budget_review';

export type RecurrenceType =
    | 'one_time'
    | 'daily'
    | 'weekly'
    | 'bi_weekly'
    | 'monthly'
    | 'custom';

/**
 * Default notification schedules for each reminder type.
 * Modify these during development to adjust notification timing.
 *
 * days_before: Number of days before the due date to send notification
 *              - 0 = day of the due date
 *              - 1 = 1 day before
 *              - 7 = 1 week before
 * times: Optional array of specific times to send notifications (24-hour format)
 *        - If omitted, uses default time from wall_clock_time
 *        - Example: ['09:00', '13:00', '17:00'] sends 3 notifications at 9 AM, 1 PM, and 5 PM
 */
export const NOTIFICATION_SCHEDULES: Record<
    ReminderTypeKey,
    NotificationScheduleConfig[]
> = {
    credit_card: [
        { days_before: 7, label: '7 days before', times: ['09:00'] },
        { days_before: 3, label: '3 days before', times: ['09:00'] },
        { days_before: 0, label: 'Day of', times: ['09:00'] },
    ],
    bill: [
        { days_before: 7, label: '1 week before', times: ['09:00'] },
        { days_before: 1, label: '1 day before', times: ['09:00'] },
    ],
    budget_review: [
        { days_before: 0, label: 'Day of', times: ['09:00', '13:00', '17:00'] },
    ],
};

/**
 * Recurrence patterns for each reminder type.
 * Determines how often reminders should auto-regenerate after completion.
 *
 * - 'one_time': No recurrence, reminder expires after notifications sent
 * - 'daily': Regenerate every day
 * - 'weekly': Regenerate every 7 days
 * - 'bi_weekly': Regenerate every 14 days
 * - 'monthly': Regenerate on the same day each month (handles month-end edge cases)
 * - 'custom': Use recurrence_interval to specify custom day interval
 */
export const RECURRENCE_PATTERNS: Record<ReminderTypeKey, RecurrenceType> = {
    credit_card: 'monthly', // Credit card payments recur monthly
    bill: 'monthly', // Bills typically recur monthly
    budget_review: 'monthly', // Budget reviews happen monthly
};

/**
 * Get the notification schedule for a specific reminder type.
 * Returns an array of days_before values (e.g., [7, 3, 0] for credit cards).
 *
 * @param reminderType - The type of reminder
 * @returns Array of days before due date to send notifications
 */
export function getNotificationSchedule(
    reminderType: ReminderTypeKey
): number[] {
    const schedules = NOTIFICATION_SCHEDULES[reminderType];
    if (!schedules) {
        console.warn(
            `No notification schedule found for reminder type: ${reminderType}. Using default [0].`
        );
        return [0]; // Default to day-of notification
    }
    return schedules.map((s) => s.days_before);
}

/**
 * Get the full schedule configuration for a reminder type (including labels).
 *
 * @param reminderType - The type of reminder
 * @returns Array of notification schedule configurations
 */
export function getNotificationScheduleConfig(
    reminderType: ReminderTypeKey
): NotificationScheduleConfig[] {
    return (
        NOTIFICATION_SCHEDULES[reminderType] || [
            { days_before: 0, label: 'Day of' },
        ]
    );
}

/**
 * Convert days_before to milliseconds for database storage.
 * Used when the database expects notification offset in milliseconds.
 *
 * @param days_before - Number of days before due date
 * @returns Milliseconds equivalent
 */
export function daysBeforeToMilliseconds(days_before: number): number {
    return days_before * 24 * 60 * 60 * 1000;
}

/**
 * Convert milliseconds to days_before.
 * Used when reading from database that stores offset in milliseconds.
 *
 * @param milliseconds - Milliseconds offset
 * @returns Days before due date
 */
export function millisecondsToDaysBefore(milliseconds: number): number {
    return Math.floor(milliseconds / (24 * 60 * 60 * 1000));
}

/**
 * Get the recurrence pattern for a specific reminder type.
 *
 * @param reminderType - The type of reminder
 * @returns Recurrence type ('one_time', 'daily', 'weekly', 'monthly', etc.)
 */
export function getRecurrencePattern(
    reminderType: ReminderTypeKey
): RecurrenceType {
    return RECURRENCE_PATTERNS[reminderType] || 'one_time';
}

/**
 * Check if a reminder type is configured for recurring reminders.
 *
 * @param reminderType - The type of reminder
 * @returns True if the reminder type recurs, false if one-time
 */
export function isRecurring(reminderType: ReminderTypeKey): boolean {
    return getRecurrencePattern(reminderType) !== 'one_time';
}

/**
 * Get notification times for a specific reminder type.
 * Extracts all times configured across all schedule entries.
 *
 * @param reminderType - The type of reminder
 * @returns Array of unique notification times in 24-hour format (e.g., ['09:00', '13:00'])
 */
export function getNotificationTimes(reminderType: ReminderTypeKey): string[] {
    const schedules = NOTIFICATION_SCHEDULES[reminderType];
    if (!schedules) return [];

    const timesSet = new Set<string>();
    schedules.forEach((schedule) => {
        if (schedule.times) {
            schedule.times.forEach((time) => timesSet.add(time));
        }
    });

    return Array.from(timesSet).sort();
}
