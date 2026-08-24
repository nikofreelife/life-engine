import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useEngineLayout } from '../src/layout';
import { colors } from '../src/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

type Props = {
  mode: 'create' | 'confirm' | 'unlock';
  error?: string;
  onComplete: (pin: string) => void;
};

export function PinLock({ mode, error, onComplete }: Props) {
  const [pin, setPin] = useState('');
  const { isTablet } = useEngineLayout();
  const keySize = isTablet ? 84 : 74;

  useEffect(() => {
    setPin('');
  }, [mode, error]);

  useEffect(() => {
    if (pin.length === 4) {
      const snapshot = pin;
      const t = setTimeout(() => onComplete(snapshot), 80);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [onComplete, pin]);

  const title =
    mode === 'create' ? 'Задай 4-значный PIN' : mode === 'confirm' ? 'Повтори PIN' : 'Чистый Разум';
  const subtitle =
    mode === 'unlock'
      ? 'Секретный контур. Введи код.'
      : 'PIN хранится локально. Без него зона закрыта.';

  return (
    <View style={styles.wrap}>
      <View style={[styles.panel, isTablet && styles.panelTablet]}>
      <Text style={styles.kicker}>HARDCORE MODE</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotOn]} />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : <View style={{ height: 22 }} />}
      <View style={[styles.pad, { width: keySize * 3 + 24 }]}>
        {KEYS.map((key) => (
          <Pressable
            key={key || 'sp'}
            disabled={!key}
            onPress={() => {
              void Haptics.selectionAsync();
              if (key === '⌫') setPin((p) => p.slice(0, -1));
              else if (pin.length < 4) setPin((p) => p + key);
            }}
            style={({ pressed }) => [
              styles.key,
              { width: keySize, height: keySize, borderRadius: keySize / 2 },
              pressed && key ? styles.keyPressed : null,
            ]}>
            <Text style={styles.keyText}>{key}</Text>
          </Pressable>
        ))}
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  panel: { width: '100%', maxWidth: 420 },
  panelTablet: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 28,
    maxWidth: 460,
  },
  kicker: {
    color: colors.crimson,
    letterSpacing: 4,
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  sub: { color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 28 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.crimson,
    backgroundColor: 'transparent',
  },
  dotOn: { backgroundColor: colors.crimson },
  error: { color: colors.crimson, textAlign: 'center', marginTop: 14, fontWeight: '700' },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 28,
    width: 246,
    alignSelf: 'center',
  },
  key: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { backgroundColor: '#1A1020', borderColor: colors.crimson },
  keyText: { color: colors.text, fontSize: 24, fontWeight: '700' },
});
