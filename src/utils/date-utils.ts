import dayjs from 'dayjs';
import 'dayjs/locale/en';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import updateLocale from 'dayjs/plugin/updateLocale';

/**
 * Constants
 */

dayjs.extend(customParseFormat);
dayjs.extend(updateLocale);
dayjs.locale('en');
dayjs.updateLocale('en', {
    weekStart: 1, // 1 = Monday, 7 = Sunday
});

export const NOW = dayjs();
export const TODAY = NOW.format('YYYY-MM-DD');
export const TODAY_DAY = NOW.date();
const FORMATTED_NOW = NOW.format('YYYY-MM-DD');
export const CURRENT_YEAR_MONTH = FORMATTED_NOW.slice(0, 7);
export const NEXT_SEVEN_DAYS = NOW.add(7, 'day').format('YYYY-MM-DD');
const LAST_5_MONTHS = NOW.subtract(5, 'month').format('YYYY-MM');

// Date ranges
export const CURRENT_MONTH_START_OF_WEEK =
    NOW.startOf('week').format('YYYY-MM-DD');
export const CURRENT_MONTH_END_OF_WEEK = NOW.endOf('week').format('YYYY-MM-DD');

export const CURRENT_MONTH_START_OF_NEXT_WEEK = NOW.add(1, 'week')
    .startOf('week')
    .format('YYYY-MM-DD');
export const CURRENT_MONTH_END_OF_NEXT_WEEK = NOW.add(1, 'week')
    .endOf('week')
    .format('YYYY-MM-DD');

export const CURRENT_MONTH_START = CURRENT_YEAR_MONTH + '-01';
export const CURRENT_MONTH_MIDDLE = CURRENT_YEAR_MONTH + '-15';
export const CURRENT_MONTH_END = NOW.endOf('month').format('YYYY-MM-DD');

export const LAST_5_MONTHS_START = LAST_5_MONTHS + '-01';
export const LAST_MONTH_START = NOW.subtract(1, 'month').format('YYYY-MM-01');
export const LAST_MONTH_END = NOW.subtract(1, 'month')
    .endOf('month')
    .format('YYYY-MM-DD');
export const LAST_MONTH_YEAR_MONTH = LAST_MONTH_START.slice(0, 7);
export const DAYS_IN_MONTH = NOW.daysInMonth();
export const LAST_15_DAYS = NOW.startOf('day')
    .subtract(15, 'day')
    .format('YYYY-MM-DD');

/**
 * Functions
 */

export function formatDate(
    date?: string | Date | null | dayjs.Dayjs,
    format: string = 'MM-DD-YYYY'
) {
    if (!date) return '';
    const parseDate = dayjs(date);
    if (!parseDate.isValid()) return '';
    return parseDate.format(format || 'MM-DD-YYYY');
}

export function getMonthRange(date: string, format = 'YYYY-MM-DD') {
    const newDate = dayjs(date);
    const start = newDate.startOf('month').format(format);
    const end = newDate.endOf('month').format(format);
    return { start, end };
}

export function nextMonth(prev: string, format = 'YYYY-MM-DD') {
    const newDate = dayjs(prev).add(1, 'month');
    const start = newDate.startOf('month').format(format);
    const end = newDate.endOf('month').format(format);
    return { start, end };
}

export function prevMonth(prev: string, format = 'YYYY-MM-DD') {
    const newDate = dayjs(prev).subtract(1, 'month');
    const start = newDate.startOf('month').format(format);
    const end = newDate.endOf('month').format(format);
    return { start, end };
}
