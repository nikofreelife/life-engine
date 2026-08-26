import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { hapticLight, hapticMedium, hapticSuccess, hapticWarning } from '../src/haptics';
import { playExhaleTone, playHoldTone, playInhaleTone, unlockBreathAudio } from '../src/tone';
import { useEngine } from '../src/store';
import { colors } from '../src/theme';
import type { BreathPace } from '../src/types';
import { uid } from '../src/lib';

const PACE: Record<BreathPace, { inhale: number; exhale: number; label: string }> = {
  slow: { inhale: 2500, exhale: 2500, label: 'Медленный' },
  normal: { inhale: 1600, exhale: 1600, label: 'Средний' },
  fast: { inhale: 1100, exhale: 1100, label: 'Быстрый' },
};

type Phase = 'setup' | 'in' | 'out' | 'retention' | 'recovery' | 'done';

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function clock(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function WimHofBreath() {
  const { addBreathLog, state } = useEngine();
  const [rounds, setRounds] = useState(3);
  const [breaths, setBreaths] = useState(30);
  const [pace, setPace] = useState<BreathPace>('normal');
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(1);
  const [count, setCount] = useState(0);
  const [holdSec, setHoldSec] = useState(0);
  const [recoverLeft, setRecoverLeft] = useState(15);
  const sessionId = useRef(uid('wh'));
  const gen = useRef(0);
  const holding = useRef(false);
  const scale = useSharedValue(0.72);
  const best = (state.breathLogs ?? []).reduce((m, log) => Math.max(m, log.retentionSec), 0);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    return () => {
      gen.current += 1;
      holding.current = false;
    };
  }, []);

  useEffect(() => {
    if (phase !== 'retention') return;
    holding.current = true;
    const started = Date.now();
    const tick = setInterval(() => {
      if (!holding.current) return;
      setHoldSec((Date.now() - started) / 1000);
    }, 100);
    return () => {
      holding.current = false;
      clearInterval(tick);
    };
  }, [phase, round]);

  useEffect(() => {
    if (phase !== 'recovery') return;
    setRecoverLeft(15);
    const started = Date.now();
    const tick = setInterval(() => {
      const left = Math.max(0, 15 - (Date.now() - started) / 1000);
      setRecoverLeft(left);
      if (left <= 0) {
        clearInterval(tick);
        void nextAfterRecovery();
      }
    }, 100);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- round captured in nextAfterRecovery via state
  }, [phase]);

  async function runBreaths(currentRound: number, token: number) {
    const timing = PACE[pace];
    setRound(currentRound);
    setCount(0);
    for (let i = 1; i <= breaths; i += 1) {
      if (gen.current !== token) return;
      setPhase('in');
      setCount(i);
      playInhaleTone();
      scale.value = withTiming(1.18, { duration: timing.inhale, easing: Easing.inOut(Easing.sin) });
      await wait(timing.inhale);
      if (gen.current !== token) return;
      setPhase('out');
      playExhaleTone();
      scale.value = withTiming(0.68, { duration: timing.exhale, easing: Easing.inOut(Easing.sin) });
      await wait(timing.exhale);
    }
    if (gen.current !== token) return;
    playHoldTone();
    setHoldSec(0);
    setPhase('retention');
  }

  function start() {
    void hapticSuccess();
    unlockBreathAudio();
    gen.current += 1;
    const token = gen.current;
    sessionId.current = uid('wh');
    void runBreaths(1, token);
  }

  function inhaleRecovery() {
    if (phase !== 'retention') return;
    void hapticMedium();
    holding.current = false;
    addBreathLog({
      id: uid('br'),
      atISO: new Date().toISOString(),
      sessionId: sessionId.current,
      round,
      retentionSec: Math.round(holdSec * 10) / 10,
      breaths,
      pace,
    });
    playInhaleTone();
    scale.value = withTiming(1.22, { duration: 600, easing: Easing.out(Easing.cubic) });
    setPhase('recovery');
  }

  async function nextAfterRecovery() {
    if (round >= rounds) {
      setPhase('done');
      return;
    }
    const token = gen.current;
    await wait(400);
    if (gen.current !== token) return;
    void runBreaths(round + 1, token);
  }

  function stop() {
    void hapticWarning();
    gen.current += 1;
    holding.current = false;
    setPhase('setup');
    setCount(0);
    setHoldSec(0);
    scale.value = withTiming(0.72, { duration: 300 });
  }

  const phaseLabel =
    phase === 'in'
      ? 'Вдох'
      : phase === 'out'
        ? 'Выдох'
        : phase === 'retention'
          ? 'Задержка на выдохе'
          : phase === 'recovery'
            ? 'Дозадержка на вдохе'
            : phase === 'done'
              ? 'Сессия закрыта'
              : 'Настройка';

  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>ДЫХАНИЕ ВИМА ХОФА</Text>
      <Text style={styles.lead}>Раунды вдохов → задержка → вдох на 15 сек. Рекорд пишется в профиль.</Text>
      {best > 0 ? <Text style={styles.best}>Личный рекорд задержки: {clock(best)}</Text> : null}

      {phase === 'setup' || phase === 'done' ? (
        <View style={styles.setup}>
          {phase === 'done' ? <Text style={styles.done}>Раунды закрыты. Рекорды сохранены.</Text> : null}
          <Text style={styles.label}>Раунды</Text>
          <View style={styles.row}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => { void hapticLight(); setRounds(n); }} style={[styles.chip, rounds === n && styles.chipOn]}>
                <Text style={[styles.chipText, rounds === n && styles.chipTextOn]}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Вдохов в раунде</Text>
          <View style={styles.row}>
            {[20, 30, 40].map((n) => (
              <Pressable key={n} onPress={() => { void hapticLight(); setBreaths(n); }} style={[styles.chip, breaths === n && styles.chipOn]}>
                <Text style={[styles.chipText, breaths === n && styles.chipTextOn]}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Темп</Text>
          <View style={styles.row}>
            {(['slow', 'normal', 'fast'] as BreathPace[]).map((id) => (
              <Pressable key={id} onPress={() => { void hapticLight(); setPace(id); }} style={[styles.chip, pace === id && styles.chipOn]}>
                <Text style={[styles.chipText, pace === id && styles.chipTextOn]}>{PACE[id].label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={start} style={styles.start}>
            <Text style={styles.startText}>{phase === 'done' ? 'Ещё сессия' : 'Старт'}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.session}>
          <Text style={styles.round}>
            Раунд {round} / {rounds} · {phaseLabel}
          </Text>
          <View style={styles.stage}>
            <Animated.View style={[styles.circle, ring]} />
            <View style={styles.center} pointerEvents="none">
              {phase === 'retention' ? (
                <Text style={styles.timer}>{clock(holdSec)}</Text>
              ) : phase === 'recovery' ? (
                <Text style={styles.timer}>{Math.ceil(recoverLeft)}</Text>
              ) : (
                <Text style={styles.counter}>
                  {count} / {breaths}
                </Text>
              )}
              <Text style={styles.hint}>
                {phase === 'in' ? 'вдох' : phase === 'out' ? 'выдох' : phase === 'recovery' ? 'держи вдох' : 'держи'}
              </Text>
            </View>
          </View>
          {phase === 'retention' ? (
            <Pressable onPress={inhaleRecovery} style={styles.inhale}>
              <Text style={styles.inhaleText}>Вдохнуть</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={stop} style={styles.stop}>
            <Text style={styles.stopText}>Стоп</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
  },
  kicker: { color: colors.cyan, fontSize: 11, fontWeight: '800', letterSpacing: 2.2 },
  lead: { color: colors.muted, marginTop: 6, lineHeight: 20, fontSize: 13 },
  best: { color: colors.emerald, fontWeight: '800', marginTop: 8, fontSize: 13 },
  setup: { marginTop: 12, gap: 8 },
  done: { color: colors.emerald, fontWeight: '800', marginBottom: 4 },
  label: { color: colors.text, fontWeight: '800', fontSize: 12, marginTop: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { borderColor: colors.cyan, backgroundColor: 'rgba(34,211,238,0.14)' },
  chipText: { color: colors.muted, fontWeight: '800' },
  chipTextOn: { color: colors.cyan },
  start: {
    marginTop: 10,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: { color: colors.bg, fontWeight: '800', fontSize: 16 },
  session: { marginTop: 8, alignItems: 'center' },
  round: { color: colors.muted, fontWeight: '700', marginBottom: 8 },
  stage: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  circle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(34,211,238,0.22)',
    borderWidth: 2,
    borderColor: colors.cyan,
  },
  center: { alignItems: 'center' },
  counter: { color: colors.text, fontSize: 36, fontWeight: '800' },
  timer: { color: colors.text, fontSize: 42, fontWeight: '800', fontVariant: ['tabular-nums'] },
  hint: { color: colors.cyan, fontWeight: '800', marginTop: 4, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 12 },
  inhale: {
    marginTop: 8,
    minHeight: 50,
    minWidth: 220,
    borderRadius: 16,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inhaleText: { color: colors.bg, fontWeight: '800', fontSize: 16 },
  stop: { marginTop: 10, padding: 8 },
  stopText: { color: colors.faint, fontWeight: '700' },
});
