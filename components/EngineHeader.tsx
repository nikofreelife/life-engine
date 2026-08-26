import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { PressScale } from './PressScale';
import { useAuth } from '../src/auth';
import { hapticSuccess } from '../src/haptics';
import { useEngineLayout } from '../src/layout';
import { useEngine } from '../src/store';
import { colors, fonts, type } from '../src/theme';

type Props = {
  compact?: boolean;
};

export function EngineHeader({ compact }: Props) {
  const router = useRouter();
  const { progress } = useEngine();
  const { user } = useAuth();
  const { isTablet } = useEngineLayout();
  const progressLabel = `${progress.done}/${progress.total}`;
  const taps = useRef<{ count: number; last: number }>({ count: 0, last: 0 });
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onUnlock = () => {
    void hapticSuccess();
    router.push('/secret');
  };

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
    holdTimer.current = setTimeout(() => {
      onUnlock();
    }, 3000);
  };

  const endHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  return (
    <Animated.View entering={FadeInDown.duration(420)} style={compact ? undefined : styles.clip}>
      <BlurView
        intensity={compact ? 0 : 42}
        tint="systemUltraThinMaterialDark"
        style={[styles.wrap, compact && styles.wrapCompact, isTablet && !compact && styles.wrapTablet]}>
        <PressScale
          haptic="none"
          onPressIn={startHold}
          onPressOut={endHold}
          style={[styles.mark, compact && styles.markCompact]}>
          <LinearGradient
            colors={['#10B981', '#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.markInner}
          />
        </PressScale>
        <PressScale haptic="light" onPress={registerTap} style={styles.titles}>
          <Text style={[styles.kicker, compact && styles.kickerCompact]}>LIFE ENGINE</Text>
          <Text style={styles.sub}>v1.0 · система жизни</Text>
        </PressScale>
        <PressScale haptic="light" onPress={() => router.push('/profile')} style={styles.profile}>
          <Text style={styles.profileAge}>{user?.age ?? '—'} лет</Text>
        </PressScale>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{progressLabel}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: colors.glass,
  },
  wrapCompact: {
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 18,
    flexWrap: 'wrap',
    backgroundColor: 'transparent',
  },
  wrapTablet: {
    paddingHorizontal: 44,
    paddingTop: 14,
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
  markInner: {
    flex: 1,
    borderRadius: 11,
  },
  titles: { flex: 1, minWidth: 80 },
  kicker: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2.4,
    fontFamily: fonts,
  },
  kickerCompact: { fontSize: 13, letterSpacing: 1.6 },
  sub: {
    ...type.footnote,
    marginTop: 2,
  },
  profile: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  profileAge: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '600',
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
