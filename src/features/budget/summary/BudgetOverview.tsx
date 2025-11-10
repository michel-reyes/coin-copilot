import { Divider, Text, View } from '@/components/commons';
import { formatCurrency } from '@/utils/number-formatter';
import { BudgetSummaryTotals } from '../utils/budget-helper';

export default function BudgetOverview({
  budgetOverview,
}: {
  budgetOverview: BudgetSummaryTotals;
}) {
  return (
    <View className='flex-1'>
      <View className='mb-3'>
        <Text variant='title3' className='mx-3'>
          Budget
        </Text>
        <Text variant='headline' color='tertiaryLabel' className='mx-3'>
          Overview
        </Text>
      </View>

      <View variant='card'>
        <View className='gap-3'>
          <View className='gap-1'>
            <Text
              variant='footnote'
              color='tertiaryLabel'
              className='font-bold'
            >
              Available Funds
            </Text>
            <Text isNumeric variant='headline'>
              {formatCurrency(budgetOverview.expense.availableSpending)}
            </Text>
          </View>
          <Divider />
          <View className='gap-1'>
            <Text
              variant='footnote'
              color='tertiaryLabel'
              className='font-bold'
            >
              Planned Expenses
            </Text>
            <Text isNumeric variant='headline'>
              {formatCurrency(budgetOverview.expense.plannedSpending)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
