export function formatCurrency(
    value: string | number,
    abs: boolean = false,
    removeFraction: boolean = false,
    style: 'currency' | 'decimal' = 'currency',
    notation: 'standard' | 'compact' = 'standard',
): string | number {
    // Convert string to number if necessary
    let number = typeof value === 'string' ? parseFloat(value) : value;

    // Make an absolute value if necessary
    if (abs) {
        number = Math.abs(number);
    }

    // Check if the input is a valid number
    if (isNaN(number)) {
        throw new Error('Invalid number input');
    }

    // Use Intl.NumberFormat to format the number as currency
    const formattedString = new Intl.NumberFormat('en-US', {
        style: style,
        currency: 'USD',
        minimumFractionDigits: !removeFraction ? 2 : 0,
        maximumFractionDigits: !removeFraction ? 2 : 0,
        notation: notation,
    }).format(number);

    // Return string for currency style, number for decimal style
    if (style === 'currency') {
        return formattedString;
    } else {
        // For decimal style, convert to number
        // Remove any non-numeric characters except decimal point
        const numericString = formattedString.replace(/[^0-9.-]/g, '');
        return parseFloat(numericString);
    }
}

export function formatShortCurrency(n: number) {
    const units = ['', 'K', 'M', 'B', 'T'];
    const order = Math.min(Math.floor(Math.log10(Math.abs(n)) / 3), units.length - 1);
    const num = +(n / Math.pow(1000, order)).toFixed(1);
    return `$${num}${units[order]}`;

    // TODO: enable when expo support Intl.NumberFormat

    //   new Intl.NumberFormat('en-US', {
    //       notation: 'compact',
    //       compactDisplay: 'short',
    //       style: 'currency',
    //       currency: 'USD',
    //       roundingMode: 'floor',
    //   }).format(number);
}
