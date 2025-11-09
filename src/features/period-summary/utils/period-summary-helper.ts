import { Transaction } from '@/api/types/apiTypes';
import { YearMonth } from '@/api/types/queryTypes';
import { filterTransactions } from '@/features/transactions/utils/transactions-helper';

export function getPeriodSummaryCashFlow(
  transactions: Transaction[],
  yearMonth: YearMonth
) {
  let expenses = {
      totalExpenses: 0,
      recurringExpenses: 0,
      otherExpenses: 0,
      uncategorizedExpenses: 0,
    },
    incomes = {
      // INCOME
      totalIncome: 0,
      recurringIncome: 0,
      otherIncome: 0,
      uncategorizedIncome: 0,
    };

  if (!transactions || transactions.length === 0 || !yearMonth) {
    return { expenses, incomes };
  }

  // filter transactions by year and month
  const monthTransactions = filterTransactions(transactions, {
    date: {
      op: 'contains',
      value: `${yearMonth}`,
    },
  });

  if (!monthTransactions || monthTransactions.length === 0) {
    return { expenses, incomes };
  }

  for (const t of monthTransactions) {
    // skip some transactions
    if (t.exclude_from_totals) {
      continue;
    }

    const amount = t.to_base || 0;

    // Income
    if (t.is_income) {
      incomes.totalIncome += amount;
      // uncategorized income
      if (t.category_id === null) {
        incomes.uncategorizedIncome += amount;
        continue;
      }
      // recurring income
      if (t.recurring_id && t.recurring_type === 'cleared') {
        incomes.recurringIncome += amount;
        continue;
      }
      // other income
      incomes.otherIncome += amount;
    }
    // Expenses
    else {
      expenses.totalExpenses += amount;
      // uncategorized expense
      if (t.category_id === null) {
        expenses.uncategorizedExpenses += amount;
        continue;
      }
      // recurring expense
      if (t.recurring_id && t.recurring_type === 'cleared') {
        expenses.recurringExpenses += amount;
        continue;
      }
      // other expense
      expenses.otherExpenses += amount;
    }
  }

  return { expenses, incomes };
}
