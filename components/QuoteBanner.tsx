import { StyleSheet, Text, View } from 'react-native';

import { MOTTO } from '../src/data/catalog';
import { useEngineLayout } from '../src/layout';
import { colors } from '../src/theme';

export function QuoteBanner() {
  const { isTablet } = useEngineLayout();
  return (
    <View style={[styles.wrap, isTablet && styles.wrapTablet]}>
      <Text style={styles.kicker}>ДИСЦИПЛИНА</Text>
      <Text style={[styles.quote, isTablet && styles.quoteTablet]}>{MOTTO}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.crimson,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  wrapTablet: { padding: 22, borderRadius: 22, marginBottom: 24 },
  kicker: {
    color: colors.crimson,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.4,
    marginBottom: 8,
  },
  quote: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  quoteTablet: { fontSize: 18, lineHeight: 28 },
});
