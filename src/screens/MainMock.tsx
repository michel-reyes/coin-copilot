import { GreenRiverChart } from '@/components/charts/GreenRiverChart';
import { ParallaxScrollView, Text, View } from '@/components/commons';
import {
    SummaryCard,
    SummaryCardBody,
    SummaryCardChart,
    SummaryCardHeader,
    SummaryCardValue,
} from '@/components/dashboard/SummaryCard';
import { IconSymbol } from '@/components/os/IconSymbol';
import colors from '@/themes/colors';
import { formatCurrency, formatShortCurrency } from '@/utils/number-formatter';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import SquircleView from 'react-native-fast-squircle';

import Svg, { Path } from 'react-native-svg';

function SvgSmileFace() {
    return (
        <View className='pt-12 flex-1'>
            <Svg viewBox='0 0 800 400'>
                <Path
                    d='M100,100 Q150,50 200,100'
                    stroke='white'
                    strokeWidth='6'
                    fill='none'
                    strokeLinecap='round'
                />
                <Path
                    d='M600,100 Q650,50 700,100'
                    stroke='white'
                    strokeWidth='6'
                    fill='none'
                    strokeLinecap='round'
                />
                <Path
                    d='M300,250 Q400,350 500,250'
                    stroke='white'
                    strokeWidth='6'
                    fill='none'
                    strokeLinecap='round'
                />
            </Svg>
        </View>
    );
}

function SvgChevronRight() {
    return (
        <Svg viewBox='0 0 24 24'>
            <Path d='M12.982,23.89c-0.354,-0.424 -0.296,-1.055 0.128,-1.408c1.645,-1.377 5.465,-4.762 6.774,-6.482c-1.331,-1.749 -5.1,-5.085 -6.774,-6.482c-0.424,-0.353 -0.482,-0.984 -0.128,-1.408c0.353,-0.425 0.984,-0.482 1.409,-0.128c1.839,1.532 5.799,4.993 7.2,6.964c0.219,0.312 0.409,0.664 0.409,1.054c0,0.39 -0.19,0.742 -0.409,1.053c-1.373,1.932 -5.399,5.462 -7.2,6.964l-0.001,0.001c-0.424,0.354 -1.055,0.296 -1.408,-0.128Z' />
        </Svg>
    );
}

function HeaderGradient() {
    return (
        <LinearGradient
            colors={[
                'rgba(20,28,32,1)',
                'rgba(20,28,32,0.65)',
                'rgba(0,0,0,0.47)',
            ]}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 280,
            }}
        />
    );
}

function StatLabel({ title }: { title: React.ReactNode }) {
    return (
        <Text
            variant='subhead'
            color='secondaryLabel'
            className='tracking-wider stat-card_internal-margin'
        >
            {title}
        </Text>
    );
}

function StatCard({
    label,
    value,
    className,
}: {
    label: React.ReactNode;
    value: React.ReactNode;
    className?: string;
}) {
    return (
        <View className={className}>
            <StatLabel title={label} />
            {typeof value !== 'string' ? (
                value
            ) : (
                <Text variant='title2' color='label' className='font-semibold'>
                    {value}
                </Text>
            )}
        </View>
    );
}

function NumberSymbol({ value }: { value: string }) {
    const formattedValue = String(
        formatCurrency(value, false, true, 'currency', 'compact', 'code')
    );

    // Extract symbol and number $123
    let symbol = formattedValue.match(/[a-zA-Z]+/g)?.join('') || '';
    const number = formattedValue.match(/[-\d,.]+/g)?.join('') || '';

    return (
        <Text
            variant='title2'
            color='label'
            className='tracking-wide font-semibold'
        >
            {number}
            <Text
                variant='subhead'
                color='secondaryLabel'
                className='tracking-widest font-semibold'
            >
                {' '}
                {symbol}
            </Text>
        </Text>
    );
}

function Title({ title }: { title: string }) {
    return (
        <Text variant='title1' className='font-semibold tracking-wide'>
            {title}
        </Text>
    );
}

function TitleLink({ path }: { path: string }) {
    return (
        <Link href={path as any} push asChild>
            <Pressable
                hitSlop={12}
                className='bg-system-surface rounded-xl w-[32px] h-[34px] flex justify-center items-center'
            >
                <IconSymbol
                    name='chevron.right'
                    color={colors['system-icon-secondary']}
                    size={18}
                />
            </Pressable>
        </Link>
    );
}

