/**
 * Notification Schedules Configuration
 *
 * Developer-configurable notification schedules per reminder type.
 * Each reminder type can have multiple notification offsets (in days before due date).
 */

export interface NotificationScheduleConfig {
    days_before: number;
    label: string;
}

export type ReminderTypeKey = 'credit_card' | 'bill' | 'budget_review';

/**
 * Default notification schedules for each reminder type.
 * Modify these during development to adjust notification timing.
 *
 * days_before: Number of days before the due date to send notification
 *              - 0 = day of the due date
 *              - 1 = 1 day before
 *              - 7 = 1 week before
 */
export const NOTIFICATION_SCHEDULES: Record<
    ReminderTypeKey,
    NotificationScheduleConfig[]
> = {
    credit_card: [
        { days_before: 7, label: '7 days before' },
        { days_before: 3, label: '3 days before' },
        { days_before: 0, label: 'Day of' },
    ],
    bill: [
        { days_before: 7, label: '1 week before' },
        { days_before: 1, label: '1 day before' },
    ],
    budget_review: [{ days_before: 0, label: 'Day of' }],
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
