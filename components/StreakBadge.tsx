import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

import { PressScale } from './PressScale';
import { colors, fonts } from '../src/theme';

function Spark({ delay, left }: { delay: number; left: number }) {
  const lift = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(lift, { toValue: 1, duration: 720, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
            Animated.timing(fade, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(lift, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, fade, lift]);

  if (Platform.OS === 'web') {
    return (
        <Text nativeID="le-spark" style={[styles.spark, { left }]} {...({ className: 'le-spark' } as object)}>
        ✦
      </Text>
    );
  }

  return (
    <Animated.Text
      style={[
        styles.spark,
        {
          left,
          opacity: fade,
          transform: [
            {
              translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [4, -12] }),
            },
            {
              translateX: lift.interpolate({ inputRange: [0, 1], outputRange: [0, left > 8 ? 6 : -6] }),
            },
          ],
        },
      ]}>
      ✦
    </Animated.Text>
  );
}

function FireMark({ size = 16 }: { size?: number }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.28, duration: 420, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.9, duration: 420, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glow, { toValue: 0.78, duration: 420, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 1, duration: 420, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, glow]);

  return (
    <View style={styles.fireWrap}>
      <Spark delay={0} left={-2} />
      <Spark delay={220} left={10} />
      <Spark delay={440} left={4} />
      {Platform.OS === 'web' ? (
        <Text style={{ fontSize: size }} {...({ className: 'le-flame' } as object)}>
          🔥
        </Text>
      ) : (
        <Animated.Text
          style={{
            fontSize: size,
            opacity: glow,
            transform: [{ scale: pulse }],
          }}>
          🔥
        </Animated.Text>
      )}
    </View>
  );
}

export function StreakChip({
  days,
  compact,
  onPress,
}: {
  days: number;
  compact?: boolean;
  onPress?: () => void;
}) {
  return (
    <PressScale onPress={onPress} style={[styles.chip, compact && styles.chipCompact]}>
      <FireMark size={compact ? 13 : 15} />
      <Text style={[styles.chipText, compact && styles.chipTextCompact]}>Стрик: {days} дн.</Text>
    </PressScale>
  );
}

export function StreakBanner({ days, onDismiss }: { days: number; onDismiss: () => void }) {
  return (
    <PressScale onPress={onDismiss} style={styles.banner}>
      <FireMark size={22} />
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerTitle}>🔥 Стрик обновлен!</Text>
        <Text style={styles.bannerLead}>Ты в строю уже {days} дн. подряд!</Text>
      </View>
      <Text style={styles.bannerClose}>OK</Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  fireWrap: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  spark: {
    position: 'absolute',
    top: -2,
    fontSize: 7,
    color: '#FDBA74',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.45)',
    backgroundColor: 'rgba(249,115,22,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipCompact: { paddingHorizontal: 8, paddingVertical: 5 },
  chipText: {
    color: '#F97316',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: fonts,
    fontVariant: ['tabular-nums'],
  },
  chipTextCompact: { fontSize: 11 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#1A140C',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.45)',
  },
  bannerTitle: { color: colors.text, fontWeight: '800', fontSize: 15 },
  bannerLead: { color: colors.muted, marginTop: 2, fontSize: 13, fontWeight: '600' },
  bannerClose: { color: '#F97316', fontWeight: '800', fontSize: 12 },
});
