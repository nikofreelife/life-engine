import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/auth';
import {
  readLlmKey,
  readLlmProvider,
  writeLlmKey,
  writeLlmProvider,
  type LlmProviderChoice,
} from '@/src/llm';
import { useEngine } from '@/src/store';
import { colors } from '@/src/theme';

const PROVIDERS: Array<{ id: LlmProviderChoice; label: string }> = [
  { id: 'auto', label: 'Авто' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'openrouter', label: 'OpenRouter' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'groq', label: 'Groq' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateAge, signOut } = useAuth();
  const { state } = useEngine();
  const [age, setAge] = useState(String(user?.age ?? ''));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<LlmProviderChoice>('auto');
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    readLlmKey().then(setApiKey);
    readLlmProvider().then(setProvider);
  }, []);

  const save = async () => {
    setError('');
    setSaved(false);
    try {
      await updateAge(Number(age));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не сохранилось');
    }
  };

  const saveKey = async () => {
    await writeLlmKey(apiKey);
    await writeLlmProvider(provider);
    setKeySaved(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>ПРОФИЛЬ</Text>
        <Text style={styles.title}>Возраст, аккаунт, ИИ</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.hint}>
          Карточки подстраиваются под возраст. API-ключ обязателен для живого коуча и разбора серий Mr. Freeman.
        </Text>
        <Text style={styles.label}>Укажи свой возраст</Text>
        <TextInput
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          placeholder="Возраст"
          placeholderTextColor={colors.faint}
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {saved ? <Text style={styles.ok}>Сохранено. Интерфейс пересчитает приоритеты.</Text> : null}
        <Pressable onPress={save} style={styles.save}>
          <Text style={styles.saveText}>Сохранить возраст</Text>
        </Pressable>

        <Text style={[styles.label, { marginTop: 28 }]}>API Key (OpenAI / OpenRouter) — обязательно</Text>
        <Text style={styles.hint}>
          Без ключа ИИ-коуч заблокирован. Ключ хранится только на этом устройстве. Авто определяет провайдера по
          префиксу (sk-or-, sk-ant-, gsk_, sk-).
        </Text>
        <TextInput
          value={apiKey}
          onChangeText={(v) => {
            setApiKey(v);
            setKeySaved(false);
          }}
          placeholder="sk-... / sk-or-... / sk-ant-... / gsk_..."
          placeholderTextColor={colors.faint}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <View style={styles.providers}>
          {PROVIDERS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                setProvider(item.id);
                setKeySaved(false);
              }}
              style={[styles.prov, provider === item.id && styles.provOn]}>
              <Text style={[styles.provText, provider === item.id && styles.provTextOn]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        {keySaved ? <Text style={styles.ok}>Ключ сохранён.</Text> : null}
        <Pressable onPress={saveKey} style={styles.save}>
          <Text style={styles.saveText}>Сохранить API-ключ</Text>
        </Pressable>

        <Text style={[styles.label, { marginTop: 28 }]}>Дыхание Вима Хофа</Text>
        <Text style={styles.hint}>
          Рекорд и последние задержки. Пишется автоматически после кнопки «Вдохнуть» в раунде.
        </Text>
        <View style={styles.breathBox}>
          <Text style={styles.breathBest}>
            Рекорд:{' '}
            {(state.breathLogs ?? []).length
              ? `${Math.max(...(state.breathLogs ?? []).map((l) => l.retentionSec)).toFixed(1)} с`
              : 'пока нет'}
          </Text>
          {(state.breathLogs ?? []).slice(0, 8).map((log) => (
            <Text key={log.id} style={styles.breathLine}>
              Раунд {log.round} · {log.retentionSec.toFixed(1)} с · {log.breaths} вдохов
            </Text>
          ))}
          {!(state.breathLogs ?? []).length ? <Text style={styles.breathLine}>Пройди сессию во вкладке «Тело».</Text> : null}
        </View>

        <Pressable onPress={() => router.back()} style={styles.ghost}>
          <Text style={styles.ghostText}>Закрыть</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            await signOut();
            router.replace('/auth');
          }}
          style={styles.out}>
          <Text style={styles.outText}>Выйти из аккаунта</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, maxWidth: 520, width: '100%', alignSelf: 'center', paddingBottom: 48 },
  kicker: { color: colors.blue, letterSpacing: 2.4, fontWeight: '800', fontSize: 11 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 6 },
  email: { color: colors.emerald, marginTop: 8, fontWeight: '700' },
  hint: { color: colors.muted, marginTop: 10, lineHeight: 20, marginBottom: 16 },
  label: { color: colors.text, fontWeight: '700', marginBottom: 8 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  providers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  prov: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  provOn: { borderColor: colors.violet, backgroundColor: colors.cardElevated },
  provText: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  provTextOn: { color: colors.text },
  error: { color: colors.crimson, marginBottom: 8, fontWeight: '700' },
  ok: { color: colors.emerald, marginBottom: 8, fontWeight: '700' },
  save: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: colors.bg, fontWeight: '800' },
  ghost: {
    minHeight: 48,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { color: colors.muted, fontWeight: '700' },
  out: { marginTop: 28, alignItems: 'center' },
  outText: { color: colors.crimson, fontWeight: '700' },
  breathBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    marginBottom: 8,
  },
  breathBest: { color: colors.cyan, fontWeight: '800', marginBottom: 4 },
  breathLine: { color: colors.muted, fontSize: 13 },
});
