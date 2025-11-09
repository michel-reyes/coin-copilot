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
        <View className='flex-1 gap-3'>
            <View className='flex-row mx-3 items-end justify-between'>
                <View className='gap-1'>
                    <Text variant='title3'>Accounts</Text>
                    <Text variant='headline' color='tertiaryLabel'>
                        Net Worth
                    </Text>
                </View>
                <Text isNumeric variant='headline' color='secondaryLabel'>
                    {netWorthValue}
                </Text>
            </View>

            <View variant='card' className='px-0 py-0'>
                {accounts.map((account) => (
                    <AccountSummaryListItem
                        key={account.id}
                        account={account}
                    />
                ))}
            </View>
        </View>
    );
}
