import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useEngineLayout } from '../src/layout';
import { useEngine } from '../src/store';
import { colors } from '../src/theme';

type Props = {
  compact?: boolean;
};

export function EngineHeader({ compact }: Props) {
  const router = useRouter();
  const { progress } = useEngine();
  const { isTablet } = useEngineLayout();
  const progressLabel = `${progress.done}/${progress.total}`;
  const taps = useRef<{ count: number; last: number }>({ count: 0, last: 0 });
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);

  const onUnlock = () => router.push('/secret');

  const registerTap = () => {
    const now = Date.now();
    if (now - taps.current.last > 1400) taps.current.count = 0;
    taps.current.count += 1;
    taps.current.last = now;
    if (taps.current.count >= 5) {
      taps.current.count = 0;
      onUnlock();
    }
  };

  const startHold = () => {
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      setHolding(false);
      onUnlock();
    }, 3000);
  };

  const endHold = () => {
    setHolding(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(500)}
      style={[styles.wrap, compact && styles.wrapCompact, isTablet && !compact && styles.wrapTablet]}>
      <Pressable
        onPressIn={startHold}
        onPressOut={endHold}
        style={({ pressed }) => [styles.mark, compact && styles.markCompact, holding || pressed ? styles.markHot : null]}>
        <LinearGradient
          colors={['#10B981', '#3B82F6', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.markInner}
        />
      </Pressable>
      <Pressable onPress={registerTap} style={styles.titles} hitSlop={8}>
        <Text style={[styles.kicker, compact && styles.kickerCompact]}>LIFE ENGINE</Text>
        <Text style={styles.sub}>v1.0 · система жизни</Text>
      </Pressable>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{progressLabel}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  wrapCompact: {
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 16,
    flexWrap: 'wrap',
  },
  wrapTablet: {
    paddingHorizontal: 36,
    paddingTop: 12,
    paddingBottom: 16,
  },
  mark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    padding: 2,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  markCompact: { width: 36, height: 36, borderRadius: 12 },
  markHot: {
    borderColor: colors.crimson,
    transform: [{ scale: 0.96 }],
  },
  markInner: {
    flex: 1,
    borderRadius: 11,
  },
  titles: { flex: 1, minWidth: 120 },
  kicker: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3.2,
  },
  kickerCompact: { fontSize: 13, letterSpacing: 1.6 },
  sub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  badge: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: colors.emerald,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
