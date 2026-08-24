import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PhoneShell } from '@/components/PhoneShell';
import { PinLock } from '@/components/PinLock';
import { SecretVault } from '@/components/SecretVault';
import { useEngineLayout } from '@/src/layout';
import { useEngine } from '@/src/store';
import { colors } from '@/src/theme';

export default function SecretScreen() {
  const router = useRouter();
  const { pad, isTablet } = useEngineLayout();
  const { hasPin, ready, setPin, verifyPin } = useEngine();
  const [mode, setMode] = useState<'create' | 'confirm' | 'unlock'>('create');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (ready) setMode(hasPin ? 'unlock' : 'create');
  }, [hasPin, ready]);

  const onComplete = useCallback(
    async (pin: string) => {
      setError('');
      if (mode === 'create') {
        setDraft(pin);
        setMode('confirm');
        return;
      }
      if (mode === 'confirm') {
        if (pin !== draft) {
          setError('PIN не совпал. Задай заново.');
          setMode('create');
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
    [draft, mode, setPin, verifyPin],
  );

  return (
    <PhoneShell>
      <View style={[styles.top, { paddingHorizontal: pad }]}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Text style={[styles.back, isTablet && { fontSize: 16 }]}>← закрыть</Text>
        </Pressable>
      </View>
      {unlocked ? (
        <View style={[styles.body, { paddingHorizontal: pad }]}>
          <SecretVault />
        </View>
      ) : (
        <PinLock mode={mode} error={error} onComplete={onComplete} />
      )}
    </PhoneShell>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 20, paddingBottom: 4 },
  back: { color: colors.muted, fontWeight: '700' },
  body: { flex: 1, paddingHorizontal: 20 },
});
