'use client';

import { forwardRef } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ScreenScrollView = forwardRef<any, ScrollViewProps>((props, ref) => {
    const { bottom } = useSafeAreaInsets();
    return (
        <ScrollView
            automaticallyAdjustsScrollIndicatorInsets
            contentInsetAdjustmentBehavior="automatic"
            contentInset={{ bottom: bottom }}
            scrollIndicatorInsets={{ bottom: bottom }}
            {...props}
            style={[props.style]}
            ref={ref}
        />
    );
});

ScreenScrollView.displayName = 'ScreenScrollView';
