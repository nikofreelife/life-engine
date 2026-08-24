import { Tabs } from 'expo-router';
import { Platform, Text, View } from 'react-native';

import { EngineHeader } from '@/components/EngineHeader';
import { PhoneShell } from '@/components/PhoneShell';
import { TabletRail } from '@/components/TabletRail';
import { useEngineLayout } from '@/src/layout';
import { colors } from '@/src/theme';

export default function TabLayout() {
  const { sidebar, isTablet } = useEngineLayout();

  return (
    <PhoneShell>
      {sidebar ? null : <EngineHeader />}
      <View style={{ flex: 1 }}>
        <Tabs
          tabBar={sidebar ? (props) => <TabletRail {...props} /> : undefined}
          screenOptions={{
            headerShown: false,
            tabBarPosition: sidebar ? 'left' : 'bottom',
            tabBarActiveTintColor: colors.emerald,
            tabBarInactiveTintColor: colors.faint,
            tabBarStyle: sidebar
              ? {
                  width: 248,
                  backgroundColor: colors.card,
                  borderTopWidth: 0,
                  borderRightWidth: 1,
                  borderRightColor: colors.border,
                  elevation: 0,
                  shadowOpacity: 0,
                }
              : {
                  backgroundColor: colors.bg,
                  borderTopColor: colors.border,
                  height: Platform.OS === 'web' ? 64 : isTablet ? 84 : 78,
                  paddingTop: 8,
                },
            tabBarLabelStyle: { fontSize: isTablet ? 13 : 11, fontWeight: '700', letterSpacing: 0.3 },
            tabBarItemStyle: { minHeight: 48 },
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Книги',
              tabBarIcon: () => <Text style={{ fontSize: isTablet ? 22 : 17 }}>📚</Text>,
            }}
          />
          <Tabs.Screen
            name="learn"
            options={{
              title: 'Обучение',
              tabBarIcon: () => <Text style={{ fontSize: isTablet ? 22 : 17 }}>🎯</Text>,
            }}
          />
          <Tabs.Screen
            name="health"
            options={{
              title: 'Здоровье',
              tabBarIcon: () => <Text style={{ fontSize: isTablet ? 22 : 17 }}>⚡</Text>,
            }}
          />
        </Tabs>
      </View>
    </PhoneShell>
  );
}
