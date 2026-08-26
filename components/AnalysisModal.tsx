import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NativeSheet } from './NativeSheet';

import { ANALYSIS_SYSTEM, analysisPrompt, type FreemanEpisode } from '../src/data/freeman';
import { llmComplete, readLlmKey } from '../src/llm';
import { useEngine } from '../src/store';
import { colors } from '../src/theme';

type Props = {
  episode: FreemanEpisode | null;
  onClose: () => void;
};

export function AnalysisModal({ episode, onClose }: Props) {
  const { state, setVideoInsight } = useEngine();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saved = episode ? state.videoInsights?.[episode.id] : undefined;

  useEffect(() => {
    if (!episode || busy) return;
    if (state.videoInsights?.[episode.id]) return;
    void run(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per opened episode
  }, [episode?.id]);

  const run = async (forceAi: boolean) => {
    if (!episode) return;
    setError('');
    if (!forceAi) {
      setVideoInsight(episode.id, { text: episode.local, source: 'local', atISO: new Date().toISOString() });
      return;
    }
    setBusy(true);
    try {
      const key = await readLlmKey();
      if (!key) {
        setVideoInsight(episode.id, { text: episode.local, source: 'local', atISO: new Date().toISOString() });
        setError('Ключа нет — показан базовый разбор. Добавь API key в профиле.');
        return;
      }
      const text = await llmComplete(ANALYSIS_SYSTEM, analysisPrompt(episode));
      setVideoInsight(episode.id, { text, source: 'ai', atISO: new Date().toISOString() });
    } catch (err) {
      setVideoInsight(episode.id, { text: episode.local, source: 'local', atISO: new Date().toISOString() });
      setError(err instanceof Error ? err.message : 'Сеть или ключ не приняли запрос. Ниже — базовый разбор.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <NativeSheet visible={episode !== null} onClose={onClose}>
      <View style={styles.root}>
        <View style={styles.head}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.ghost}>Закрыть</Text>
          </Pressable>
          <Text style={styles.kicker}>РАЗБОР СЕРИИ</Text>
          <View style={{ width: 64 }} />
        </View>
        {episode ? (
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.part}>Ep. {episode.part}</Text>
            <Text style={styles.title}>{episode.title}</Text>
            <Text style={styles.date}>{episode.date}</Text>
            <View style={styles.row}>
              <Pressable onPress={() => run(true)} disabled={busy} style={[styles.ai, busy && { opacity: 0.6 }]}>
                <Text style={styles.aiText}>{busy ? 'Думает…' : 'Разбор серии с ИИ'}</Text>
              </Pressable>
              <Pressable onPress={() => run(false)} style={styles.localBtn}>
                <Text style={styles.localText}>Базовый текст</Text>
              </Pressable>
            </View>
            {busy ? <ActivityIndicator color={colors.violet} style={{ marginVertical: 16 }} /> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {saved ? (
              <View style={styles.card}>
                <Text style={styles.source}>
                  {saved.source === 'ai' ? 'ИИ-аналитика' : 'Базовый разбор'} ·{' '}
                  {new Date(saved.atISO).toLocaleString('ru-RU')}
                </Text>
                <Text style={styles.text}>{saved.text}</Text>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.source}>Базовый разбор · без ключа или до запроса</Text>
                <Text style={styles.text}>{episode.local}</Text>
              </View>
            )}
          </ScrollView>
        ) : null}
      </View>
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingTop: 4 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  kicker: { color: colors.muted, fontWeight: '800', letterSpacing: 1.4, fontSize: 11 },
  ghost: { color: colors.muted, fontWeight: '700', fontSize: 16 },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  part: { color: colors.violet, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 6, lineHeight: 30 },
  date: { color: colors.faint, marginTop: 6, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  ai: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: { color: colors.white, fontWeight: '800' },
  localBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  localText: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  error: { color: colors.amber, marginBottom: 12, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  source: { color: colors.emerald, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  text: { color: colors.muted, fontSize: 15, lineHeight: 23 },
});
