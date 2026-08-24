import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { elapsedParts, monthMatrix, todayKey } from '../src/lib';
import { useEngineLayout } from '../src/layout';
import { useEngine } from '../src/store';
import { colors } from '../src/theme';
import type { DayState, JournalKind } from '../src/types';

const WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MILESTONES = [30, 60, 90];

function Counter({
  title,
  accent,
  startISO,
  onStart,
  extra,
  fill,
}: {
  title: string;
  accent: string;
  startISO: string | null;
  onStart: () => void;
  extra?: ReactNode;
  fill?: boolean;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const t = elapsedParts(startISO);
  return (
    <View style={[styles.card, { borderColor: accent }, fill && { flex: 1 }]}>
      <Text style={[styles.cardKicker, { color: accent }]}>{title}</Text>
      {startISO ? (
        <>
          <Text style={styles.big}>
            {t.days}
            <Text style={styles.unit}> дн</Text>
          </Text>
          <Text style={styles.clock}>
            {t.hours} ч {t.minutes} мин без срыва
          </Text>
          <Text style={styles.started}>Старт: {new Date(startISO).toLocaleString('ru-RU')}</Text>
        </>
      ) : (
        <Pressable onPress={onStart} style={[styles.cta, { backgroundColor: accent }]}>
          <Text style={styles.ctaText}>Запустить счётчик</Text>
        </Pressable>
      )}
      {extra}
    </View>
  );
}

function JournalBox({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (kind: JournalKind, text: string) => void;
}) {
  const [text, setText] = useState('');
  const [kind, setKind] = useState<JournalKind>('note');
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.kindRow}>
        {(['note', 'craving', 'win', 'slip'] as JournalKind[]).map((k) => (
          <Pressable key={k} onPress={() => setKind(k)} style={[styles.kind, kind === k && styles.kindOn]}>
            <Text style={[styles.kindText, kind === k && styles.kindTextOn]}>
              {k === 'note' ? 'заметка' : k === 'craving' ? 'тяга' : k === 'win' ? 'победа' : 'срыв'}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        style={styles.notes}
        multiline
      />
      <Pressable
        onPress={() => {
          onAdd(kind, text);
          setText('');
        }}
        style={styles.save}>
        <Text style={styles.saveText}>Записать</Text>
      </Pressable>
    </View>
  );
}

export function SecretVault() {
  const { state, patchSecret, addJournal, setCalendarDay } = useEngine();
  const { isTablet } = useEngineLayout();
  const secret = state.secret;
  const now = new Date();
  const matrix = useMemo(() => monthMatrix(now.getFullYear(), now.getMonth()), [now]);
  const [selected, setSelected] = useState(todayKey());
  const selectedDay = secret.calendar[selected];
  const nofap = elapsedParts(secret.nofapStartISO);
  const dopamine = Math.min(100, (nofap.days / 90) * 100);
  const saved = secret.thcStartISO
    ? Math.round((elapsedParts(secret.thcStartISO).ms / 86400000) * secret.thcDailyCost)
    : 0;

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <Text style={[styles.hero, isTablet && { fontSize: 36 }]}>Чистый Разум</Text>
      <Text style={[styles.lead, isTablet && { fontSize: 16, lineHeight: 24 }]}>
        Hardcore Mode · только ты видишь этот контур.
      </Text>

      <View style={isTablet ? styles.split : undefined}>
      <Counter
        fill={isTablet}
        title="Отказ от ТГК / каннабиноидов"
        accent={colors.crimson}
        startISO={secret.thcStartISO}
        onStart={() => patchSecret({ thcStartISO: new Date().toISOString() })}
        extra={
          <View style={{ marginTop: 14, gap: 8 }}>
            <Text style={styles.label}>Сэкономлено в день, ₽</Text>
            <TextInput
              keyboardType="numeric"
              value={String(secret.thcDailyCost || '')}
              onChangeText={(v) => patchSecret({ thcDailyCost: Number(v.replace(/[^\d.]/g, '')) || 0 })}
              placeholder="0"
              placeholderTextColor={colors.faint}
              style={styles.money}
            />
            <Text style={styles.saved}>Ресурс сохранён: {saved.toLocaleString('ru-RU')} ₽</Text>
            <JournalBox
              placeholder="Тяга, срыв или заметка по ТГК"
              onAdd={(kind, text) => addJournal('thc', kind, text)}
            />
            {secret.thcJournal.slice(0, 5).map((e) => (
              <Text key={e.id} style={styles.entry}>
                {new Date(e.atISO).toLocaleDateString('ru-RU')} · {e.kind} · {e.text || '—'}
              </Text>
            ))}
          </View>
        }
      />

      <Counter
        fill={isTablet}
        title="NoFap / Semen Retention"
        accent={colors.violet}
        startISO={secret.nofapStartISO}
        onStart={() => patchSecret({ nofapStartISO: new Date().toISOString() })}
        extra={
          <View style={{ marginTop: 14, gap: 8 }}>
            <Text style={styles.label}>Дофаминовое восстановление</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${dopamine}%` }]} />
            </View>
            <View style={styles.miles}>
              {MILESTONES.map((m) => (
                <Text key={m} style={[styles.mile, nofap.days >= m && styles.mileOn]}>
                  {m}д {nofap.days >= m ? '✓' : ''}
                </Text>
              ))}
            </View>
            <JournalBox
              placeholder="Тяга, победа или срыв"
              onAdd={(kind, text) => addJournal('nofap', kind, text)}
            />
            {secret.nofapJournal.slice(0, 5).map((e) => (
              <Text key={e.id} style={styles.entry}>
                {new Date(e.atISO).toLocaleDateString('ru-RU')} · {e.kind} · {e.text || '—'}
              </Text>
            ))}
          </View>
        }
      />
      </View>

      <View style={styles.card}>
        <Text style={[styles.cardKicker, { color: colors.amber }]}>Календарь чистоты</Text>
        <Text style={styles.lead}>Фиксация состояния и эмоционального фона.</Text>
        <View style={styles.weekRow}>
          {WEEK.map((d) => (
            <Text key={d} style={styles.week}>
              {d}
            </Text>
          ))}
        </View>
        {matrix.map((row, i) => (
          <View key={i} style={styles.weekRow}>
            {row.map((day, j) => {
              if (!day) return <View key={j} style={styles.cell} />;
              const rec = secret.calendar[day];
              const tone =
                rec?.state === 'clean'
                  ? colors.emerald
                  : rec?.state === 'craving'
                    ? colors.amber
                    : rec?.state === 'slip'
                      ? colors.crimson
                      : colors.border;
              return (
                <Pressable
                  key={day}
                  onPress={() => setSelected(day)}
                  style={[
                    styles.cell,
                    styles.day,
                    { borderColor: tone },
                    selected === day && styles.daySel,
                  ]}>
                  <Text style={styles.dayText}>{Number(day.slice(-2))}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        <Text style={[styles.label, { marginTop: 12 }]}>День {selected}</Text>
        <View style={styles.kindRow}>
          {(['clean', 'craving', 'slip'] as DayState[]).map((s) => (
            <Pressable
              key={s}
              onPress={() =>
                setCalendarDay(selected, {
                  state: s,
                  mood: selectedDay?.mood ?? 3,
                  note: selectedDay?.note ?? '',
                })
              }
              style={[styles.kind, selectedDay?.state === s && styles.kindOn]}>
              <Text style={[styles.kindText, selectedDay?.state === s && styles.kindTextOn]}>
                {s === 'clean' ? 'чисто' : s === 'craving' ? 'тяга' : 'срыв'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Эмоциональный фон · {selectedDay?.mood ?? 3}/5</Text>
        <View style={styles.kindRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() =>
                setCalendarDay(selected, {
                  state: selectedDay?.state ?? 'clean',
                  mood: n,
                  note: selectedDay?.note ?? '',
                })
              }
              style={[styles.mood, (selectedDay?.mood ?? 0) >= n && styles.moodOn]}
            />
          ))}
        </View>
        <TextInput
          value={selectedDay?.note ?? ''}
          onChangeText={(note) =>
            setCalendarDay(selected, {
              state: selectedDay?.state ?? 'clean',
              mood: selectedDay?.mood ?? 3,
              note,
            })
          }
          placeholder="Заметка дня"
          placeholderTextColor={colors.faint}
          style={styles.notes}
          multiline
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingBottom: 48, gap: 14 },
  split: { flexDirection: 'row', gap: 14, alignItems: 'stretch' },
  hero: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: 0.4 },
  lead: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
  },
  cardKicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginBottom: 8 },
  big: { color: colors.text, fontSize: 44, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unit: { fontSize: 18, color: colors.muted, fontWeight: '600' },
  clock: { color: colors.muted, marginTop: 4 },
  started: { color: colors.faint, fontSize: 12, marginTop: 6 },
  cta: { borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  ctaText: { color: colors.bg, fontWeight: '800' },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  money: {
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  saved: { color: colors.emerald, fontWeight: '700' },
  notes: {
    minHeight: 64,
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    padding: 10,
    textAlignVertical: 'top',
  },
  save: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  entry: { color: colors.faint, fontSize: 12 },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kind: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  kindOn: { backgroundColor: colors.crimson, borderColor: colors.crimson },
  kindText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  kindTextOn: { color: colors.bg },
  barTrack: {
    height: 10,
    backgroundColor: '#0F141F',
    borderRadius: 99,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  barFill: { height: '100%', backgroundColor: colors.violet },
  miles: { flexDirection: 'row', justifyContent: 'space-between' },
  mile: { color: colors.faint, fontWeight: '700', fontSize: 12 },
  mileOn: { color: colors.violet },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  week: { flex: 1, textAlign: 'center', color: colors.faint, fontSize: 10, fontWeight: '700' },
  cell: { flex: 1, aspectRatio: 1, maxHeight: 52, alignItems: 'center', justifyContent: 'center' },
  day: { borderRadius: 10, backgroundColor: '#0F141F', borderWidth: 1 },
  daySel: { backgroundColor: colors.cardElevated },
  dayText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  mood: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: colors.amber,
  },
  moodOn: { backgroundColor: colors.amber },
});
