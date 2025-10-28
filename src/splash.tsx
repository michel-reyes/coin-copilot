import { useSession } from '@/context/authContext';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function SplashScreenController() {
  const { isLoading } = useSession();

  const [fontLoaded] = useFonts({
    SFProRoundedRegular: require('../assets/fonts/SFProRounded-Regular.ttf'),
    SFProRoundedSemibold: require('../assets/fonts/SFProRounded-Semibold.ttf'),
  });

  const appIsLoaded = isLoading && fontLoaded;

  if (!appIsLoaded) {
    SplashScreen.hide();
  }

  return null;
}
