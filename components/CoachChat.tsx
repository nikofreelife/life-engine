import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { CoachDrawer } from './CoachDrawer';
import { NativeSheet } from './NativeSheet';
import { PressScale } from './PressScale';
import { useAuth, displayName } from '../src/auth';
import { COACH_PRESETS, coachReply } from '../src/coach';
import { activeCoachChat } from '../src/lib';
import { useEngineLayout } from '../src/layout';
import { useEngine } from '../src/store';
import { colors, fonts, radius, type } from '../src/theme';

function ThinkDot({ delay }: { delay: number }) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0.35);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(-5, { duration: 280 }), withTiming(0, { duration: 280 })), -1, false),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 280 }), withTiming(0.3, { duration: 280 })), -1, false),
    );
  }, [delay, opacity, y]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));
  return <Animated.View style={[styles.thinkDot, style]} />;
}

function ThinkingMark() {
  return (
    <Animated.View entering={FadeInUp.duration(220)} style={[styles.bubble, styles.bubbleCoach, styles.thinkBox]}>
      <Text style={styles.thinkLabel}>Коуч думает</Text>
      <View style={styles.thinkRow}>
        <ThinkDot delay={0} />
        <ThinkDot delay={140} />
        <ThinkDot delay={280} />
      </View>
    </Animated.View>
  );
}

export function CoachChat() {
  const { user } = useAuth();
  const { state, addCoachMessage, newCoachChat } = useEngine();
  const { isTablet, sidebar, tabPad } = useEngineLayout();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const name = displayName(user);
  const chat = activeCoachChat(state);
  const messages = chat.messages;
  const split = isTablet || sidebar;

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setDraft('');
    addCoachMessage('user', clean);
    setBusy(true);
    try {
      const reply = await coachReply(
        name,
        clean,
        [...messages, { id: 'tmp', role: 'user' as const, text: clean, atISO: '' }].map((m) => ({
          role: m.role,
          text: m.text,
        })),
      );
      addCoachMessage('coach', reply);
    } catch {
      addCoachMessage('coach', 'Сеть моргнула. Нажми ещё раз — я на связи.');
    } finally {
      setBusy(false);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.frame}>
        {split ? (
          <View style={styles.side}>
            <Text style={styles.sideKicker}>ДИАЛОГИ</Text>
            <CoachDrawer />
          </View>
        ) : null}
        <View style={styles.main}>
          <View style={[styles.head, isTablet && { paddingTop: 8 }]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.kicker}>COACH • {name.toUpperCase()}</Text>
              <Text style={styles.sub} numberOfLines={1}>
                {chat.title}
              </Text>
            </View>
            {split ? null : (
              <PressScale haptic="light" onPress={() => setDrawer(true)} style={styles.keyBtn}>
                <Text style={styles.keyBtnText}>Чаты</Text>
              </PressScale>
            )}
            <PressScale
              haptic="medium"
              onPress={() => {
                newCoachChat();
                setDrawer(false);
              }}
              style={styles.keyBtn}>
              <Text style={styles.keyBtnText}>+ Новый</Text>
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
            {messages.length === 0 ? (
              <Animated.View entering={FadeInUp.duration(280)} style={styles.hello}>
                <Text style={styles.helloTitle}>На связи, {name}. Какая задача на сегодня?</Text>
                <Text style={styles.helloLead}>Коротко, по делу, без нотаций. Новый промпт — чистый контекст.</Text>
              </Animated.View>
            ) : null}
            {messages.map((msg) => (
              <Animated.View
                key={msg.id}
                entering={FadeInUp.duration(280).springify().damping(16)}
                style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleCoach]}>
                <Text style={styles.role}>{msg.role === 'user' ? 'YOU' : 'COACH'}</Text>
                <Text style={styles.bubbleText}>{msg.text}</Text>
              </Animated.View>
            ))}
            {busy ? <ThinkingMark /> : null}
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
              placeholder="Сообщение коучу..."
              placeholderTextColor={colors.faint}
              style={styles.input}
              multiline
              editable={!busy}
              blurOnSubmit
              onSubmitEditing={() => send(draft)}
            />
            <PressScale haptic="medium" onPress={() => send(draft)} disabled={busy} style={styles.send}>
              <Text style={styles.sendText}>SEND</Text>
            </PressScale>
          </View>
        </View>
      </View>
      <View style={{ height: Math.max(8, tabPad - 72) }} />
      {split ? null : (
        <NativeSheet visible={drawer} onClose={() => setDrawer(false)} height="full">
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Чаты</Text>
            <CoachDrawer onPick={() => setDrawer(false)} />
          </View>
        </NativeSheet>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  frame: { flex: 1, flexDirection: 'row', minWidth: 0 },
  side: {
    width: 248,
    flexShrink: 0,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: 14,
    marginRight: 14,
  },
  sideKicker: {
    color: colors.cyan,
    fontWeight: '800',
    letterSpacing: 1.6,
    fontSize: 11,
    marginBottom: 10,
    fontFamily: fonts,
  },
  main: { flex: 1, minWidth: 0 },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
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
  thinkBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thinkLabel: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  thinkRow: { flexDirection: 'row', gap: 5, alignItems: 'flex-end', height: 14 },
  thinkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.cyan,
  },
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
  sheet: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  sheetTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 12, fontFamily: fonts },
});
