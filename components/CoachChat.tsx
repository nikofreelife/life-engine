import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { PressScale } from './PressScale';
import { COACH_PRESETS, coachReply, readCoachKey } from '../src/coach';
import { useEngineLayout } from '../src/layout';
import { useEngine } from '../src/store';
import { colors, fonts, radius, type } from '../src/theme';

export function CoachChat() {
  const router = useRouter();
  const { state, addCoachMessage, clearCoach } = useEngine();
  const { isTablet, tabPad } = useEngineLayout();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [ready, setReady] = useState(false);
  const scroll = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      readCoachKey().then((k) => {
        if (!alive) return;
        setHasKey(Boolean(k.trim()));
        setReady(true);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy || !hasKey) return;
    setDraft('');
    addCoachMessage('user', clean);
    setBusy(true);
    try {
      const reply = await coachReply(
        clean,
        [...state.coachMessages, { id: 'tmp', role: 'user' as const, text: clean, atISO: '' }].map((m) => ({
          role: m.role,
          text: m.text,
        })),
      );
      addCoachMessage('coach', reply);
    } catch (err) {
      const message =
        err instanceof Error && err.message === 'NO_KEY'
          ? 'API-ключ не найден. Открой профиль и вставь ключ OpenAI / OpenRouter.'
          : err instanceof Error
            ? err.message
            : 'Сеть или модель не ответили.';
      addCoachMessage('coach', `⚠ ${message}`);
    } finally {
      setBusy(false);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  if (!ready) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={colors.cyan} style={{ marginTop: 48 }} />
      </View>
    );
  }

  if (!hasKey) {
    return (
      <View style={[styles.root, { paddingBottom: isTablet ? 12 : 4 }]}>
        <View style={styles.head}>
          <View>
            <Text style={styles.kicker}>NEURAL LINK • REAL AI COACH (ONLINE)</Text>
            <Text style={styles.sub}>Живой контур. Без локальных заготовок.</Text>
          </View>
        </View>
        <View style={styles.lockCard}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>Активация ИИ-Коуча</Text>
          <Text style={styles.lockLead}>
            Для работы с живым разумом укажи свой API Key (OpenAI / OpenRouter) в Настройках Профиля.
          </Text>
          <PressScale haptic="medium" onPress={() => router.push('/profile')} style={styles.lockBtn}>
            <Text style={styles.lockBtnText}>Открыть профиль</Text>
          </PressScale>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.head, isTablet && { paddingTop: 8 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>NEURAL LINK • REAL AI COACH (ONLINE)</Text>
          <Text style={styles.sub}>Онлайн. Ответ идёт с модели, не из шаблона.</Text>
        </View>
        <PressScale haptic="light" onPress={() => clearCoach()} style={styles.keyBtn}>
          <Text style={styles.keyBtnText}>Сброс</Text>
        </PressScale>
      </View>

      <ScrollView
        ref={scroll}
        style={styles.thread}
        contentContainerStyle={styles.threadInner}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        {state.coachMessages.length === 0 ? (
          <View style={styles.hello}>
            <Text style={styles.helloTitle}>Прямой контур. Без поддакивания.</Text>
            <Text style={styles.helloLead}>
              Я режу оправдания и усиливаю точность. Тяга, дисциплина, день, срыв — говори фактом.
            </Text>
          </View>
        ) : null}
        {state.coachMessages.map((msg) => (
          <View key={msg.id} style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleCoach]}>
            <Text style={styles.role}>{msg.role === 'user' ? 'YOU' : 'COACH'}</Text>
            <Text style={styles.bubbleText}>{msg.text}</Text>
          </View>
        ))}
        {busy ? (
          <View style={[styles.bubble, styles.bubbleCoach]}>
            <ActivityIndicator color={colors.cyan} />
          </View>
        ) : null}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.presets}
        style={styles.presetRow}>
        {COACH_PRESETS.map((item) => (
          <PressScale key={item} haptic="light" onPress={() => send(item)} style={styles.preset}>
            <Text style={styles.presetText}>{item}</Text>
          </PressScale>
        ))}
      </ScrollView>

      <View style={[styles.composer, { marginBottom: 4 }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Сообщение тренеру..."
          placeholderTextColor={colors.faint}
          style={styles.input}
          multiline
          editable={!busy}
        />
        <PressScale haptic="medium" onPress={() => send(draft)} disabled={busy} style={styles.send}>
          <Text style={styles.sendText}>SEND</Text>
        </PressScale>
      </View>
      <View style={{ height: Math.max(8, tabPad - 72) }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  kicker: {
    color: colors.cyan,
    fontWeight: '700',
    letterSpacing: 1.1,
    fontSize: 11,
    fontFamily: fonts,
  },
  sub: { ...type.footnote, marginTop: 4 },
  keyBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  keyBtnText: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  lockCard: {
    marginTop: 28,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: 22,
    gap: 12,
  },
  lockIcon: { fontSize: 28 },
  lockTitle: { ...type.title },
  lockLead: { ...type.footnote, lineHeight: 20 },
  lockBtn: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBtnText: { color: colors.bg, fontWeight: '700', fontSize: 16 },
  thread: { flex: 1, marginTop: 12 },
  threadInner: { gap: 12, paddingBottom: 16 },
  hello: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
  },
  helloTitle: { ...type.headline },
  helloLead: { ...type.footnote, lineHeight: 20 },
  bubble: {
    maxWidth: '92%',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.cardElevated,
    borderColor: 'rgba(34,211,238,0.35)',
  },
  bubbleCoach: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderColor: 'rgba(139,92,246,0.35)',
  },
  role: { color: colors.faint, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 6 },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 22, fontFamily: fonts },
  presetRow: { flexGrow: 0, maxHeight: 52 },
  presets: {
    gap: 8,
    paddingVertical: 8,
    paddingRight: 12,
    alignItems: 'center',
  },
  preset: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#1A1E29',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
    fontFamily: fonts,
  },
  composer: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', paddingBottom: 8 },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts,
    fontSize: 17,
  },
  send: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: colors.bg, fontWeight: '800', letterSpacing: 1 },
});
