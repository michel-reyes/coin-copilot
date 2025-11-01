import { Text, View } from '@/components/commons';
import { IconSymbol } from '@/components/os/IconSymbol';
import colors from '@/themes/colors';

export default function AccountMask({ mask }: { mask: string }) {
    return (
        <View className='flex-row items-center gap-1'>
            <IconSymbol
                name='ellipsis'
                color={colors['system-icon']}
                size={24}
            />
            <Text variant='headline' color='tertiaryLabel'>
                {mask}
            </Text>
        </View>
    );
}