function CategoryPercentage({
    label,
    currentValue,
    totalValue,
    currencyUnit,
    color,
}: {
    label: string;
    currentValue: number;
    totalValue: number;
    currencyUnit: string;
    color: 'savings' | 'needs' | 'wants';
}) {
    const { width: screenWidth } = useWindowDimensions();
    const [siblingWidth, setSiblingWidth] = useState(0);
    const [textWidth, setTextWidth] = useState(0);

    const colorVariants = {
        savings: colors['system-savings'],
        needs: colors['system-needs'],
        wants: colors['system-wants'],
    };

    // Constants based on design/global.css
    const SCREEN_PADDING = 40; // px-5 * 2 = 20 * 2
    const GAP = 8; // gap-2 = 8
    const BAR_HORIZONTAL_PADDING = 24; // px-3 * 2 = 12 * 2

    const maxBarWidth = screenWidth - SCREEN_PADDING - siblingWidth - GAP;

    // Calculate percentage
    const percentage = (currentValue / totalValue) * 100;

    const currentValueFormatted = formatShortCurrency(currentValue, '');
    const totalValueFormatted = formatShortCurrency(totalValue, '');

    // 100% of the bar should take the full available width (maxBarWidth)
    // So we calculate the target width based on the percentage of that max width
    // If percentage > 100, it will be clamped by maxBarWidth logic below if we wanted strict 100% cap.
    const targetWidth = (percentage / 100) * maxBarWidth;

    // Min width is the text width + padding
    const minWidth = textWidth + BAR_HORIZONTAL_PADDING;

    // Final width calculation
    // 1. Ensure it's at least minWidth
    // 2. Ensure it doesn't exceed maxBarWidth
    // 3. Use targetWidth as the desired size
    // Note: If minWidth > maxBarWidth, we might have an overflow issue, but we'll respect minWidth to show text
    // or we could clamp to maxBarWidth. Usually showing content is preferred.
    // Let's clamp targetWidth between min and max.
    let finalWidth = Math.max(minWidth, Math.min(targetWidth, maxBarWidth));

    // Handle initial render where measurements might be 0
    const isMeasuring = siblingWidth === 0 || textWidth === 0;

    useEffect(() => {
        setSiblingWidth(0);
        setTextWidth(0);
    }, [currentValue, totalValue, label, currencyUnit]);

    if (!isMeasuring) {
        finalWidth = Math.max(minWidth, Math.min(targetWidth, maxBarWidth));
    }

    return (
        <View className='w-full'>
            <View className='w-full flex-row gap-2 items-center'>
                {/* Bar */}
                <SquircleView
                    style={{
                        width: isMeasuring ? 0 : finalWidth,
                        opacity: isMeasuring ? 0 : 1,
                        height: 28,
                        borderRadius: 11,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colorVariants[color],
                        paddingInline: 12,
                    }}
                    cornerSmoothing={0.6}
                >
                    <View
                        className='flex-row grow justify-between items-center gap-1'
                        onLayout={(e) =>
                            setTextWidth(e.nativeEvent.layout.width)
                        }
                    >
                        <Text
                            variant='caption1'
                            className='font-semibold text-system-black'
                        >
                            {label}
                        </Text>
                        <Text
                            variant='caption1'
                            className='font-semibold text-system-black/60'
                        >
                            {percentage.toFixed(0)}%
                        </Text>
                    </View>
                </SquircleView>
                {/* x of x */}
                <View
                    onLayout={(e) =>
                        setSiblingWidth(e.nativeEvent.layout.width)
                    }
                >
                    <Text
                        variant='caption1'
                        className='font-semibold tracking-wider'
                    >
                        {currentValueFormatted}
                        <Text variant='caption1' color='secondaryLabel'>
                            {' '}
                            /
                        </Text>
                    </Text>
                    <Text
                        variant='caption1'
                        color='secondaryLabel'
                        className='tracking-wider'
                    >
                        {totalValueFormatted} {currencyUnit}
                    </Text>
                </View>
            </View>
        </View>
    );
}

