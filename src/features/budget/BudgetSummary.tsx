import { Text } from '@/components/commons';
import useBudgets from './hooks/useBudget';
import BudgetOverview from './summary/BudgetOverview';
import { getBudgetOverview } from './utils/budget-helper';

export default function PeriodSummary() {
  const {
    budgets,
    isLoading: isBudgetLoading,
    isError: isBudgetError,
  } = useBudgets();

  // -------------------------------------------------------------------

  // handle states
  if (isBudgetLoading) return <Text>Loading...</Text>;
  if (isBudgetError) return <Text>Error loading accounts</Text>;
  if (budgets.length === 0) {
    return <Text>No budgets found</Text>;
  }

  const budgetOverview = getBudgetOverview(budgets);

  return <BudgetOverview budgetOverview={budgetOverview} />;
}
