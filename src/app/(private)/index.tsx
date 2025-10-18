import { Text, View, Button } from 'react-native';

import { useSession } from '@/app/context/authContext';

export default function Index() {
  const { signOut, session, lunchMoneyApiKey } = useSession();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Welcome to Coin Copilot
      </Text>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, marginBottom: 10 }}>
          User ID: {session?.user?.id?.substring(0, 8)}...
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 10 }}>
          API Key Status: {lunchMoneyApiKey ? '✓ Connected' : '✗ Not found'}
        </Text>
      </View>

      <Button
        title="Sign Out"
        onPress={async () => {
          // The auth state change redirects to the sign-in screen
          await signOut();
        }}
      />
    </View>
  );
}