function AccountItem({
    name,
    balance,
    usagePercentage,
    dueIn,
    icon,
}: {
    name: string;
    balance: string;
    usagePercentage: string;
    dueIn?: string;
    icon: string;
}) {
    return (
        <SquircleView
            style={{
                borderRadius: 24,
                backgroundColor: colors['system-surface'],
                padding: 18,
            }}
            cornerSmoothing={0.6}
        >
            <View className='flex-row items-center'>
                <Image
                    source={`https://logo.clearbit.com/${icon}.com`}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        marginRight: 22,
                    }}
                    contentFit='cover'
                    transition={900}
                />
                <View className='flex-1'>
                    {/* line1 */}

                    <Text className='font-semibold' variant='body'>
                        {name}
                    </Text>

                    {/* line2 */}
                    <View className='flex-1 mt-2.5'>
                        <Text variant='footnote' color='secondaryLabel'>
                            Balance:{' '}
                            <Text variant='footnote' color='secondaryLabel'>
                                {balance}
                            </Text>
                        </Text>
                    </View>
                    {dueIn && (
                        <View className='flex-row flex-1 items-center gap-1 mt-1'>
                            <IconSymbol
                                name='clock.badge.exclamationmark.fill'
                                color={colors['system-yellow']}
                                size={16}
                            />
                            <Text variant='footnote' color='warning'>
                                Due in {dueIn} days
                            </Text>
                        </View>
                    )}
                    {usagePercentage && usagePercentage > '28' && (
                        <View className='flex-row flex-1 items-center gap-1 mt-1'>
                            <IconSymbol
                                name='xmark.seal.fill'
                                color={colors['system-orange']}
                                size={16}
                            />
                            <Text variant='footnote' color='warning-orange'>
                                Balance is {usagePercentage}% of limit
                            </Text>
                        </View>
                    )}
                </View>
                <IconSymbol
                    name='chevron.right'
                    color={colors['system-icon-secondary']}
                    size={18}
                />
            </View>
        </SquircleView>
    );
}

