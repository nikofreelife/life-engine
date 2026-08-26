import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { quoteForDay } from '../src/data/quotes';
import { formatHms, msUntilNextMidnight, todayKey } from '../src/lib';
import { useEngineLayout } from '../src/layout';
import { colors } from '../src/theme';

export function DailyQuote() {
  const { isTablet } = useEngineLayout();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const quote = quoteForDay(todayKey(new Date(now)));
  const [y, m, d] = quote.day.split('-');
  const countdown = formatHms(msUntilNextMidnight(new Date(now)));

  return (
    <View style={[styles.wrap, isTablet && styles.wrapTablet]}>
      <View style={styles.top}>
        <Text style={styles.kicker}>ЦИТАТА ДНЯ</Text>
        <Text style={styles.date}>
          {d}.{m}.{y}
        </Text>
      </View>
      <Text style={[styles.quote, isTablet && styles.quoteTablet]}>{quote.text}</Text>
      <Text style={styles.meta}>
        {quote.author} — {quote.theme}
      </Text>
      <Text style={styles.timer}>До новой цитаты: {countdown}</Text>
    </View>
  );
}

export function QuoteBanner() {
  return <DailyQuote />;
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.crimson,
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
  },
  wrapTablet: { padding: 22, borderRadius: 22, marginBottom: 24 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  kicker: {
    color: colors.crimson,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  date: { color: colors.faint, fontWeight: '700', fontSize: 12 },
  quote: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  quoteTablet: { fontSize: 18, lineHeight: 28 },
  meta: { color: colors.amber, fontSize: 13, marginTop: 12, fontWeight: '800' },
  timer: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
