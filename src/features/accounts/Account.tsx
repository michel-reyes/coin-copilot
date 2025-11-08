import { useGetAccountSettings } from '@/api/hooks/use-supabase-queries';
import { NormalizedAccount } from '@/api/types/queryTypes';
import useAccountDetails from '@/features/accounts/hooks/useAccountDetails';
import useTransactions from '@/features/transactions/hooks/useTransactions';
import { sortTransactionsByDate } from '@/features/transactions/utils/transactions-helper';
import AccountDetails from './components/details/AccountDetails';

export default function Account({ account }: { account: NormalizedAccount }) {
    const {
        data: accountSetting,
        isLoading: isLoadingAccountSetting,
        isError,
    } = useGetAccountSettings(account.id.toString(), account.institution_name);
    const accountDetails = useAccountDetails(account, accountSetting, true);

    const {
        isLoading: isLoadingTransactions,
        isError: isErrorTransactions,
        getTransactionsByAccount,
    } = useTransactions();

    const transactions = getTransactionsByAccount(account.id);
    const sortedTransactions = sortTransactionsByDate(transactions);

    return (
        <AccountDetails
            isLoading={isLoadingAccountSetting || isLoadingTransactions}
            account={account}
            settings={accountSetting}
            details={accountDetails}
            transactions={sortedTransactions}
        />
    );
}
