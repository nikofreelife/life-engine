import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PhoneShell } from '@/components/PhoneShell';
import { PinLock } from '@/components/PinLock';
import { SecretVault } from '@/components/SecretVault';
import { useEngineLayout } from '@/src/layout';
import { secretGate } from '@/src/secret';
import { useEngine } from '@/src/store';
import { colors } from '@/src/theme';

export default function SecretScreen() {
  const router = useRouter();
  const { pad, isTablet } = useEngineLayout();
  const { hasPin, ready, setPin, verifyPin } = useEngine();
  const gate = secretGate(ready, hasPin);
  const [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const pinMode = confirming && gate === 'create' ? 'confirm' : gate === 'create' ? 'create' : 'unlock';

  useEffect(() => {
    if (gate === 'loading') {
      setUnlocked(false);
      setConfirming(false);
      setDraft('');
    }
  }, [gate]);

  const onComplete = useCallback(
    async (pin: string) => {
      if (gate === 'loading') return;
      setError('');
      if (pinMode === 'create') {
        setDraft(pin);
        setConfirming(true);
        return;
      }
      if (pinMode === 'confirm') {
        if (pin !== draft) {
          setError('PIN не совпал. Задай заново.');
          setConfirming(false);
          setDraft('');
          return;
        }
        await setPin(pin);
        setUnlocked(true);
        return;
      }
      const ok = await verifyPin(pin);
      if (!ok) {
        setError('Неверный PIN');
        return;
      }
      setUnlocked(true);
    },
    [draft, gate, pinMode, setPin, verifyPin],
  );

  return (
    <PhoneShell>
      <View style={[styles.top, { paddingHorizontal: pad }]}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Text style={[styles.back, isTablet && { fontSize: 16 }]}>← закрыть</Text>
        </Pressable>
      </View>
      {gate === 'loading' ? (
        <View style={[styles.body, { paddingHorizontal: pad }]}>
          <Text style={styles.loading}>Загрузка…</Text>
        </View>
      ) : unlocked ? (
        <View style={[styles.body, { paddingHorizontal: pad }]}>
          <SecretVault />
        </View>
      ) : (
        <PinLock mode={pinMode} error={error} onComplete={onComplete} />
      )}
    </PhoneShell>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 20, paddingBottom: 4 },
  back: { color: colors.muted, fontWeight: '700' },
  body: { flex: 1, paddingHorizontal: 20 },
  loading: { color: colors.muted, fontWeight: '700', marginTop: 24 },
});
