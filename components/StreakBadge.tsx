import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressScale } from './PressScale';
import { hapticSuccess } from '../src/haptics';
import { colors, fonts } from '../src/theme';

const FIRE_GIF = require('../assets/streak/fire.gif');
const WIN_SOUND = require('../assets/sounds/streak-win.mp3');

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

export function daysInLine(days: number) {
  const n = Math.max(1, Math.round(days));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ДЕНЬ В СТРОЮ!`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ДНЯ В СТРОЮ!`;
  return `${n} ДНЕЙ В СТРОЮ!`;
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
    <PressScale haptic="success" onPress={onPress} style={[styles.chip, compact && styles.chipCompact]}>
      <FireMark size={compact ? 13 : 15} />
      <Text style={[styles.chipText, compact && styles.chipTextCompact]}>Стрик: {days} дн.</Text>
    </PressScale>
  );
}

export function StreakFireModal({ days, onDismiss }: { days: number; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  const player = useAudioPlayer(WIN_SOUND);

  useEffect(() => {
    void hapticSuccess();
    void (async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false });
      } catch {
        /* web / unsupported */
      }
      try {
        player.seekTo(0);
        player.play();
      } catch {
        /* missing native audio */
      }
    })();
  }, [player]);

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={onDismiss}>
      <Pressable
        style={[styles.modalRoot, { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 20) }]}
        onPress={onDismiss}>
        <Text style={styles.modalKicker}>STREAK · LIFE ENGINE</Text>
        <View style={styles.fireCard}>
          <Image source={FIRE_GIF} style={styles.fireGif} resizeMode="cover" />
          <View style={styles.fireGlow} />
          <Text style={styles.modalTitle}>{daysInLine(days)}</Text>
          <Text style={styles.modalLead}>Огонь засчитан. Тапни 🔥 в шапке — и этот экран откроется снова.</Text>
        </View>
        <PressScale haptic="success" onPress={onDismiss} style={styles.modalBtn}>
          <Text style={styles.modalBtnText}>Продолжить</Text>
        </PressScale>
      </Pressable>
    </Modal>
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
  modalRoot: {
    flex: 1,
    backgroundColor: '#07040A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    gap: 18,
  },
  modalKicker: {
    color: '#F97316',
    fontWeight: '800',
    letterSpacing: 2.4,
    fontSize: 11,
  },
  fireCard: {
    width: '100%',
    maxWidth: 420,
    aspectRatio: 1,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#140C08',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.55)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 28,
    paddingHorizontal: 18,
  },
  fireGif: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  fireGlow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7,4,10,0.22)',
    pointerEvents: 'none',
  },
  modalTitle: {
    color: '#FFF7ED',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.4,
    ...(Platform.OS === 'web'
      ? ({ textShadow: '0px 2px 8px rgba(0,0,0,0.65)' } as object)
      : {
          textShadowColor: 'rgba(0,0,0,0.65)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 8,
        }),
  },
  modalLead: {
    color: '#FED7AA',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalBtn: {
    backgroundColor: '#F97316',
    borderRadius: 16,
    minHeight: 52,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalBtnText: { color: '#1C1008', fontWeight: '900', fontSize: 16 },
});
