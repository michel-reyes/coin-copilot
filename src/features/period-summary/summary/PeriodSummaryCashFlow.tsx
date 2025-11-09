import { Transaction } from '@/api/types/apiTypes';
import { YearMonth } from '@/api/types/queryTypes';
import { Divider, Text, View } from '@/components/commons';
import { IconSymbol } from '@/components/os/IconSymbol';
import { getPeriodSummaryCashFlow } from '@/features/period-summary/utils/period-summary-helper';
import colors from '@/themes/colors';
import { CURRENT_YEAR_MONTH } from '@/utils/date-utils';
import { formatCurrency } from '@/utils/number-formatter';

export default function PeriodSummaryCashFlow({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const datePeriod = CURRENT_YEAR_MONTH as YearMonth;
  const { expenses, incomes } = getPeriodSummaryCashFlow(
    transactions,
    datePeriod
  );
  const { totalIncome } = incomes;
  const { totalExpenses } = expenses;

  return (
    <View className='flex-1'>
      {/* title */}
      <View className='mb-3'>
        <Text variant='title3' className='mx-3'>
          Period
        </Text>
        <Text variant='headline' color='tertiaryLabel' className='mx-3'>
          Summary
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
              Income
            </Text>
            <Text isNumeric variant='headline'>
              {formatCurrency(totalIncome)}
            </Text>
          </View>
          <Divider />
          <View className='gap-1'>
            <Text
              variant='footnote'
              color='tertiaryLabel'
              className='font-bold'
            >
              Expenses
            </Text>
            <View className='flex-row flex-1 gap-2 items-center'>
              <Text isNumeric variant='headline'>
                {formatCurrency(totalExpenses)}
              </Text>
              <IconSymbol
                name='arrow.up.right.circle.fill'
                size={16}
                color={colors['system-orange']}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
