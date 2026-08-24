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
            tabBarLabelStyle: { fontSize: isTablet ? 12 : 10, fontWeight: '700', letterSpacing: 0.2 },
            tabBarItemStyle: { minHeight: 48 },
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Книги',
              tabBarIcon: () => <Text style={{ fontSize: isTablet ? 22 : 16 }}>📚</Text>,
            }}
          />
          <Tabs.Screen
            name="learn"
            options={{
              title: 'Учёба',
              tabBarIcon: () => <Text style={{ fontSize: isTablet ? 22 : 16 }}>🎯</Text>,
            }}
          />
          <Tabs.Screen
            name="health"
            options={{
              title: 'Тело',
              tabBarIcon: () => <Text style={{ fontSize: isTablet ? 22 : 16 }}>⚡</Text>,
            }}
          />
          <Tabs.Screen
            name="knowledge"
            options={{
              title: 'Знания',
              tabBarIcon: () => <Text style={{ fontSize: isTablet ? 22 : 16 }}>📖</Text>,
            }}
          />
          <Tabs.Screen
            name="coach"
            options={{
              title: 'AI',
              tabBarIcon: () => <Text style={{ fontSize: isTablet ? 22 : 16 }}>🤖</Text>,
            }}
          />
        </Tabs>
      </View>
    </PhoneShell>
  );
}
