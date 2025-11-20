import { ScreenScrollView, View } from '@/components/commons';
import AccountSummary from '@/features/accounts/AccountSummary';
import BudgetSummary from '@/features/budget/BudgetSummary';
import PeriodSummary from '@/features/period-summary/PeriodSummary';
import Gentler from './Gentler';

export default function DashboardScreen() {
    return (
        <>
            <ScreenScrollView>
                <View className='flex-row mx-3 gap-3 mt-12 mb-40'>
                    <PeriodSummary />
                    <BudgetSummary />
                </View>

                <Gentler />

                <View className='flex-1 mx-3 mt-12 mt-40'>
                    <AccountSummary />
                </View>
            </ScreenScrollView>
        </>
    );
}
