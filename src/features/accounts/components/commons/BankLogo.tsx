import { Text, View } from '@/components/commons';
import { LogoImage } from '@/features/accounts/components/commons/LogoImage';

// TODO: use https://brandfetch.com/developers/logo-api for more logos
const LOGOS = {
  chase: {
    filterTerms: ['chase', 'jpmorgan'],
    image: <LogoImage source={require('@assets/company-logo/chase.webp')} />,
    color: '#0054AA',
    contrastColor: '#FFFFFF',
  },
  citi: {
    filterTerms: ['citi', 'citibank'],
    image: <LogoImage source={require('@assets/company-logo/citi.webp')} />,
    color: '#008AD0',
    contrastColor: '#FFFFFF',
  },
  capital: {
    filterTerms: ['capital'],
    image: <LogoImage source={require('@assets/company-logo/capital.webp')} />,
    color: '#003E5C',
    contrastColor: '#FFFFFF',
  },
  amex: {
    filterTerms: ['amex', 'american'],
    image: <LogoImage source={require('@assets/company-logo/amex.webp')} />,
    color: '#016FD1',
    contrastColor: '#FFFFFF',
  },
  apple: {
    filterTerms: ['apple'],
    image: <LogoImage source={require('@assets/company-logo/apple.webp')} />,
    color: '#000000',
    contrastColor: '#FFFFFF',
  },
};

export function getLogo(title: string) {
  const [nameA, nameB] = title.split(' ');
  // find a logo key by checking each logo's filterTerms against nameA and nameB
  const logoKey = (Object.keys(LOGOS) as (keyof typeof LOGOS)[]).find((key) => {
    const { filterTerms } = LOGOS[key];
    return filterTerms.some(
      (term) =>
        term.toLowerCase().includes(nameA.toLowerCase()) ||
        (nameB && term.toLowerCase().includes(nameB.toLowerCase()))
    );
  });

  if (logoKey) {
    return LOGOS[logoKey];
  }

  return null;
}

// Gradient colors mapping for company logo text
// Each letter of the alphabet is assigned a specific gradient
// These colors are chosen to look good on dark backgrounds
function getLogoGradient(letter: string): { start: string; end: string } {
  const upperLetter = letter.toUpperCase();

  // Map of 7 different gradient colors that will be repeated across the alphabet
  const gradientMap: Record<number, { start: string; end: string }> = {
    0: { start: '#FF6B6B', end: '#FF4757' }, // Red gradient
    1: { start: '#29323c', end: '#485563' }, // Cyan to Blue gradient
    2: { start: '#FFD26F', end: '#FFAF40' }, // Yellow to Orange gradient
    3: { start: '#1e3c72', end: '#2a5298' }, // Purple gradient
    4: { start: '#673AB7', end: '#512DA8' }, // Green to Teal gradient
  };

  // Convert letter to its position in the alphabet (A=0, B=1, etc.)
  const alphabetPosition = upperLetter.charCodeAt(0) - 65;

  // If the letter is not A-Z, use a default gradient
  if (alphabetPosition < 0 || alphabetPosition > 25) {
    return { start: '#A3A9B6', end: '#868B96' }; // Default gradient
  }

  // Use modulo to cycle through the 7 gradient options
  return gradientMap[alphabetPosition % 5];
}

export const BankLogo = ({ title }: { title: string }) => {
  // for no logo get the company 2 letters
  const [nameA, nameB] = title.split(' ');
  const firstLetter = nameA[0];
  const secondLetter = nameB ? nameB[0] : '';
  const logoText = (firstLetter + secondLetter).toUpperCase();

  const logo = getLogo(title);

  if (logo) {
    return logo.image;
  }

  // Get gradient colors based on the first letter
  const gradient = getLogoGradient(firstLetter || 'A');

  return (
    <View
      style={{
        borderCurve: 'continuous',
        width: 36,
        height: 36,
        borderRadius: 12,
        overflow: 'hidden',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        [process.env.EXPO_OS === 'web'
          ? `backgroundImage`
          : `experimental_backgroundImage`]: `linear-gradient(to bottom, ${gradient.start}, ${gradient.end})`,
      }}
    >
      <Text variant='headline'>{logoText}</Text>
    </View>
  );
};
