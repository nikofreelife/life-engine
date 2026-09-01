import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressScale } from './PressScale';
import { hapticSuccess, hapticWarning } from '../src/haptics';
import { unlockUntilMidnight } from '@/modules/life-engine-screentime';
import { useEngine } from '../src/store';
import { colors } from '../src/theme';

export function ScreenTimeLock() {
  const { state, submitScreenPhrase, setScreenBypassUntil } = useEngine();
  const insets = useSafeAreaInsets();
  const unlock = state.screenTime.unlock;
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft('');
    setError('');
  }, [unlock?.completed, unlock?.startedAt]);

  if (!unlock) return null;

  const total = Math.max(1, state.screenTime.repeats);
  const done = Math.min(unlock.completed, total);
  const ratio = done / total;
  const target = state.screenTime.phrase.replace(/\s+/g, ' ').trim();

  const submit = async (value = draft) => {
    const result = submitScreenPhrase(value);
    if (result === 'mismatch') {
      void hapticWarning();
      setError('Фраза не совпала. Строка не засчитана.');
      setDraft('');
      return;
    }
    if (result === 'ok') {
      setDraft('');
      setError('');
      return;
    }
    if (result === 'unlocked') {
      void hapticSuccess();
      setDraft('');
      const until = await unlockUntilMidnight();
      if (until) setScreenBypassUntil(until);
    }
  };

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={() => undefined}>
      <KeyboardAvoidingView
        style={[styles.root, { paddingTop: insets.top + 18, paddingBottom: Math.max(insets.bottom, 18) }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.kicker}>LOCK SCREEN · FAMILY CONTROLS</Text>
        <Text style={styles.emoji}>📱</Text>
        <Text style={styles.title}>Системный щит активен</Text>
        <Text style={styles.lead}>
          iOS заблокировал выбранные приложения через ManagedSettings. Единственный обход — ввести фразу ровно {total}{' '}
          раз. После 100% щит снимается до 00:00.
        </Text>
        <View style={styles.quote}>
          <Text style={styles.quoteText}>{state.screenTime.phrase}</Text>
        </View>
        <Text style={styles.progressLabel}>
          Введено: {done} / {total} повторений
        </Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.round(ratio * 100)}%` }]} />
        </View>
        <TextInput
          value={draft}
          onChangeText={(text) => {
            setError('');
            setDraft(text);
            if (text.replace(/\s+/g, ' ').trim() === target) void submit(text);
          }}
          onSubmitEditing={() => void submit()}
          placeholder="Введи фразу целиком"
          placeholderTextColor={colors.faint}
          style={styles.input}
          autoFocus
          autoCorrect={false}
          autoCapitalize="sentences"
          returnKeyType="done"
          blurOnSubmit={false}
        />
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <Text style={styles.hint}>Точное совпадение. Одна ошибка — строка сгорает.</Text>
        )}
        <PressScale haptic="rigid" onPress={() => void submit()} style={styles.submit}>
          <Text style={styles.submitText}>Засчитать повтор</Text>
        </PressScale>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07080C',
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  kicker: {
    color: colors.crimson,
    fontWeight: '800',
    letterSpacing: 3,
    fontSize: 11,
    textAlign: 'center',
  },
  emoji: { fontSize: 42, textAlign: 'center', marginTop: 18 },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  lead: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  quote: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.crimson + '55',
    borderRadius: 16,
    padding: 14,
  },
  quoteText: { color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  progressLabel: {
    color: colors.text,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 8,
  },
  barTrack: {
    height: 10,
    borderRadius: 99,
    backgroundColor: '#12151E',
    overflow: 'hidden',
    marginBottom: 16,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.crimson,
    borderRadius: 99,
  },
  input: {
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
    fontSize: 15,
  },
  error: { color: colors.crimson, fontWeight: '700', marginTop: 10 },
  hint: { color: colors.faint, fontSize: 12, marginTop: 10, lineHeight: 18 },
  submit: {
    marginTop: 16,
    backgroundColor: colors.crimson,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: colors.white, fontWeight: '800' },
});
