import { ParallaxScrollView, Text, View } from '@/components/commons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

function SvgComponent(props: any) {
    return (
        <View className="pt-12 flex-1">
            <Svg viewBox="0 0 800 400">
                <Path d="M100,100 Q150,50 200,100" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" />
                <Path d="M600,100 Q650,50 700,100" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" />
                <Path d="M300,250 Q400,350 500,250" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" />
            </Svg>
        </View>
    );
}

function HeaderGradient() {
    return (
        <LinearGradient
            colors={[
                'rgba(20,28,32,1)',
                'rgba(20,28,32,0.87)',
                'rgba(0,0,0,1)'
            ]}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 280,
            }}
        />
    )
}

export default function MainMock() {
    return (
        <ParallaxScrollView headerImage={<SvgComponent />} headerBackground={<HeaderGradient />}>
            <View>
                <Text>MainMock</Text>
            </View>
        </ParallaxScrollView>
    )
}