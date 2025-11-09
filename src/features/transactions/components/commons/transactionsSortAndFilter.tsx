import { Divider, Text, View } from '@/components/commons';
import { IconSymbol } from '@/components/os/IconSymbol';
import {
    TransactionFilterOption,
    TransactionSortOption,
    TransactionsSortFilterProps,
} from '@/features/transactions/hooks/useTransactionsSortAndFilter';
import colors from '@/themes/colors';
import React from 'react';
import { Pressable, ScrollView } from 'react-native';

// ------------------------------------------------------------------

/**
 * Filter button component for transaction filtering
 */
interface FilterButtonProps {
    label: string;
    filterValue: TransactionFilterOption;
    isActive: boolean;
    onPress: () => void;
}

function FilterButton({
    label,
    isActive,
    onPress,
}: FilterButtonProps): React.ReactElement {
    return (
        <Pressable
            onPress={onPress}
            className={`rounded-xl px-3 py-2 ${isActive ? 'bg-system-surface-secondary' : ''}`}
        >
            <Text
                variant='caption1'
                color={isActive ? 'label' : 'secondaryLabel'}
                className='font-bold'
            >
                {label}
            </Text>
        </Pressable>
    );
}

// ------------------------------------------------------------------

/**
 * Sort button component for transaction sorting
 */
interface SortButtonProps {
    label: string;
    sortValue: TransactionSortOption;
    isActive: boolean;
    sortDirection: 'asc' | 'desc';
    onPress: () => void;
}

function SortButton({
    label,
    isActive,
    sortDirection,
    onPress,
}: SortButtonProps): React.ReactElement {
    return (
        <Pressable
            onPress={onPress}
            className={`rounded-full px-2 py-1 ${isActive ? 'bg-system-surface-secondary' : ''} flex-row items-center gap-1`}
        >
            <Text
                variant='caption1'
                color={isActive ? 'label' : 'secondaryLabel'}
                className='font-bold'
            >
                {label}
            </Text>
            {isActive && (
                <IconSymbol
                    name={sortDirection === 'desc' ? 'arrow.down' : 'arrow.up'}
                    color={colors['system-white']}
                    size={12}
                    weight='bold'
                />
            )}
        </Pressable>
    );
}

// ------------------------------------------------------------------

/**
 * Filter section component
 */
interface FilterSectionProps {
    activeFilter: TransactionFilterOption;
    setFilter: (filter: TransactionFilterOption) => void;
}

function FilterSection({
    activeFilter,
    setFilter,
}: FilterSectionProps): React.ReactElement {
    // Define filter options
    const filterOptions: Array<{
        value: TransactionFilterOption;
        label: string;
    }> = [
        { value: 'all', label: 'ALL-ITEMS' },
        { value: 'income', label: 'INCOME' },
        { value: 'expenses', label: 'EXPENSES' },
        { value: 'recurring', label: 'RECURRING' },
        { value: 'purchases', label: 'PURCHASES' },
        { value: 'transfers', label: 'TRANSFERS' },
    ];

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className='flex-row gap-3 px-4 my-3'>
                {filterOptions.map(({ value, label }) => (
                    <FilterButton
                        key={value}
                        label={label}
                        filterValue={value}
                        isActive={activeFilter === value}
                        onPress={() => setFilter(value)}
                    />
                ))}
            </View>
        </ScrollView>
    );
}

// ------------------------------------------------------------------

/**
 * Sort section component
 */
interface SortSectionProps {
    activeSortOption: TransactionSortOption;
    setSortOption: (sortOption: TransactionSortOption) => void;
    sortDirection: 'asc' | 'desc';
    setSortDirection: (direction: 'asc' | 'desc') => void;
    toggleSortDirection: () => void;
}

function SortSection({
    activeSortOption,
    setSortOption,
    sortDirection,
    setSortDirection,
    toggleSortDirection,
}: SortSectionProps): React.ReactElement {
    // Define sort options with their default directions
    const sortOptions: Array<{
        value: TransactionSortOption;
        label: string;
        defaultDirection: 'asc' | 'desc';
    }> = [
        { value: 'date', label: 'DATE', defaultDirection: 'desc' },
        { value: 'category', label: 'CATEGORY', defaultDirection: 'asc' },
        { value: 'merchant', label: 'MERCHANT', defaultDirection: 'asc' },
        { value: 'amount', label: 'AMOUNT', defaultDirection: 'desc' },
    ];

    return (
        <View className='flex-row gap-3 px-4 my-3'>
            {sortOptions.map(({ value, label, defaultDirection }) => (
                <SortButton
                    key={value}
                    label={label}
                    sortValue={value}
                    isActive={activeSortOption === value}
                    sortDirection={sortDirection}
                    onPress={() => {
                        if (activeSortOption === value) {
                            toggleSortDirection();
                        } else {
                            setSortOption(value);
                            setSortDirection(defaultDirection);
                        }
                    }}
                />
            ))}
        </View>
    );
}

// ------------------------------------------------------------------

/**
 * Main component for transaction sorting and filtering
 */
export default function TransactionsSortFilter({
    listTitle,
    activeFilter,
    setFilter,
    activeSortOption,
    setSortOption,
    sortDirection,
    setSortDirection,
    toggleSortDirection,
}: TransactionsSortFilterProps): React.ReactElement {
    return (
        <>
            <FilterSection activeFilter={activeFilter} setFilter={setFilter} />

            <Divider />

            <View className='mb-3 mt-6 ml-4 flex-1'>
                {typeof listTitle === 'string' ? (
                    <Text variant='title3'>{listTitle}</Text>
                ) : (
                    listTitle
                )}
            </View>

            <SortSection
                activeSortOption={activeSortOption}
                setSortOption={setSortOption}
                sortDirection={sortDirection}
                setSortDirection={setSortDirection}
                toggleSortDirection={toggleSortDirection}
            />
        </>
    );
}
