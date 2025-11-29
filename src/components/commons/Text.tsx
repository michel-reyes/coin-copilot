import { clsx } from 'clsx';
import { Text as RNText, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
    variant?:
        | 'largeTitle'
        | 'title1'
        | 'title2'
        | 'title3'
        | 'headline'
        | 'body'
        | 'callout'
        | 'footnote'
        | 'caption1'
        | 'caption2'
        | 'subhead'
        | '';
    color?:
        | 'label'
        | 'secondaryLabel'
        | 'tertiaryLabel'
        | 'quaternaryLabel'
        | 'link'
        | 'success'
        | 'error'
        | 'warning'
        | 'warning-orange'
        | '';
    isNumeric?: boolean;
};

export function Text({
    variant,
    color,
    className,
    style,
    isNumeric,
    ...rest
}: ThemedTextProps) {
    // Check if className contains font-semibold or font-bold
    const isBoldFont =
        className?.includes('font-semibold') ||
        className?.includes('font-bold');

    // Check if style has fontWeight of 500 or 600
    const styleWeight =
        style && typeof style === 'object' && 'fontWeight' in style
            ? style.fontWeight
            : null;
    const isBoldWeight =
        styleWeight === '500' ||
        styleWeight === '600' ||
        styleWeight === 500 ||
        styleWeight === 600;

    // Determine which font to use based on variant and bold status
    const shouldUseSemibold = isBoldFont || isBoldWeight;

    return (
        <RNText
            dynamicTypeRamp='body'
            className={clsx(
                // Base variant classes (lowest precedence)
                {
                    'text-[64px] font-bold': variant === 'largeTitle',
                    'text-[35px] font-bold': variant === 'title1',
                    'text-[29px] font-bold': variant === 'title2',
                    'text-[20px] font-bold': variant === 'title3',
                    'text-[18px] font-bold tracking-wide':
                        variant === 'headline',
                    'text-[17px]': variant === 'body' || !variant,
                    'text-[16px]': variant === 'callout',
                    'text-[15px] tracking-wide': variant === 'footnote',
                    'text-[14px] tracking-wide': variant === 'subhead',
                    'text-[13px] tracking-wide': variant === 'caption1',
                    'text-[11px] tracking-wide': variant === 'caption2',
                },
                // Default color classes (medium precedence)
                {
                    'text-white': color === 'label' || !color,
                    'text-neutral-400': color === 'secondaryLabel',
                    'text-neutral-500': color === 'tertiaryLabel',
                    'text-neutral-600': color === 'quaternaryLabel',
                    'text-system-blue': color === 'link',
                    'text-system-green': color === 'success',
                    'text-system-red': color === 'error',
                    'text-system-yellow': color === 'warning',
                    'text-system-orange': color === 'warning-orange',
                },
                // Custom className (highest precedence)
                className
            )}
            style={[
                {
                    // Use tabular numbers for numeric content to improve alignment
                    fontVariant: isNumeric ? ['tabular-nums'] : undefined,
                    // Prefer monospaced SF fonts when numeric mode is enabled.
                    // If numeric + semibold, use SFMonoSemibold; otherwise SFMonoRegular.
                    // If not numeric, keep the rounded SFProRounded family logic.
                    fontFamily: isNumeric
                        ? shouldUseSemibold
                            ? 'SFMonoSemibold'
                            : 'SFMonoRegular'
                        : shouldUseSemibold
                          ? 'SFProRoundedSemibold'
                          : 'SFProRoundedRegular',
                },
                // Custom style overrides everything
                style,
            ]}
            {...rest}
        />
    );
}
