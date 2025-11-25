function formatCurrency(
  value,
  abs = false,
  removeFraction = false,
  style = 'currency',
  notation = 'standard',
  currencyDisplay = 'symbol'
) {
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
    currencyDisplay: currencyDisplay,
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

try {
  const val = -19;
  const formatted = formatCurrency(
    val,
    false,
    true,
    'currency',
    'compact',
    'code'
  );
  console.log(`Value: ${val}`);
  console.log(`Formatted: "${formatted}"`);

  const symbol = formatted.match(/[a-zA-Z]+/g)?.join('') || '';
  const numberOld = formatted.match(/[\d,.]+/g)?.join('') || '';
  const numberNew = formatted.match(/[-\d,.]+/g)?.join('') || '';

  console.log(`Symbol: "${symbol}"`);
  console.log(`Number (Old): "${numberOld}"`);
  console.log(`Number (New): "${numberNew}"`);

  // Check for special minus sign
  const codePoints = [];
  for (let i = 0; i < formatted.length; i++) {
    codePoints.push(formatted.codePointAt(i).toString(16));
  }
  console.log(`Code points: ${codePoints.join(' ')}`);
} catch (e) {
  console.error(e);
}
