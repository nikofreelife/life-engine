import { StyleSheet, Text, View } from 'react-native';

import { ageDisclaimer, priorityLabel, recommendLabel, type AgeGate, type AgeTone } from '../src/age';
import { colors } from '../src/theme';

export function AgeBadges({ gate, tone = 'body' }: { gate: AgeGate; tone?: AgeTone }) {
  const minAge = gate.minAge;
  if (!gate.priority && minAge == null) return null;
  return (
    <View style={styles.row}>
      {gate.priority ? (
        <View style={styles.priorityBadge}>
          <Text style={styles.priorityText}>{priorityLabel()}</Text>
        </View>
      ) : null}
      {minAge != null ? (
        <View style={styles.recommendBadge}>
          <Text style={styles.recommendText}>{recommendLabel(minAge, tone)}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function AgeDisclaimer({ minAge, tone = 'body' }: { minAge?: number; tone?: AgeTone }) {
  if (minAge == null) return null;
  return (
    <View style={styles.note}>
      <Text style={styles.noteText}>{ageDisclaimer(minAge, tone)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  priorityBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: 'rgba(245, 158, 11, 0.42)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priorityText: { color: colors.amber, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  recommendBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.38)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  recommendText: { color: '#93C5FD', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  note: {
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.28)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 10,
  },
  noteText: { color: colors.muted, fontSize: 13, lineHeight: 20 },
});
