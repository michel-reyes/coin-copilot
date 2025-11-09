import { Transaction } from '@/api/types/apiTypes';
import { ListItem, Text, View } from '@/components/commons';
import { IconSymbol } from '@/components/os/IconSymbol';
import colors from '@/themes/colors';
import { formatDate, getDayName, getMonthName } from '@/utils/date-utils';
import { formatCurrency } from '@/utils/number-formatter';
import { TransactionLogo } from './TransactionLogo';
// ------------------------------------------------------------------

export interface TransactionItemProps {
    transaction: Transaction;
    isFirstItem?: boolean;
    isLastItem?: boolean;
}

const TransactionType = ({ transaction }: { transaction: Transaction }) => {
    const isRecurring = transaction.recurring_id;
    const isTransfer = transaction.category_name === 'Transfer';
    const isIncome = transaction.is_income;

    if (isIncome) {
        return (
            <View className='flex-row items-center gap-2'>
                <IconSymbol
                    name='i.square'
                    size={16}
                    color={colors['system-white']}
                />
                <Text
                    variant='caption1'
                    color='secondaryLabel'
                    className='font-bold'
                >
                    Income
                </Text>
            </View>
        );
    }

    if (isRecurring) {
        return (
            <View className='flex-row items-center gap-2'>
                <IconSymbol
                    name='r.square'
                    size={16}
                    color={colors['system-white']}
                />
                <Text
                    variant='caption1'
                    color='secondaryLabel'
                    className='font-bold'
                >
                    Recurring
                </Text>
            </View>
        );
    }

    if (isTransfer) {
        return (
            <View className='flex-row items-center gap-2'>
                <IconSymbol
                    name='t.square'
                    size={16}
                    color={colors['system-white']}
                />
                <Text
                    variant='caption1'
                    color='secondaryLabel'
                    className='font-bold'
                >
                    Transfer
                </Text>
            </View>
        );
    }

    return null;
};

// ------------------------------------------------------------------

export default function TransactionItem({
    transaction,
    isFirstItem,
    isLastItem,
}: TransactionItemProps) {
    const id = transaction.id.toString();
    const logo = <TransactionLogo transaction={transaction} />;
    const name = transaction.display_name || transaction.payee;
    const category = transaction.category_name || 'Uncategorized';
    const symbol = transaction.is_income ? '+ ' : '';
    const amount = symbol + formatCurrency(transaction.to_base, true, false);
    const monthDay =
        getDayName(transaction.date, 'short').dayName +
        ', ' +
        formatDate(transaction.date, 'DD') +
        ' ' +
        getMonthName(transaction.date, 'short');
    const year = formatDate(transaction.date, 'YYYY');

    return (
        <View>
            <ListItem
                href={{
                    pathname: '/', //`/transactions/[id]`, TODO:
                    params: { id },
                }}
                showLinkIcon={false}
                leadingIcon={logo}
                title={
                    <Text
                        variant='caption1'
                        color='secondaryLabel'
                        className='flex-1 font-bold'
                    >
                        {`${monthDay} ${year}`}
                    </Text>
                }
                hint={<TransactionType transaction={transaction} />}
                description={
                    <Text
                        variant='headline'
                        color='label'
                        numberOfLines={2}
                        className='flex-1 mr-7 capitalize'
                    >
                        {name}
                    </Text>
                }
                descriptionHint={
                    <Text
                        variant='headline'
                        isNumeric
                        color={transaction.is_income ? 'success' : 'label'}
                    >
                        {amount}
                    </Text>
                }
                metadata={
                    <Text variant='headline' color='secondaryLabel'>
                        {category}
                    </Text>
                }
                showDivider={!isLastItem}
            />
        </View>
    );
}
