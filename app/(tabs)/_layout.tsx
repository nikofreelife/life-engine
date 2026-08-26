import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { EngineHeader } from '@/components/EngineHeader';
import { NativeTabBar } from '@/components/NativeTabBar';
import { PhoneShell } from '@/components/PhoneShell';
import { TabletRail } from '@/components/TabletRail';
import { RAIL_WIDTH, useEngineLayout } from '@/src/layout';
import { colors } from '@/src/theme';

export default function TabLayout() {
  const { sidebar } = useEngineLayout();

  return (
    <PhoneShell>
      {sidebar ? null : <EngineHeader />}
      <View style={{ flex: 1, flexDirection: sidebar ? 'row' : 'column', minWidth: 0, minHeight: 0 }}>
        <Tabs
          tabBar={(props) => (sidebar ? <TabletRail {...props} /> : <NativeTabBar {...props} />)}
          screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
            tabBarPosition: sidebar ? 'left' : 'bottom',
            sceneStyle: { backgroundColor: colors.bg, flex: 1, minWidth: 0 },
            tabBarStyle: sidebar
              ? {
                  width: RAIL_WIDTH,
                  flexShrink: 0,
                  position: 'relative',
                  backgroundColor: colors.card,
                  borderTopWidth: 0,
                  borderRightWidth: 1,
                  borderRightColor: colors.border,
                  elevation: 0,
                  shadowOpacity: 0,
                }
              : {
                  position: 'absolute',
                  backgroundColor: 'transparent',
                  borderTopWidth: 0,
                  elevation: 0,
                },
          }}>
          <Tabs.Screen name="index" options={{ title: 'Книги' }} />
          <Tabs.Screen name="learn" options={{ title: 'Учёба' }} />
          <Tabs.Screen name="health" options={{ title: 'Тело' }} />
          <Tabs.Screen name="knowledge" options={{ title: 'Знания' }} />
          <Tabs.Screen name="video" options={{ title: 'Видео' }} />
          <Tabs.Screen name="coach" options={{ title: 'AI' }} />
        </Tabs>
      </View>
    </PhoneShell>
  );
}
