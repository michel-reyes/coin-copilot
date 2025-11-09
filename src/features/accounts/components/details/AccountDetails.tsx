import { type Transaction } from '@/api/types/apiTypes';
import { type NormalizedAccount } from '@/api/types/queryTypes';
import { Text, View } from '@/components/commons';
import TransactionItem from '@/features/transactions/components/commons/TransactionItem';
import TransactionsSortFilter from '@/features/transactions/components/commons/transactionsSortAndFilter';
import useTransactionsSortAndFilter from '@/features/transactions/hooks/useTransactionsSortAndFilter';
import { getTransactionDateRange } from '@/features/transactions/utils/transactions-helper';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AccountCard, { type AccountCardProps } from './AccountCard';

// ------------------------------------------------------------------------

type AccountDetailsProps = {
    isError: boolean;
    isLoading: boolean;
    account: NormalizedAccount;
    details: Omit<AccountCardProps, 'account' | 'isLoading'>;
    transactions: Transaction[];
};

export default function AccountDetails({
    isError,
    isLoading,
    account,
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

    const showFilter = paginatedTransactions.length > 0;
    const { start, end } = getTransactionDateRange(transactions);
    const filterTitle = (
        <View className='gap-1'>
            <Text variant='subhead' color='tertiaryLabel'>
                {start}-{end}
            </Text>
            <Text variant='title3'>Latest Transactions</Text>
        </View>
    );

    if (isError) {
        return (
            <View className='flex-1 justify-center items-center'>
                <Text>Failed to load account details.</Text>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View className='flex-1 justify-center items-center'>
                <Text>Loading account details...</Text>
            </View>
        );
    }

    return (
        <View className='flex-1'>
            <FlashList
                ListHeaderComponent={
                    <>
                        <AccountCard
                            account={account}
                            isLoading={isLoading}
                            {...details}
                        />
                        {showFilter && (
                            <TransactionsSortFilter
                                listTitle={filterTitle}
                                activeFilter={activeFilter}
                                setFilter={setFilter}
                                activeSortOption={activeSortOption}
                                setSortOption={setSortOption}
                                sortDirection={sortDirection}
                                setSortDirection={setSortDirection}
                                toggleSortDirection={toggleSortDirection}
                            />
                        )}
                    </>
                }
                data={paginatedTransactions}
                onEndReached={goToNextPage} // Load more items when reaching the end
                onEndReachedThreshold={0.5} // Trigger when halfway to the end
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
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: insets.bottom + 32,
                }}
                ListEmptyComponent={<Text>No items</Text>} // TODO: Add better empty state
            />
        </View>
    );
}
