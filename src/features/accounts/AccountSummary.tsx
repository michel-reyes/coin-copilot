import { Text, View } from '@/components/commons';
import AccountSummaryList from '@/features/accounts/components/summary/AccountSummaryList';
import useAccounts from '@/features/accounts/hooks/useAccounts';

export default function AccountSummary() {
  const { userAccounts, isAccountLoading, isAccountError, getNetWoth } =
    useAccounts();

  // -------------------------------------------------------------------

  // handle states
  if (isAccountLoading) return <Text>Loading...</Text>;
  if (isAccountError) return <Text>Error loading accounts</Text>;
  if (userAccounts.length === 0) {
    return <Text>No accounts found</Text>;
  }

  // -------------------------------------------------------------------

  const netWorth = getNetWoth(userAccounts);

  return (
    <View>
      <AccountSummaryList accounts={userAccounts} networth={netWorth} />
    </View>
  );
}
