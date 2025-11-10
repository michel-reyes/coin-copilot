import { BudgetItem } from '@/api/types/apiTypes';
import { YearMonth } from '@/api/types/queryTypes';
import { CURRENT_YEAR_MONTH } from '@/utils/date-utils';

// ------------------------------------------------------------------

export type BudgetSummaryTotals = {
  income: {
    plannedSpending: number;
    actualSpending: number;
    availableSpending: number;
  };
  expense: {
    plannedSpending: number;
    actualSpending: number;
    availableSpending: number;
  };
};

/**
 * Interface for budget data values
 */
export interface BudgetDataValue {
  num_transactions?: number;
  spending_to_base?: number;
  budget_to_base?: number;
  budget_amount?: number;
  budget_currency?: string;
}

/**
 * Interface for budget data by date
 */
export interface BudgetData {
  [date: string]: BudgetDataValue;
}

// ------------------------------------------------------------------

/**
 * Processes budget data within a specific date range and applies a callback function to each entry
 *
 * @param budgetData The budget data object with dates as keys
 * @param start The start date of the period (YYYY-MM-DD format)
 * @param end The end date of the period (YYYY-MM-DD format)
 * @param callback Function to apply to each budget data value within the date range
 */
function processBudgetDataInDateRange(
  budgetData: BudgetData | undefined,
  datePeriod: YearMonth,
  callback: (date: string, values: BudgetDataValue) => void
): void {
  if (!budgetData) {
    return;
  }

  // Sum up values within date range
  Object.entries(budgetData).forEach(([date, values]) => {
    if (date >= datePeriod && date <= datePeriod) {
      callback(date, values);
    }
  });
}

// ------------------------------------------------------------------

/**
 * Processes budget spending data and updates the summary totals
 *
 * @param budget The budget item to process
 * @param start The start date of the period (YYYY-MM-DD format)
 * @param end The end date of the period (YYYY-MM-DD format)
 * @param summaryTotals The budget summary object to update
 */
export function processBudgetSpending(
  budget: BudgetItem,
  datePeriod: YearMonth,
  summaryTotals: BudgetSummaryTotals
): void {
  processBudgetDataInDateRange(budget.data, datePeriod, (_, values) => {
    const type = budget.is_income
      ? summaryTotals.income
      : summaryTotals.expense;

    type.actualSpending += Math.abs(Number(values.spending_to_base || 0));
    if (values.budget_to_base) {
      type.plannedSpending += Math.abs(Number(values.budget_to_base || 0));
    }
  });
}

// ------------------------------------------------------------------

export function getBudgetOverview(budgets: BudgetItem[]) {
  const datePeriod = CURRENT_YEAR_MONTH as YearMonth;
  const budgetSummaryTotals = {
    income: {
      plannedSpending: 0, //The budget amount, as set by the user
      actualSpending: 0, // The total amount spent in this category for this time period
      availableSpending: 0, // planned - actual
    },
    expense: {
      plannedSpending: 0,
      actualSpending: 0,
      availableSpending: 0,
    },
  };

  if (!budgets || budgets.length === 0) {
    return budgetSummaryTotals;
  }

  for (const budget of budgets) {
    // skip not wanted budgets
    if (
      budget.archived ||
      budget.exclude_from_budget ||
      budget.category_id === null ||
      budget.is_group !== true
    ) {
      continue;
    }

    // Sum up values within date range
    processBudgetSpending(budget, datePeriod, budgetSummaryTotals);
  }

  // calculate available spending (income / expense)
  budgetSummaryTotals.expense.availableSpending =
    budgetSummaryTotals.expense.plannedSpending -
    budgetSummaryTotals.expense.actualSpending;

  budgetSummaryTotals.income.availableSpending =
    budgetSummaryTotals.income.plannedSpending -
    budgetSummaryTotals.income.actualSpending;

  return budgetSummaryTotals;
}
