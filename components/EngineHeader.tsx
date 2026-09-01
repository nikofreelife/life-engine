import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { PressScale } from './PressScale';
import { StreakChip } from './StreakBadge';
import { displayName, useAuth } from '../src/auth';
import { hapticSuccess } from '../src/haptics';
import { useEngineLayout } from '../src/layout';
import { useEngine } from '../src/store';
import { colors, fonts, type } from '../src/theme';

type Props = {
  compact?: boolean;
};

export function EngineHeader({ compact }: Props) {
  const router = useRouter();
  const { progress, state, dismissStreakWarning, openStreakPopup } = useEngine();
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
    <View style={compact ? undefined : styles.clip}>
      <View style={[styles.wrap, compact && styles.wrapCompact, isTablet && !compact && styles.wrapTablet]}>
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
          <Text style={[styles.kicker, compact && styles.kickerCompact]} numberOfLines={1}>
            {compact ? `${displayName(user)} • Life Engine` : `Привет, ${displayName(user)} 👋`}
          </Text>
          <Text style={styles.sub}>{compact ? 'система жизни' : 'Life Engine v1.0'}</Text>
          {state.streakWarning ? <Text style={styles.warn}>стрик сброшен — день пропущен</Text> : null}
        </PressScale>
        <PressScale haptic="light" onPress={() => router.push('/profile')} style={styles.profile}>
          <Text style={styles.profileName} numberOfLines={1}>
            {displayName(user)}
          </Text>
          <Text style={styles.profileAge}>{user?.age ?? '—'} лет</Text>
        </PressScale>
        <StreakChip
          days={Math.max(0, state.visitStreak || 0)}
          compact={compact}
          onPress={() => {
            if (state.streakWarning) dismissStreakWarning();
            openStreakPopup();
          }}
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{progressLabel}</Text>
        </View>
      </View>
    </View>
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
    backgroundColor: colors.card,
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
    backgroundColor: colors.cardElevated,
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
    letterSpacing: 0.2,
    fontFamily: fonts,
  },
  kickerCompact: { fontSize: 13, letterSpacing: 0 },
  sub: {
    ...type.footnote,
    marginTop: 2,
  },
  warn: { color: colors.amber, fontSize: 11, fontWeight: '700', marginTop: 2 },
  profile: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'flex-end',
    maxWidth: 120,
  },
  profileName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  profileAge: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '600',
  },
  badge: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
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
