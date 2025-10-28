import { useGetAccounts } from '@/api/hooks/use-lunch-money-queries';
import { ScreenScrollView, Text, View } from '@/components/commons';

export default function Index() {
  const { data, isError } = useGetAccounts();

  if (isError) {
    return <Text>Error</Text>;
  }

  console.log({ data });

  return (
    <ScreenScrollView>
      <View>
        <Text>Hi</Text>
      </View>
    </ScreenScrollView>
  );
}