export default function MainMock() {
    const { width: screenWidth } = useWindowDimensions();

    const dataIncome = [
        { value: 40 },
        { value: 35 },
        { value: 45 },
        { value: 60 },
        { value: 30 },
        { value: 5 },
    ];

    const dataExpense = [
        { value: 65 },
        { value: 98 },
        { value: 23 },
        { value: 88 },
        { value: 54 },
        { value: 99 },
    ];

    const data1 = [
        { value: 70 },
        { value: 20 },
        { value: 50 },
        { value: 40 },
        { value: 48 },
        { value: 38 },
        { value: 38 },
    ];
    // white line
    const data2 = [
        { value: 50, label: 'Wed 12', showDot: false },
        {
            value: 10,
            label: 'Tue 11',
            showDot: true,
            dotColor: '#FF5555',
            dotBorderColor: 'white',
            dotBorderWidth: 2,
        },
        { value: 30, label: 'Thu 13' },
        { value: 30, label: 'Fri 14' },
        { value: 45, label: 'Sat 15' },
        { value: 28, label: 'Sun 16' },
        {
            value: 33,
            label: 'Mon 17',
            dotColor: '#000000',
            dotBorderColor: 'white',
            dotBorderWidth: 2,
        },
    ];

    const data3 = [
        { value: 40 },
        { value: 10 },
        { value: 40 },
        { value: 30 },
        { value: 30 },
        { value: 22 },
        { value: 23 },
    ];
    const data4 = [
        { value: 30 },
        { value: 0 },
        { value: 19 },
        { value: 10 },
        { value: 20 },
        { value: 10 },
        { value: 10 },
    ];

    return (
        <ParallaxScrollView
            headerImage={<SvgSmileFace />}
            headerBackground={<HeaderGradient />}
        >
            <View className='px-3'>
                <View className='flex-row flex-1 items-end-safe justify-between title-y-margin'>
                    <Title title='Period Overview' />
                    <TitleLink path='(private)' />
                </View>

                <View className='stat-card-gap'>
                    <StatCard
                        label='Budget Planned'
                        value={<NumberSymbol value='8342' />}
                    />
                    <View className='flex-row'>
                        <StatCard
                            label='Spent'
                            value={<NumberSymbol value='6441' />}
                            className='grow'
                        />
                        <StatCard
                            label='Available to Spend'
                            value={<NumberSymbol value='1901' />}
                            className='grow'
                        />
                    </View>
                </View>

                {/* percentage bars */}
                <View className='title-y-margin'>
                    <View className='flex-row gap-2'>
                        <StatLabel title='Main Categories' />
                        <IconSymbol
                            name='exclamationmark.circle.fill'
                            color={colors['system-icon-secondary']}
                            size={18}
                        />
                    </View>

                    <View className='gap-1'>
                        <CategoryPercentage
                            label='Savings'
                            currentValue={70}
                            totalValue={80}
                            currencyUnit='USD'
                            color='savings'
                        />
                        <CategoryPercentage
                            label='Needs'
                            currentValue={200}
                            totalValue={480}
                            currencyUnit='USD'
                            color='needs'
                        />
                        <CategoryPercentage
                            label='Wants'
                            currentValue={1234}
                            totalValue={230}
                            currencyUnit='USD'
                            color='wants'
                        />
                    </View>
                </View>

                <View className='title-y-margin'>
                    <View className='flex-row gap-4'>
                        {/* income */}
                        <SummaryCard>
                            <SummaryCardHeader title='Income' />
                            <SummaryCardBody>
                                <SummaryCardValue
                                    value={15099}
                                    subtitle='Last 30 days'
                                />
                                <SummaryCardChart
                                    data={dataIncome}
                                    color={colors['system-text-tertiary']}
                                    backgroundRectMin={10}
                                    backgroundRectMax={50}
                                />
                            </SummaryCardBody>
                        </SummaryCard>

                        {/* expense */}

                        <SummaryCard>
                            <SummaryCardHeader title='Expenses' />
                            <SummaryCardBody>
                                <SummaryCardValue
                                    value={856.76}
                                    subtitle='Current month'
                                />
                                <SummaryCardChart
                                    data={dataExpense}
                                    color={colors['system-text-tertiary']}
                                    backgroundRectMin={34}
                                    backgroundRectMax={120}
                                />
                            </SummaryCardBody>
                        </SummaryCard>
                    </View>
                </View>

                <View className='title-y-margin'>
                    <View className='flex-row items-center justify-between title-y-margin'>
                        <Title title='Burn rate' />
                        <TitleLink path='(private)' />
                    </View>

                    <View className='stat-card-gap flex-row mb-4'>
                        <StatCard
                            label='Average'
                            value={<NumberSymbol value='84' />}
                            className='grow'
                        />
                        <StatCard
                            label='Difference'
                            value={<NumberSymbol value='-19' />}
                            className='grow'
                        />
                    </View>
                    <Text variant='caption1' color='secondaryLabel'>
                        MAY 21 - NOV 16
                    </Text>
                </View>
            </View>
            <View className='w-full items-center -mt-10'>
                <GreenRiverChart
                    data1={data1}
                    data2={data2}
                    data3={data3}
                    data4={data4}
                    width={screenWidth}
                    height={230}
                    endMargin={20}
                />
                <Text className='mt-4'>
                    Your current Burn Rate is{' '}
                    <Text color='success' className='font-semibold'>
                        {formatShortCurrency(123.4)}
                    </Text>
                    , this is how much you really spend each day based on your
                    Money In and Money Saved
                </Text>
            </View>

            {/* Accounts */}
            <View className='title-y-margin px-4'>
                <View className='flex-row items-center justify-between title-y-margin'>
                    <Title title='Accounts' />
                    <StatCard
                        label='Net Worth'
                        value={<NumberSymbol value='-38' />}
                    />
                </View>

                <View className='gap-2'>
                    <AccountItem
                        name='American Express'
                        icon='americanexpress'
                        balance='$1,234.56'
                        usagePercentage='12'
                    />
                    <AccountItem
                        name='Chase'
                        icon='chase'
                        balance='$1,234.56'
                        usagePercentage='23'
                        dueIn='3'
                    />
                    <AccountItem
                        name='Paypal Cashback Account'
                        icon='paypal'
                        balance='$1,234.56'
                        usagePercentage='45'
                    />
                </View>
            </View>
            <View className='mb-52' />
        </ParallaxScrollView>
    );
}
