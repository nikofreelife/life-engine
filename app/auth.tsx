import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/auth';
import { colors } from '@/src/theme';

export default function AuthScreen() {
  const { signIn, signUp, accounts, signInAccount } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [local, setLocal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      if (mode === 'in') {
        await signIn(email, password);
      } else {
        await signUp({
          email,
          password: local ? undefined : password,
          age: Number(age),
          local,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не получилось');
    } finally {
      setBusy(false);
    }
  };

  const localAccounts = accounts.filter((account) => account.local);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.kicker}>LIFE ENGINE</Text>
          <Text style={styles.title}>{mode === 'in' ? 'Вход' : 'Регистрация'}</Text>
          <Text style={styles.lead}>
            Прогресс привязан к аккаунту: стрики, деньги, срывы, заметки, книги и трекеры. Локальное хранилище на этом
            устройстве.
          </Text>

          <View style={styles.switch}>
            <Pressable onPress={() => setMode('in')} style={[styles.switchBtn, mode === 'in' && styles.switchOn]}>
              <Text style={[styles.switchText, mode === 'in' && styles.switchTextOn]}>Sign in</Text>
            </Pressable>
            <Pressable onPress={() => setMode('up')} style={[styles.switchBtn, mode === 'up' && styles.switchOn]}>
              <Text style={[styles.switchText, mode === 'up' && styles.switchTextOn]}>Sign up</Text>
            </Pressable>
          </View>

          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={local ? 'default' : 'email-address'}
            placeholder={local ? 'Имя локального аккаунта' : 'E-mail'}
            placeholderTextColor={colors.faint}
            style={styles.input}
          />
          {local && mode === 'up' ? null : (
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Пароль"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
          )}
          {mode === 'up' ? (
            <>
              <TextInput
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                placeholder="Укажи свой возраст *"
                placeholderTextColor={colors.faint}
                style={styles.input}
              />
              <Pressable onPress={() => setLocal((v) => !v)} style={styles.localToggle}>
                <View style={[styles.box, local && styles.boxOn]}>{local ? <Text style={styles.boxMark}>✓</Text> : null}</View>
                <Text style={styles.localText}>Локальный аккаунт без пароля (только это устройство)</Text>
              </Pressable>
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={submit} disabled={busy} style={[styles.submit, busy && { opacity: 0.6 }]}>
            <Text style={styles.submitText}>{busy ? '…' : mode === 'in' ? 'Войти' : 'Создать аккаунт'}</Text>
          </Pressable>

          {localAccounts.length ? (
            <View style={styles.locals}>
              <Text style={styles.localsKicker}>Локальные аккаунты на устройстве</Text>
              {localAccounts.map((account) => (
                <Pressable key={account.id} onPress={() => signInAccount(account.id)} style={styles.localCard}>
                  <Text style={styles.localName}>{account.email}</Text>
                  <Text style={styles.localMeta}>{account.age} лет</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 28, paddingTop: 48, maxWidth: 480, width: '100%', alignSelf: 'center' },
  kicker: { color: colors.emerald, letterSpacing: 3.2, fontWeight: '800', fontSize: 12 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginTop: 8 },
  lead: { color: colors.muted, marginTop: 10, lineHeight: 22, marginBottom: 22 },
  switch: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  switchBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  switchOn: { borderColor: colors.emerald, backgroundColor: colors.cardElevated },
  switchText: { color: colors.muted, fontWeight: '700' },
  switchTextOn: { color: colors.text },
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
  localToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  boxOn: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  boxMark: { color: colors.bg, fontWeight: '800', fontSize: 12 },
  localText: { color: colors.muted, flex: 1, lineHeight: 18 },
  error: { color: colors.crimson, marginBottom: 12, fontWeight: '700' },
  submit: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: colors.bg, fontWeight: '800', fontSize: 16 },
  locals: { marginTop: 28, gap: 8 },
  localsKicker: { color: colors.faint, fontSize: 12, fontWeight: '700', letterSpacing: 0.4, marginBottom: 4 },
  localCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  localName: { color: colors.text, fontWeight: '700' },
  localMeta: { color: colors.muted },
});
