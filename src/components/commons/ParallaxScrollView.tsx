import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';

import { View } from '@/components/commons';
import colors from '@/themes/colors';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor?: { dark?: string; light?: string };
  headerBackground?: ReactElement;
}>;

export function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
  headerBackground,
}: Props) {

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT * 0.95, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [1.1, 1, 1]),
        },
      ],
    };
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ backgroundColor: colors['system-black'], flex: 1 }}
      scrollEventThrottle={16}>
      <Animated.View
        style={[
          styles.header,
          { backgroundColor: headerBackgroundColor?.dark || colors['system-black'] },
          headerAnimatedStyle,
        ]}>
        {headerBackground ? (
          <Animated.View style={StyleSheet.absoluteFill}>{headerBackground}</Animated.View>
        ) : null}
        {headerImage}
      </Animated.View>
      <View className='flex-1 p-8 gap-4 overflow-hidden'>{children}</View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({

  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
});
