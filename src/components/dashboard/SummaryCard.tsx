import { SkiaLineChart } from '@/components/charts/SkiaLineChart';
import { Text, View } from '@/components/commons';
import { IconSymbol } from '@/components/os/IconSymbol';
import colors from '@/themes/colors';
import { formatCurrency } from '@/utils/number-formatter';
import React, { useState } from 'react';
import SquircleView from 'react-native-fast-squircle';

// --- Internal Helpers ---

function SymbolNumberDecimal({ value }: { value: string | number }) {
    const formattedValue = String(formatCurrency(value));

    // Extract symbol and number $123
    let symbol = formattedValue.charAt(0);
    const [number, decimal] = formattedValue.slice(1).split('.');

    return (
        <View className='flex-row items-end'>
            <Text variant='subhead' color='secondaryLabel' className='mb-1'>
                {symbol}{' '}
            </Text>
            <Text
                variant='title3l'
                color='label'
                className='tracking-wide font-semibold'
            >
                {number}
            </Text>
            <Text
                variant='title3l'
                color='tertiaryLabel'
                className='tracking-wide'
            >
                {'.'}
                {decimal}
            </Text>
        </View>
    );
}

function AutoWidthChart({
    children,
}: {
    children: (width: number) => React.ReactNode;
}) {
    const [width, setWidth] = useState(0);

    return (
        <View
            className='flex-1 h-full'
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
            {width > 0 && children(width)}
        </View>
    );
}

// --- Composable Components ---

export function SummaryCard({ children }: { children: React.ReactNode }) {
    return (
        <SquircleView
            style={{
                borderRadius: 24,
                backgroundColor: colors['system-surface'],
                padding: 18,
                flex: 1,
                width: '50%',
            }}
            cornerSmoothing={0.6}
        >
            <View>{children}</View>
        </SquircleView>
    );
}

export function SummaryCardHeader({
    title,
    icon = 'digitalcrown.arrow.counterclockwise.fill',
}: {
    title: string;
    icon?: string;
}) {
    return (
        <View className='flex flex-row items-center justify-between'>
            <View className='flex-row items-center gap-1.5'>
                <Text className='tracking-wider'>{title}</Text>
            </View>
            <View>
                <IconSymbol
                    name='chevron.right'
                    color={colors['system-icon-secondary']}
                    size={16}
                />
            </View>
        </View>
    );
}

export function SummaryCardBody({ children }: { children: React.ReactNode }) {
    return <View className='flex gap-4'>{children}</View>;
}

export function SummaryCardValue({
    value,
    subtitle,
}: {
    value: number;
    subtitle: string;
}) {
    return (
        <View className='gap-1 mt-6 flex-1'>
            <SymbolNumberDecimal value={value} />

            <Text
                variant='subhead'
                color='secondaryLabel'
                className='tracking-wide'
            >
                {subtitle}
            </Text>
        </View>
    );
}

export function SummaryCardChart({
    data,
    color,
    backgroundRectMin,
    backgroundRectMax,
}: {
    data: { value: number }[];
    color: string;
    backgroundRectMin: number;
    backgroundRectMax: number;
}) {
    return (
        <View>
            <AutoWidthChart>
                {(width) => (
                    <SkiaLineChart
                        data={data}
                        width={width}
                        height={60}
                        lineColor={color}
                        strokeWidth={1}
                        dataPointRadius={4}
                        dataPointBackgroundColor='#000'
                        backgroundRectMin={backgroundRectMin}
                        backgroundRectMax={backgroundRectMax}
                    />
                )}
            </AutoWidthChart>
        </View>
    );
}
