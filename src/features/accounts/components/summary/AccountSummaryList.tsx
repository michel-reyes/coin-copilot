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
    const netWorthValue = formatCurrency(networth);
    return (
        <View className='flex-1'>
            <View className='gap-1 ml-3'>
                <Text variant='title3'>Net Worth</Text>
                <Text isNumeric variant='title3' color='secondaryLabel'>
                    {netWorthValue}
                </Text>
            </View>

            {accounts.map((account) => (
                <AccountSummaryListItem key={account.id} account={account} />
            ))}
        </View>
    );
}
