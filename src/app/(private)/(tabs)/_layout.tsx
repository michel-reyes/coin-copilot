import { NativeTabs, Icon } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';

export default function TabsLayout() {
    return (
        <NativeTabs>
            <NativeTabs.Trigger name='index' options={{ title: 'Home' }}>
                <Icon src={<SymbolView name='house.fill' size={24} />} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name='activity' options={{ title: 'Activity' }}>
                <Icon
                    src={
                        <SymbolView
                            name='list.bullet.clipboard.fill'
                            size={24}
                        />
                    }
                />
            </NativeTabs.Trigger>
            _layouts
            <NativeTabs.Trigger name='trend' options={{ title: 'Trend' }}>
                <Icon
                    src={
                        <SymbolView
                            name='chart.line.uptrend.xyaxis'
                            size={24}
                        />
                    }
                />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
