import { useGetBudget } from '@/api/hooks/use-lunch-money-queries';
import { CURRENT_MONTH_END, LAST_5_MONTHS_START } from '@/utils/date-utils';

const useBudgets = () => {
  const startDate = LAST_5_MONTHS_START;
  const endDate = CURRENT_MONTH_END;

  const { data, isLoading, isError } = useGetBudget({
    start: startDate,
    end: endDate,
  });

  const budgets = data || [];

  return { budgets, isLoading, isError };
};

export default useBudgets;
