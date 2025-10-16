import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { useSession } from '@/app/context/authContext';

export default function SignIn() {
  const { signIn } = useSession();


  const handleSignIn = () => {
    signIn();
    router.replace('/'); // TODO: Replace with the home screen
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text
        onPress={handleSignIn}>
        Sign In
      </Text>
    </View>
  );
}
