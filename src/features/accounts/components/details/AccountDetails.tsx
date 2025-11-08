import { type Transaction } from '@/api/types/apiTypes';
import { type NormalizedAccount } from '@/api/types/queryTypes';
import { View } from '@/components/commons';
import TransactionItem from '@/features/transactions/components/commons/TransactionItem';
import useTransactionsSortAndFilter from '@/features/transactions/hooks/useTransactionsSortAndFilter';
import { AccountSettingsRecord } from '@/lib/accountSettingsService';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AccountCard, { type AccountCardProps } from './AccountCard';

type AccountDetailsProps = {
    isLoading: boolean;
    account: NormalizedAccount;
    settings: AccountSettingsRecord | null | undefined;
    details: Omit<AccountCardProps, 'account' | 'isLoading'>;
    transactions: Transaction[];
};

export default function AccountDetails({
    isLoading,
    account,
    settings,
    details,
    transactions,
}: AccountDetailsProps) {
    const insets = useSafeAreaInsets();
    const {
        activeFilter,
        activeSortOption,
        sortDirection,
        setFilter,
        setSortOption,
        toggleSortDirection,
        setSortDirection,
        paginatedTransactions,
        goToNextPage,
    } = useTransactionsSortAndFilter(transactions, {
        initialFilter: 'all',
        initialSortOption: 'date',
        initialSortDirection: 'desc',
        pageSize: 20, // Show 20 transactions per page
        enableIndexing: true, // Use the optimized indexing approach
    });

    return (
        <View className='flex-1'>
            <FlashList
                ListHeaderComponent={
                    <AccountCard
                        account={account}
                        isLoading={isLoading}
                        {...details}
                    />
                }
                data={paginatedTransactions}
                renderItem={({ item, index }) => {
                    const isFirstItem = index === 0;
                    const isLastItem =
                        index === paginatedTransactions.length - 1 || false;

                    return (
                        <TransactionItem
                            transaction={item}
                            isFirstItem={isFirstItem}
                            isLastItem={isLastItem}
                        />
                    );
                }}
                showsVerticalScrollIndicator={false}
                ListFooterComponentStyle={{ marginBottom: insets.bottom }}
            />
        </View>
    );
}
