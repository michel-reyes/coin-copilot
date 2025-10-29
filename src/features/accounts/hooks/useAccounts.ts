import { useGetAccounts } from '@/api/hooks/use-lunch-money-queries';
import { NormalizedAccount } from '@/api/types/queryTypes';

const useAccounts = () => {
  const {
    data: accountsData,
    isLoading: isAccountLoading,
    isError: isAccountError,
  } = useGetAccounts();

  const userAccounts: NormalizedAccount[] = accountsData || [];

  /**
   * Calculate the net worth based on user accounts
   * @param userAccounts: a list of plid accounts
   * @returns number representing the net worth
   */
  const getNetWoth = (userAccounts: NormalizedAccount[]) => {
    let netWorth = 0;
    userAccounts.forEach((account) => {
      const balance = Number(account.balance);
      if (account.isIncome) {
        netWorth -= balance;
      } else {
        netWorth += balance;
      }
    });

    // invert the symbol
    netWorth = netWorth * -1;

    return netWorth;
  };

  return {
    userAccounts,
    isAccountLoading,
    isAccountError,
    getNetWoth,
  };
};

export default useAccounts;
