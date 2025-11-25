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
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import SquircleView from 'react-native-fast-squircle';

import Svg, { Path } from 'react-native-svg';

function SvgComponent() {
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

function HeaderGradient() {
  return (
    <LinearGradient
      colors={['rgba(20,28,32,1)', 'rgba(20,28,32,0.65)', 'rgba(0,0,0,0.47)']}
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
            onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
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
        <View onLayout={(e) => setSiblingWidth(e.nativeEvent.layout.width)}>
          <Text variant='caption1' className='font-semibold tracking-wider'>
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
    { value: 50, label: 'Tue 11' },
    { value: 10, label: 'Wed 12' },
    { value: 45, label: 'Thu 13' },
    { value: 30, label: 'Fri 14' },
    { value: 45, label: 'Sat 15' },
    { value: 28, label: 'Sun 16' },
    { value: 33, label: 'Mon 17' },
  ];

  const data3 = [
    { value: 40 },
    { value: 5 },
    { value: 30 },
    { value: 20 },
    { value: 30 },
    { value: 22 },
    { value: 23 },
  ];
  const data4 = [
    { value: 30 },
    { value: 0 },
    { value: 20 },
    { value: 10 },
    { value: 20 },
    { value: 10 },
    { value: 10 },
  ];

  return (
    <ParallaxScrollView
      headerImage={<SvgComponent />}
      headerBackground={<HeaderGradient />}
    >
      <View className='screen-x-padding'>
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
          {/* income */}
          <SummaryCard>
            <SummaryCardHeader title='Income' />
            <SummaryCardBody>
              <SummaryCardValue value={1562.06} subtitle='Last 30 days' />
              <SummaryCardChart
                data={dataIncome}
                color={colors['system-green']}
                backgroundRectMin={10}
                backgroundRectMax={50}
              />
            </SummaryCardBody>
          </SummaryCard>
        </View>

        {/* expense */}
        <View className='-mt-4'>
          <SummaryCard>
            <SummaryCardHeader title='Expenses' />
            <SummaryCardBody>
              <SummaryCardValue value={856.76} subtitle='Current month' />
              <SummaryCardChart
                data={dataExpense}
                color={colors['system-red']}
                backgroundRectMin={34}
                backgroundRectMax={120}
              />
            </SummaryCardBody>
          </SummaryCard>
        </View>

        <View className='title-y-margin'>
          <View className='flex-row flex-1 items-end-safe justify-between title-y-margin'>
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
        </View>
      </View>
      <View className='w-full items-center'>
        <GreenRiverChart
          data1={data1}
          data2={data2}
          data3={data3}
          data4={data4}
          width={screenWidth}
          height={250}
        />
      </View>
      <View className='mb-52' />
    </ParallaxScrollView>
  );
}

const burnRateData = [
  // Warmup period (stable/high burn)
  { date: '2025-09-01', income: 0, netWorth: 10000 },
  { date: '2025-09-02', income: 0, netWorth: 9800 },
  { date: '2025-09-03', income: 500, netWorth: 9650 }, // Noise
  { date: '2025-09-04', income: 0, netWorth: 9400 },
  { date: '2025-09-05', income: 0, netWorth: 9200 },
  { date: '2025-09-06', income: 200, netWorth: 9020 }, // Noise
  { date: '2025-09-07', income: 0, netWorth: 8800 },
  { date: '2025-09-08', income: 0, netWorth: 8600 },
  { date: '2025-09-09', income: 800, netWorth: 8480 }, // Noise
  { date: '2025-09-10', income: 0, netWorth: 8200 },
  { date: '2025-09-11', income: 0, netWorth: 8000 },
  { date: '2025-09-12', income: 0, netWorth: 7800 },
  { date: '2025-09-13', income: 0, netWorth: 7600 },
  { date: '2025-09-14', income: 0, netWorth: 7400 },

  // Start of visible chart
  // Dip: Burn rate drops
  { date: '2025-09-15', income: 0, netWorth: 72500 },
  { date: '2025-09-16', income: 100, netWorth: 71600 },
  { date: '2025-09-17', income: 0, netWorth: 70800 },
  { date: '2025-09-18', income: 0, netWorth: 70200 }, // Low point
  { date: '2025-09-19', income: 0, netWorth: 69600 },
  { date: '2025-09-20', income: 0, netWorth: 69000 },
  { date: '2025-09-21', income: 0, netWorth: 68400 },

  // Rise: Burn rate increases rapidly with some noise
  { date: '2025-09-22', income: 0, netWorth: 67400 },
  { date: '2025-09-23', income: 500, netWorth: 66400 }, // Income spike
  { date: '2025-09-24', income: 0, netWorth: 63900 },
  { date: '2025-09-25', income: 0, netWorth: 61400 },
  { date: '2025-09-26', income: 0, netWorth: 13456 },
  { date: '2025-09-27', income: 1000, netWorth: 56000 }, // Income spike
  { date: '2025-09-28', income: 1234, netWorth: 51500 },
  { date: '2025-09-29', income: 0, netWorth: 48200 },
  { date: '2025-09-30', income: 0, netWorth: 45000 },

  // Slight drop at end
  { date: '2025-10-01', income: 987, netWorth: 42000 },
  { date: '2025-10-02', income: 0, netWorth: 39500 },
  { date: '2025-10-03', income: 0, netWorth: 37500 },
];
