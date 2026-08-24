import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/auth';
import { colors } from '@/src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateAge, signOut } = useAuth();
  const [age, setAge] = useState(String(user?.age ?? ''));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.kicker}>ПРОФИЛЬ</Text>
        <Text style={styles.title}>Возраст и аккаунт</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.hint}>
          Карточки, курсы и практики подстраиваются под возраст: неактуальное уходит в «На будущее» или помечается Locked.
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, maxWidth: 520, width: '100%', alignSelf: 'center' },
  kicker: { color: colors.blue, letterSpacing: 2.4, fontWeight: '800', fontSize: 11 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 6 },
  email: { color: colors.emerald, marginTop: 8, fontWeight: '700' },
  hint: { color: colors.muted, marginTop: 10, lineHeight: 20, marginBottom: 20 },
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
});
