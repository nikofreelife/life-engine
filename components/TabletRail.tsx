import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EngineHeader } from './EngineHeader';
import { colors } from '../src/theme';

const ICONS: Record<string, string> = {
  index: '📚',
  learn: '🎯',
  health: '⚡',
};

type RailProps = {
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

export function TabletRail({ state, navigation, descriptors }: RailProps) {
  return (
    <View style={styles.rail}>
      <EngineHeader compact />
      <View style={styles.nav}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={({ pressed }) => [styles.item, focused && styles.itemOn, pressed && styles.itemHover]}>
              <Text style={styles.icon}>{ICONS[route.name] ?? '•'}</Text>
              <Text style={[styles.label, focused && styles.labelOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>Удержи логотип 3 сек{'\n'}или 5 тапов по названию</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 248,
    backgroundColor: colors.card,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  nav: { flex: 1, gap: 8, paddingTop: 8 },
  item: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemOn: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.border,
  },
  itemHover: { backgroundColor: colors.cardElevated },
  icon: { fontSize: 20 },
  label: { color: colors.muted, fontSize: 16, fontWeight: '700' },
  labelOn: { color: colors.text },
  hint: { color: colors.faint, fontSize: 11, lineHeight: 16, paddingHorizontal: 8 },
});
