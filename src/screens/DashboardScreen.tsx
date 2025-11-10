import { ScreenScrollView, View } from '@/components/commons';
import AccountSummary from '@/features/accounts/AccountSummary';
import BudgetSummary from '@/features/budget/BudgetSummary';
import PeriodSummary from '@/features/period-summary/PeriodSummary';

export default function DashboardScreen() {
  return (
    <>
      <ScreenScrollView>
        <View className='flex-row mx-3 gap-3 mt-12'>
          <PeriodSummary />
          <BudgetSummary />
        </View>

        <View className='flex-1 mx-3 mt-12'>
          <AccountSummary />
        </View>
      </ScreenScrollView>
    </>
  );
}
