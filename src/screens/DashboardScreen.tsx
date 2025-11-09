import { Divider, ScreenScrollView, Text, View } from '@/components/commons';
import { IconSymbol } from '@/components/os/IconSymbol.ios';
import AccountSummary from '@/features/accounts/AccountSummary';
import PeriodSummary from '@/features/period-summary/PeriodSummary';
import colors from '@/themes/colors';

export default function DashboardScreen() {
  return (
    <>
      <ScreenScrollView>
        <PeriodSummary />
        <View className='flex-row mx-3 gap-3 mt-12'>
          {/* left */}
          <View className='flex-1'>
            {/* title */}
            <View className='mb-3'>
              <Text variant='title3' className='mx-3'>
                Period
              </Text>
              <Text variant='headline' color='tertiaryLabel' className='mx-3'>
                Summary
              </Text>
            </View>
            <View variant='card'>
              <View className='gap-3'>
                <View className='gap-1'>
                  <Text
                    variant='footnote'
                    color='tertiaryLabel'
                    className='font-bold'
                  >
                    Income
                  </Text>
                  <Text isNumeric variant='headline'>
                    $6,000.00
                  </Text>
                </View>
                <Divider />
                <View className='gap-1'>
                  <Text
                    variant='footnote'
                    color='tertiaryLabel'
                    className='font-bold'
                  >
                    Expenses
                  </Text>
                  <View className='flex-row flex-1 gap-2 items-center'>
                    <Text isNumeric variant='headline'>
                      $3,000.00
                    </Text>
                    <IconSymbol
                      name='arrow.up.right.circle.fill'
                      size={16}
                      color={colors['system-orange']}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
          {/* right */}
          <View className='flex-1'>
            {/* title */}
            <View className='mb-3'>
              <Text variant='title3' className='mx-3'>
                Budget
              </Text>
              <Text variant='headline' color='tertiaryLabel' className='mx-3'>
                Overview
              </Text>
            </View>
            <View variant='card'>
              <View className='gap-3'>
                <View className='gap-1'>
                  <Text
                    variant='footnote'
                    color='tertiaryLabel'
                    className='font-bold'
                  >
                    Available Funds
                  </Text>
                  <Text isNumeric variant='headline'>
                    $6,000.00
                  </Text>
                </View>
                <Divider />
                <View className='gap-1'>
                  <Text
                    variant='footnote'
                    color='tertiaryLabel'
                    className='font-bold'
                  >
                    Planned Expending
                  </Text>
                  <Text isNumeric variant='headline'>
                    $3,000.00
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className='flex-1 mx-3 mt-12'>
          <AccountSummary />
        </View>
      </ScreenScrollView>
    </>
  );
}
