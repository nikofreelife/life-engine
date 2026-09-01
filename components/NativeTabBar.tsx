import { useEffect } from 'react';
import { SymbolView } from 'expo-symbols';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressScale } from './PressScale';
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

const TABS: Record<
  string,
  { ios: string; android: string; web: string; label: string }
> = {
  index: { ios: 'book.fill', android: 'menu_book', web: 'menu_book', label: 'Книги' },
  learn: { ios: 'target', android: 'track_changes', web: 'track_changes', label: 'Учёба' },
  health: { ios: 'bolt.fill', android: 'bolt', web: 'bolt', label: 'Тело' },
  screentime: { ios: 'hourglass', android: 'hourglass_empty', web: 'hourglass_empty', label: 'Экран' },
  knowledge: { ios: 'text.book.closed.fill', android: 'auto_stories', web: 'auto_stories', label: 'Знания' },
  video: { ios: 'play.rectangle.fill', android: 'smart_display', web: 'smart_display', label: 'Видео' },
  coach: { ios: 'brain.head.profile', android: 'psychology', web: 'psychology', label: 'AI' },
};

export function NativeTabBar({ state, navigation, descriptors }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const width = useSharedValue(0);
  const x = useSharedValue(0);
  const n = Math.max(state.routes.length, 1);

  useEffect(() => {
    x.value = withSpring(state.index * (width.value / n), spring);
  }, [n, state.index, width, x]);

  const pill = useAnimatedStyle(() => ({
    width: Math.max(0, width.value / n - 6),
    transform: [{ translateX: x.value + 3 }],
  }));

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.shell}>
        <View
          style={styles.row}
          onLayout={(event) => {
            width.value = event.nativeEvent.layout.width;
            x.value = state.index * (event.nativeEvent.layout.width / n);
          }}>
          <Animated.View pointerEvents="none" style={[styles.pill, pill]} />
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const meta = TABS[route.name] ?? {
              ios: 'circle',
              android: 'circle',
              web: 'circle',
              label: descriptors[route.key]?.options.title ?? route.name,
            };
            const color = focused ? colors.emerald : colors.faint;
            return (
              <PressScale
                key={route.key}
                haptic="light"
                style={styles.item}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                }}>
                <SymbolView
                  name={{ ios: meta.ios as never, android: meta.android as never, web: meta.web as never }}
                  tintColor={color}
                  size={22}
                  fallback={
                    <Text style={[styles.fallback, { color }]}>{meta.label.slice(0, 1)}</Text>
                  }
                />
                <Text style={[styles.label, focused && styles.labelOn]}>{meta.label}</Text>
              </PressScale>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export const TAB_BAR_SPACE = Platform.OS === 'web' ? 92 : 108;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  shell: {
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  row: {
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 6,
  },
  pill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 22,
    backgroundColor: 'rgba(16,185,129,0.16)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    zIndex: 1,
  },
  label: {
    color: colors.faint,
    fontSize: 9,
    fontWeight: '600',
    fontFamily: fonts,
    letterSpacing: 0.2,
  },
  labelOn: { color: colors.emerald },
  fallback: { fontSize: 16, fontWeight: '700' },
});
