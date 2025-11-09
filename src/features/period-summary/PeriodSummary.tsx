import { Text } from '@/components/commons';
import useTransactions from '@/features/transactions/hooks/useTransactions';
import PeriodSummaryCashFlow from './summary/PeriodSummaryCashFlow';

export default function PeriodSummary() {
  const {
    transactions,
    isLoading: isTransactionLoading,
    isError: isTransactionError,
  } = useTransactions();

  // -------------------------------------------------------------------

  // handle states
  if (isTransactionLoading) return <Text>Loading...</Text>;
  if (isTransactionError) return <Text>Error loading accounts</Text>;
  if (transactions.length === 0) {
    return <Text>No accounts found</Text>;
  }

  return <PeriodSummaryCashFlow transactions={transactions} />;
}
