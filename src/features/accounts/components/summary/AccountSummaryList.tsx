import { NormalizedAccount } from '@/api/types/queryTypes';
import { Text, View } from '@/components/commons';
import { formatCurrency } from '@/utils/number-formatter';
import AccountSummaryListItem from './AccountSummaryListItem';

interface AccountSummaryListProps {
    accounts: NormalizedAccount[];
    networth: number;
}

export default function AccountSummaryList({
    accounts,
    networth,
}: AccountSummaryListProps) {
    return (
        <View className='flex-1'>
            <Text color='secondaryLabel'>
                Net Worth: <Text>{formatCurrency(networth)}</Text>
            </Text>
            <Text>Accounts:</Text>
            {accounts.map((account) => (
                <AccountSummaryListItem key={account.id} account={account} />
            ))}
        </View>
    );
}
