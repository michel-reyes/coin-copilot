import { clsx } from 'clsx';
import { View as RNView, type ViewProps } from 'react-native';

const variantStyles = {
  default: 'transparent',
  base: 'bg-black',
  card: 'bg-system-gray rounded-xl p-5',
};

export type ThemedViewProps = ViewProps & {
  variant?: keyof typeof variantStyles;
};

export function View({ variant, className, style, ...rest }: ThemedViewProps) {
  const baseClassName = variant
    ? variantStyles[variant]
    : variantStyles.default;
  const combinedClassName = clsx(baseClassName, className);

  return (
    <RNView
      className={combinedClassName}
      style={[{ borderCurve: 'continuous' }, style]}
      {...rest}
    />
  );
}
