import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { COACH_PRESETS, coachReply, readCoachKey, writeCoachKey } from '../src/coach';
import { useEngineLayout } from '../src/layout';
import { useEngine } from '../src/store';
import { colors } from '../src/theme';

export function CoachChat() {
  const { state, addCoachMessage, clearCoach } = useEngine();
  const { isTablet } = useEngineLayout();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    readCoachKey().then((k) => {
      setHasKey(Boolean(k));
      setApiKey(k);
    });
  }, []);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setDraft('');
    addCoachMessage('user', clean);
    setBusy(true);
    const reply = await coachReply(
      clean,
      [...state.coachMessages, { id: 'tmp', role: 'user' as const, text: clean, atISO: '' }].map((m) => ({
        role: m.role,
        text: m.text,
      })),
    );
    addCoachMessage('coach', reply);
    setBusy(false);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0B0D12', '#10151F', '#0B1220']} style={StyleSheet.absoluteFill} />
      <View style={styles.scan} pointerEvents="none" />
      <View style={[styles.head, isTablet && { paddingTop: 8 }]}>
        <View>
          <Text style={styles.kicker}>NEURAL LINK · DISCIPLINE COACH</Text>
          <Text style={styles.sub}>
            {hasKey ? 'Онлайн-контур + локальный каркас' : 'Локальный каркас · ключ API опционален'}
          </Text>
        </View>
        <Pressable onPress={() => setKeyOpen((v) => !v)} style={styles.keyBtn}>
          <Text style={styles.keyBtnText}>{keyOpen ? 'Закрыть' : 'API'}</Text>
        </Pressable>
      </View>

      {keyOpen ? (
        <View style={styles.keyBox}>
          <Text style={styles.keyLead}>
            OpenAI ключ хранится на устройстве. Пусто — только локальный тренер. Без ключа приложение полностью работает.
          </Text>
          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk-..."
            placeholderTextColor={colors.faint}
            style={styles.keyInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.row}>
            <Pressable
              onPress={async () => {
                await writeCoachKey(apiKey);
                setHasKey(Boolean(apiKey.trim()));
                setKeyOpen(false);
              }}
              style={styles.saveKey}>
              <Text style={styles.saveKeyText}>Сохранить</Text>
            </Pressable>
            <Pressable onPress={() => clearCoach()} style={styles.clear}>
              <Text style={styles.clearText}>Очистить чат</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <ScrollView
        ref={scroll}
        style={styles.thread}
        contentContainerStyle={styles.threadInner}
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
        {COACH_PRESETS.map((item) => (
          <Pressable key={item} onPress={() => send(item)} style={styles.preset}>
            <Text style={styles.presetText}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Сообщение тренеру..."
          placeholderTextColor={colors.faint}
          style={styles.input}
          multiline
        />
        <Pressable onPress={() => send(draft)} style={styles.send}>
          <Text style={styles.sendText}>SEND</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scan: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(34,211,238,0.35)',
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34,211,238,0.18)',
  },
  kicker: { color: colors.cyan, fontWeight: '800', letterSpacing: 1.4, fontSize: 11 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 4 },
  keyBtn: {
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  keyBtnText: { color: colors.cyan, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  keyBox: {
    marginTop: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.25)',
    backgroundColor: '#0F1722',
    gap: 10,
  },
  keyLead: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  keyInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: { flexDirection: 'row', gap: 8 },
  saveKey: {
    backgroundColor: colors.cyan,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    minHeight: 40,
  },
  saveKeyText: { color: colors.bg, fontWeight: '800' },
  clear: { justifyContent: 'center', paddingHorizontal: 8 },
  clearText: { color: colors.crimson, fontWeight: '700' },
  thread: { flex: 1, marginTop: 12 },
  threadInner: { gap: 12, paddingBottom: 16 },
  hello: {
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
    backgroundColor: '#12101C',
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  helloTitle: { color: colors.text, fontWeight: '800', fontSize: 18 },
  helloLead: { color: colors.muted, lineHeight: 20 },
  bubble: {
    maxWidth: '92%',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#15202B',
    borderColor: 'rgba(34,211,238,0.4)',
  },
  bubbleCoach: {
    alignSelf: 'flex-start',
    backgroundColor: '#161022',
    borderColor: 'rgba(139,92,246,0.45)',
  },
  role: { color: colors.faint, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 6 },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  presets: { gap: 8, paddingVertical: 10 },
  preset: {
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.35)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#101822',
  },
  presetText: { color: colors.cyan, fontWeight: '700', fontSize: 12 },
  composer: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', paddingBottom: 8 },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.28)',
    backgroundColor: '#10151F',
    borderRadius: 16,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  send: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: colors.bg, fontWeight: '900', letterSpacing: 1 },
});
