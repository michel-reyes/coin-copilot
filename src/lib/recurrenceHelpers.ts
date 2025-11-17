/**
 * Recurrence Helpers
 *
 * Client-side utilities for calculating recurring reminder dates
 * and managing recurrence logic.
 */

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { RecurrenceType } from './notificationSchedules';

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Calculate the next due date based on recurrence rules.
 *
 * @param currentDueDate - Current due date (YYYY-MM-DD format)
 * @param recurrenceType - Type of recurrence
 * @param recurrenceInterval - Custom interval in days (for 'custom' type)
 * @returns Next due date in YYYY-MM-DD format, or null for one-time
 *
 * @example
 * calculateNextDueDate('2025-01-15', 'monthly') // Returns '2025-02-15'
 * calculateNextDueDate('2025-01-31', 'monthly') // Returns '2025-02-28' (or Feb 29 in leap year)
 * calculateNextDueDate('2025-01-15', 'weekly') // Returns '2025-01-22'
 * calculateNextDueDate('2025-01-15', 'custom', 10) // Returns '2025-01-25'
 */
export function calculateNextDueDate(
    currentDueDate: string,
    recurrenceType: RecurrenceType,
    recurrenceInterval?: number
): string | null {
    const current = dayjs(currentDueDate);

    switch (recurrenceType) {
        case 'daily':
            return current.add(1, 'day').format('YYYY-MM-DD');

        case 'weekly':
            return current.add(7, 'days').format('YYYY-MM-DD');

        case 'bi_weekly':
            return current.add(14, 'days').format('YYYY-MM-DD');

        case 'monthly':
            // dayjs handles month-end edge cases automatically
            // e.g., Jan 31 + 1 month = Feb 28/29 (last day of Feb)
            return current.add(1, 'month').format('YYYY-MM-DD');

        case 'custom':
            if (!recurrenceInterval || recurrenceInterval <= 0) {
                console.error(
                    'recurrenceInterval must be positive for custom recurrence type'
                );
                return null;
            }
            return current.add(recurrenceInterval, 'days').format('YYYY-MM-DD');

        case 'one_time':
        default:
            return null;
    }
}

/**
 * Check if a recurrence type represents a recurring reminder.
 *
 * @param recurrenceType - Type of recurrence
 * @returns True if recurring, false if one-time
 */
export function isRecurringType(recurrenceType: RecurrenceType): boolean {
    return recurrenceType !== 'one_time';
}

/**
 * Get a human-readable description of the recurrence pattern.
 *
 * @param recurrenceType - Type of recurrence
 * @param recurrenceInterval - Custom interval (for 'custom' type)
 * @returns Human-readable description
 *
 * @example
 * getRecurrenceDescription('monthly') // Returns 'Monthly'
 * getRecurrenceDescription('weekly') // Returns 'Weekly'
 * getRecurrenceDescription('custom', 10) // Returns 'Every 10 days'
 */
export function getRecurrenceDescription(
    recurrenceType: RecurrenceType,
    recurrenceInterval?: number
): string {
    switch (recurrenceType) {
        case 'daily':
            return 'Daily';
        case 'weekly':
            return 'Weekly';
        case 'bi_weekly':
            return 'Every 2 weeks';
        case 'monthly':
            return 'Monthly';
        case 'custom':
            if (recurrenceInterval) {
                return `Every ${recurrenceInterval} day${recurrenceInterval > 1 ? 's' : ''}`;
            }
            return 'Custom';
        case 'one_time':
        default:
            return 'One-time';
    }
}

/**
 * Validate recurrence configuration.
 *
 * @param recurrenceType - Type of recurrence
 * @param recurrenceInterval - Custom interval (required for 'custom' type)
 * @param recurrenceEndDate - Optional end date
 * @returns Validation result with error message if invalid
 */
export function validateRecurrence(
    recurrenceType: RecurrenceType,
    recurrenceInterval?: number,
    recurrenceEndDate?: string
): { valid: boolean; error?: string } {
    // Validate custom type has interval
    if (recurrenceType === 'custom') {
        if (!recurrenceInterval || recurrenceInterval <= 0) {
            return {
                valid: false,
                error: 'Custom recurrence type requires a positive interval',
            };
        }
    }

    // Validate end date is in the future
    if (recurrenceEndDate) {
        const endDate = dayjs(recurrenceEndDate);
        if (!endDate.isValid()) {
            return {
                valid: false,
                error: 'Invalid recurrence end date format',
            };
        }
        if (endDate.isBefore(dayjs(), 'day')) {
            return {
                valid: false,
                error: 'Recurrence end date must be in the future',
            };
        }
    }

    return { valid: true };
}

/**
 * Calculate the number of occurrences between start and end date.
 * Useful for estimating how many times a reminder will trigger.
 *
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param recurrenceType - Type of recurrence
 * @param recurrenceInterval - Custom interval (for 'custom' type)
 * @returns Approximate number of occurrences
 */
export function estimateOccurrences(
    startDate: string,
    endDate: string,
    recurrenceType: RecurrenceType,
    recurrenceInterval?: number
): number {
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
        return 0;
    }

    const daysDiff = end.diff(start, 'days');

    switch (recurrenceType) {
        case 'daily':
            return daysDiff;
        case 'weekly':
            return Math.floor(daysDiff / 7);
        case 'bi_weekly':
            return Math.floor(daysDiff / 14);
        case 'monthly':
            return end.diff(start, 'months');
        case 'custom':
            if (recurrenceInterval && recurrenceInterval > 0) {
                return Math.floor(daysDiff / recurrenceInterval);
            }
            return 0;
        case 'one_time':
        default:
            return 1;
    }
}

/**
 * Check if a reminder should continue recurring based on end date.
 *
 * @param currentDueDate - Current due date
 * @param recurrenceEndDate - Optional end date for recurrence
 * @returns True if should continue, false if recurrence should end
 */
export function shouldContinueRecurring(
    currentDueDate: string,
    recurrenceEndDate?: string
): boolean {
    if (!recurrenceEndDate) {
        return true; // No end date means infinite recurrence
    }

    const dueDate = dayjs(currentDueDate);
    const endDate = dayjs(recurrenceEndDate);

    return dueDate.isBefore(endDate, 'day') || dueDate.isSame(endDate, 'day');
}
