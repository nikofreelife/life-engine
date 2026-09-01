import { useEffect } from 'react';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { EngineHeader } from './EngineHeader';
import { PressScale } from './PressScale';
import { RAIL_WIDTH } from '../src/layout';
import { colors, fonts, spring } from '../src/theme';

type TabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
  descriptors: Record<string, { options: { title?: string } }>;
};

const ICONS: Record<string, { ios: string; android: string; web: string }> = {
  index: { ios: 'book.fill', android: 'menu_book', web: 'menu_book' },
  learn: { ios: 'target', android: 'track_changes', web: 'track_changes' },
  health: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' },
  screentime: { ios: 'hourglass', android: 'hourglass_empty', web: 'hourglass_empty' },
  knowledge: { ios: 'text.book.closed.fill', android: 'auto_stories', web: 'auto_stories' },
  video: { ios: 'play.rectangle.fill', android: 'smart_display', web: 'smart_display' },
  coach: { ios: 'brain.head.profile', android: 'psychology', web: 'psychology' },
};

export function TabletRail({ state, navigation, descriptors }: TabBarProps) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withSpring(state.index * 60, spring);
  }, [state.index, y]);
  const pill = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return (
    <View style={styles.rail}>
      <EngineHeader compact />
      <ScrollView
        style={styles.nav}
        contentContainerStyle={styles.navInner}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.stack}>
          <Animated.View pointerEvents="none" style={[styles.pill, pill]} />
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { options } = descriptors[route.key];
            const label = options.title ?? route.name;
            const icon = ICONS[route.name] ?? { ios: 'circle', android: 'circle', web: 'circle' };
            const tint = focused ? colors.emerald : colors.muted;
            return (
              <PressScale
                key={route.key}
                haptic="light"
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                }}
                style={styles.item}>
                <SymbolView
                  name={{ ios: icon.ios as never, android: icon.android as never, web: icon.web as never }}
                  tintColor={tint}
                  size={20}
                  fallback={<Text style={{ color: tint }}>•</Text>}
                />
                <Text style={[styles.label, focused && styles.labelOn]}>{label}</Text>
              </PressScale>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: RAIL_WIDTH,
    flexShrink: 0,
    height: '100%',
    backgroundColor: colors.card,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: 14,
    paddingBottom: 20,
    overflow: 'hidden',
    zIndex: 4,
  },
  nav: { flex: 1 },
  navInner: { paddingTop: 8, paddingBottom: 12 },
  stack: { position: 'relative', gap: 8 },
  pill: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  label: { color: colors.muted, fontSize: 16, fontWeight: '600', fontFamily: fonts, flex: 1 },
  labelOn: { color: colors.text },
});
