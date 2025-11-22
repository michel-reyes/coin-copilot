import { Text, View } from '@/components/commons';
import colors from '@/themes/colors';
import { View as RNView, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

const barData = [
    {
        value: 50,
        label: 'W',
        frontColor: colors['system-green'],
        barBorderRadius: 12,
    }, // saving
    {
        value: 80,
        label: 'Wants',
        frontColor: colors['system-yellow'],
        barBorderRadius: 12,
    }, // needs
    {
        value: 30,
        label: 'F',
        frontColor: colors['system-orange'],
        barBorderRadius: 12,
    },
];

export default function Gentler() {
    const { width } = useWindowDimensions();

    return (
        <View className='flex-1'>
            {/* header */}
            <RNView
                className='border border-amber-200'
                style={{
                    height: 170,
                    overflow: 'hidden',
                }}
            >
                <RNView>
                    <BarChart
                        horizontal
                        barWidth={28}
                        data={barData}
                        yAxisThickness={0}
                        xAxisThickness={0}
                        noOfSections={1}
                        hideRules
                        spacing={7}
                        disableScroll
                        disablePress
                        width={width - 35}
                        initialSpacing={10}
                        maxValue={100}
                        height={120}
                        backgroundColor={colors['system-surface-secondary']}
                        xAxisLabelTextStyle={{
                            color: 'white',
                            position: 'absolute',
                            backgroundColor: 'red',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            fontSize: 12,
                            fontWeight: 'bold',
                            fontFamily: 'SFProRoundedRegular',
                        }}
                        // hideAxesAndRules
                        floatingYAxisLabels
                    />
                </RNView>
            </RNView>
            {/* end header */}
            {/* activity status */}
            <View className='mt-10'>
                <Text
                    variant='subhead'
                    color='secondaryLabel'
                    className='uppercase'
                    style={{ letterSpacing: 1 }}
                >
                    Activity Status
                </Text>
                <Text
                    variant=''
                    className='mt-4 font-light'
                    style={{
                        letterSpacing: 1,
                        fontWeight: 300,
                        fontFamily: 'SFProRoundedRegular',
                    }}
                >
                    Oh-la-la! You met your
                </Text>
                <Text
                    variant=''
                    className=' font-light'
                    style={{
                        letterSpacing: 2,
                        fontWeight: 300,
                        fontFamily: 'SFProRoundedRegular',
                    }}
                >
                    body's need on
                </Text>
                <Text
                    variant='largeTitle'
                    className='font-light mt-5'
                    style={{ letterSpacing: 2 }}
                >
                    26 <Text variant='title2'>days</Text>
                </Text>

                <Text
                    variant='subhead'
                    color='secondaryLabel'
                    style={{ letterSpacing: 1 }}
                >
                    September: 5 days
                </Text>
            </View>
        </View>
    );
}
