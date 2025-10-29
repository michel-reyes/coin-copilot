import { Pressable } from 'react-native';
import { IconSymbol } from '@/components/os/IconSymbol';
import colors from '@/themes/colors';
import { useRouter } from 'expo-router';

export default function StackBack() {
  const router = useRouter();

  return (
    <Pressable hitSlop={10} onPress={() => router.back()}>
      <IconSymbol name='chevron.left' color={colors['system-blue']} size={24} />
    </Pressable>
  );
}
