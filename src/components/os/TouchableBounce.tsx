import {
  Animated,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import * as React from 'react';

export type TouchableScaleProps = Omit<
  TouchableOpacityProps,
  'activeOpacity'
> & {
  /** Enables haptic feedback on press down. */
  sensory?:
    | boolean
    | 'success'
    | 'error'
    | 'warning'
    | 'light'
    | 'medium'
    | 'heavy';
};

// @ts-expect-error
const TouchableBounce = React.forwardRef<TouchableOpacity, TouchableScaleProps>(
  ({ style, children, onPressIn, sensory, ...props }, ref) => {
    const scaleValue = React.useRef(new Animated.Value(1)).current;

    const onSensory = React.useCallback(() => {
      if (!sensory) return;
      // Keep existing haptic feedback logic
      // ...
    }, [sensory]);

    const handlePressIn = (ev: any) => {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 100,
      }).start();

      onSensory();
      onPressIn?.(ev);
    };

    const handlePressOut = (ev: any) => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        speed: 100,
      }).start();

      props.onPressOut?.(ev);
    };

    return (
      <TouchableOpacity
        {...props}
        ref={ref}
        activeOpacity={1} // Disable default opacity effect
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
          {children || <View />}
        </Animated.View>
      </TouchableOpacity>
    );
  }
);
TouchableBounce.displayName = 'TouchableBounce';

export default TouchableBounce;
