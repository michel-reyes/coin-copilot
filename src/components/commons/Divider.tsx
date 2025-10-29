import { View } from '@/components/commons/View';
import colors from '@/themes/colors';
import { type ViewProps as RNViewProps, StyleSheet } from 'react-native';

type DividerProps = RNViewProps & {
  orientation?: 'horizontal' | 'vertical';
};

export function Divider({
  style,
  orientation = 'horizontal',
  ...props
}: DividerProps) {
  const dividerStyle = {
    ...(orientation === 'horizontal'
      ? {
          borderBottomWidth: StyleSheet.hairlineWidth,
          marginTop: -StyleSheet.hairlineWidth,
        }
      : {
          borderLeftWidth: 0.5,
          borderLeftColor: colors['system-border'],
          height: '100%' as const,
        }),
  };

  return (
    <View
      style={[dividerStyle, style]}
      className='border-system-border'
      {...props}
    />
  );
}
