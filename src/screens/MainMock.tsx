import { ParallaxScrollView, Text, View } from '@/components/commons';
import { IconSymbol } from '@/components/os/IconSymbol';
import colors from '@/themes/colors';
import { formatCurrency, formatShortCurrency } from '@/utils/number-formatter';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
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
  const number = formattedValue.match(/[\d,.]+/g)?.join('') || '';

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
    savings: 'bg-system-savings ',
    needs: 'bg-system-needs ',
    wants: 'bg-system-wants ',
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
        <View
          style={{
            width: isMeasuring ? undefined : finalWidth,
            opacity: isMeasuring ? 0 : 1,
          }}
          className={`h-[28px] ${colorVariants[color]} rounded-xl relative flex px-3 justify-center`}
        >
          <View
            className='flex-row justify-between items-center gap-1'
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
        </View>
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
              currentValue={900}
              totalValue={230}
              currencyUnit='USD'
              color='wants'
            />
          </View>
        </View>
      </View>
    </ParallaxScrollView>
  );
}
