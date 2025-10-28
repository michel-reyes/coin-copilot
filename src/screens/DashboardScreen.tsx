import { Text, View } from '@/components/commons';
import { Stack } from 'expo-router';

export default function DashboardScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Michel' }} />
      <View>
        <Text>DashboardScreen</Text>
      </View>
    </>
  );
}
