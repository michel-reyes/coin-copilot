import { Text, View } from '@/components/commons';

export default function Gentler() {
    return (
        <View className='flex-1'>
            {/* header */}
            <View className='flex-1 gap-2'>
                <View className='h-7 bg-system-yellow rounded-md' />
            </View>
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
