import { ParallaxScrollView, Text, View } from '@/components/commons';
import { IconSymbol } from '@/components/os/IconSymbol';
import colors from '@/themes/colors';
import { formatCurrency } from '@/utils/number-formatter';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable } from 'react-native';
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
  percentage,
  currentValue,
  totalValue,
  color,
}: {
  label: string;
  percentage: number;
  currentValue: string;
  totalValue: string;
  color: 'savings' | 'needs' | 'wants';
}) {
  const colorVariants = {
    savings: 'bg-system-savings ',
    needs: 'bg-system-needs ',
    wants: 'bg-system-wants ',
  };

  return (
    <View className='w-full'>
      <View className='w-full flex-row gap-2 items-center'>
        {/* Bar */}
        <View
          className={`w-[200px] h-[28px] ${colorVariants[color]} rounded-xl relative flex px-3`}
        >
          <View className='flex-row items-center h-full gap-1'>
            <Text
              variant='caption1'
              className='text-black font-semibold tracking-wider'
            >
              {label}
            </Text>
            <Text
              variant='caption1'
              className='text-black/60 font-semibold tracking-wider'
            >
              {percentage}%
            </Text>
          </View>
        </View>
        {/* x of x */}
        <View>
          <Text variant='caption1' className='font-semibold tracking-wider'>
            {currentValue}
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
            {totalValue}
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
              color={colors['system-icon']}
              size={18}
            />
          </View>

          <View>
            <CategoryPercentage
              label='Savings'
              percentage={70}
              currentValue='420'
              totalValue='600 USD'
              color='savings'
            />
            <CategoryPercentage
              label='Needs'
              percentage={54}
              currentValue='1,836'
              totalValue='3.2k USD'
              color='needs'
            />
            <CategoryPercentage
              label='Wants'
              percentage={104}
              currentValue='120'
              totalValue='100 USD'
              color='wants'
            />
          </View>
        </View>
      </View>
    </ParallaxScrollView>
  );
}
