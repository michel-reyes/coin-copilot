import { Transaction } from '@/api/types/apiTypes';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

/**
 * Single data point for expenditure chart
 */
export interface ExpenditureDataPoint {
  date: string;
  dailyExpenditure: number; // Raw daily total (grey dashed line - "noise")
  trendExpenditure: number; // 7-day rolling avg (orange line - "signal")
}

/**
 * Result of expenditure calculation with metrics
 */
export interface ExpenditureResult {
  data: ExpenditureDataPoint[];
  currentTrend: number; // Latest trend value
  previousTrend: number; // Week-ago trend value
  delta: number; // Change vs last week (currentTrend - previousTrend)
  averageExpenditure: number; // Period average daily expenditure
  totalExpenditure: number; // Total spending in the period
  dateRange: {
    start: string;
    end: string;
  };
}

// ------------------------------------------------------------------
// Helper Functions
// ------------------------------------------------------------------

/**
 * Generates an array of all dates between start and end (inclusive)
 */
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Groups transactions by date and sums expense amounts
 * Only includes non-income transactions that aren't excluded
 */
function aggregateDailyExpenses(
  transactions: Transaction[]
): Map<string, number> {
  const dailyTotals = new Map<string, number>();

  for (const tx of transactions) {
    // Skip income transactions and excluded transactions
    if (tx.is_income || tx.exclude_from_totals) {
      continue;
    }

    const date = tx.date;
    const amount = Math.abs(tx.to_base); // Use absolute value for expenses

    const currentTotal = dailyTotals.get(date) || 0;
    dailyTotals.set(date, currentTotal + amount);
  }

  return dailyTotals;
}

/**
 * Calculates 7-day rolling average for trend smoothing
 * Uses exponential moving average (EMA) for smoother results
 */
function calculateRollingAverage(
  values: number[],
  windowSize: number = 7
): number[] {
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = values.slice(start, i + 1);
    const sum = window.reduce((acc, val) => acc + val, 0);
    const avg = sum / window.length;
    result.push(avg);
  }

  return result;
}

// ------------------------------------------------------------------
// Main Function
// ------------------------------------------------------------------

/**
 * Calculates expenditure data from transactions for chart visualization
 *
 * This implements a MacroFactor-style expenditure tracking:
 * - Daily Expenditure (Noise): Raw sum of expenses per day
 * - Trend Expenditure (Signal): 7-day rolling average
 *
 * @param transactions - Array of transactions to process
 * @param options - Optional configuration
 * @returns ExpenditureResult with chart data and metrics
 */
export function calculateExpenditure(
  transactions: Transaction[],
  options?: {
    startDate?: string;
    endDate?: string;
    windowSize?: number; // Rolling average window (default: 7)
  }
): ExpenditureResult {
  const windowSize = options?.windowSize ?? 7;

  // Filter to only expense transactions (not income, not excluded)
  const expenseTransactions = transactions.filter(
    (tx) => !tx.is_income && !tx.exclude_from_totals
  );

  if (expenseTransactions.length === 0) {
    return {
      data: [],
      currentTrend: 0,
      previousTrend: 0,
      delta: 0,
      averageExpenditure: 0,
      totalExpenditure: 0,
      dateRange: { start: '', end: '' },
    };
  }

  // Determine date range from transactions or options
  const sortedDates = expenseTransactions
    .map((tx) => tx.date)
    .sort((a, b) => a.localeCompare(b));

  const startDate = options?.startDate ?? sortedDates[0];
  const endDate = options?.endDate ?? sortedDates[sortedDates.length - 1];

  // Aggregate daily expenses
  const dailyTotals = aggregateDailyExpenses(expenseTransactions);

  // Generate complete date range (fill gaps with $0)
  const allDates = generateDateRange(startDate, endDate);

  // Build array of daily expenditures (with zeros for missing days)
  const dailyValues = allDates.map((date) => dailyTotals.get(date) || 0);

  // Calculate rolling average for trend line
  const trendValues = calculateRollingAverage(dailyValues, windowSize);

  // Build result data points
  const data: ExpenditureDataPoint[] = allDates.map((date, index) => ({
    date,
    dailyExpenditure: Math.round(dailyValues[index] * 100) / 100,
    trendExpenditure: Math.round(trendValues[index] * 100) / 100,
  }));

  // Calculate metrics
  const totalExpenditure = dailyValues.reduce((sum, val) => sum + val, 0);
  const averageExpenditure = totalExpenditure / dailyValues.length;

  // Current trend (latest value)
  const currentTrend = trendValues[trendValues.length - 1] || 0;

  // Previous trend (7 days ago, or earliest available)
  const prevIndex = Math.max(0, trendValues.length - 8);
  const previousTrend = trendValues[prevIndex] || currentTrend;

  // Delta (change vs last week)
  const delta = currentTrend - previousTrend;

  return {
    data,
    currentTrend: Math.round(currentTrend * 100) / 100,
    previousTrend: Math.round(previousTrend * 100) / 100,
    delta: Math.round(delta * 100) / 100,
    averageExpenditure: Math.round(averageExpenditure * 100) / 100,
    totalExpenditure: Math.round(totalExpenditure * 100) / 100,
    dateRange: { start: startDate, end: endDate },
  };
}

// ------------------------------------------------------------------
// Utility Functions for Period Filtering
// ------------------------------------------------------------------

/**
 * Filters transactions to a specific date range
 */
export function filterTransactionsByDateRange(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] {
  return transactions.filter((tx) => tx.date >= startDate && tx.date <= endDate);
}

/**
 * Gets transactions for the last N days
 */
export function getLastNDaysTransactions(
  transactions: Transaction[],
  days: number
): Transaction[] {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  return filterTransactionsByDateRange(transactions, startStr, endStr);
}

/**
 * Gets transactions for a specific month (format: YYYY-MM)
 */
export function getMonthTransactions(
  transactions: Transaction[],
  yearMonth: string
): Transaction[] {
  const [year, month] = yearMonth.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  return filterTransactionsByDateRange(transactions, startStr, endStr);
}

/**
 * Gets transactions for last two months (as specified in requirements)
 */
export function getLastTwoMonthsTransactions(
  transactions: Transaction[]
): Transaction[] {
  const today = new Date();
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const startStr = twoMonthsAgo.toISOString().split('T')[0];
  const endStr = today.toISOString().split('T')[0];

  return filterTransactionsByDateRange(transactions, startStr, endStr);
}

