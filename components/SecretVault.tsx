import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DateStartPicker } from './DateStartPicker';
import { elapsedParts, monthMatrix, todayKey } from '../src/lib';
import { useEngineLayout } from '../src/layout';
import { useEngine } from '../src/store';
import { colors } from '../src/theme';
import type { DayState, JournalKind } from '../src/types';

const WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MILESTONES = [30, 60, 90];
const KIND_LABEL: Record<JournalKind, string> = {
  note: 'заметка',
  craving: 'тяга',
  win: 'победа',
  slip: 'срыв',
};

function Counter({
  title,
  accent,
  startISO,
  track,
  extra,
  fill,
}: {
  title: string;
  accent: string;
  startISO: string | null;
  track: 'thc' | 'nofap';
  extra?: ReactNode;
  fill?: boolean;
}) {
  const { setTrackStart, relapse } = useEngine();
  const [, setTick] = useState(0);
  const [picker, setPicker] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const t = elapsedParts(startISO);

  const confirmRelapse = () => {
    Alert.alert('Срыв', 'Цикл обнулится и начнётся заново. Запись попадёт в историю и календарь.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Я сорвался', style: 'destructive', onPress: () => relapse(track) },
    ]);
  };

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
        <Text style={styles.clock}>Счётчик ещё не запущен</Text>
      )}
      <View style={styles.actionRow}>
        <Pressable onPress={() => setPicker(true)} style={[styles.cta, { backgroundColor: accent }]}>
          <Text style={styles.ctaText}>{startISO ? 'Дата старта' : 'Указать дату'}</Text>
        </Pressable>
        {startISO ? (
          <Pressable onPress={confirmRelapse} style={styles.relapse}>
            <Text style={styles.relapseText}>Я сорвался</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setTrackStart(track, new Date().toISOString())} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>Сейчас</Text>
          </Pressable>
        )}
      </View>
      {extra}
      <DateStartPicker
        visible={picker}
        value={startISO ? new Date(startISO) : new Date()}
        onClose={() => setPicker(false)}
        onSave={(date) => setTrackStart(track, date.toISOString())}
      />
    </View>
  );
}

function JournalBox({
  placeholder,
  entries,
  onAdd,
  onRemove,
}: {
  placeholder: string;
  entries: { id: string; atISO: string; kind: JournalKind; text: string }[];
  onAdd: (kind: JournalKind, text: string) => void;
  onRemove: (id: string) => void;
}) {
  const [text, setText] = useState('');
  const [kind, setKind] = useState<JournalKind>('note');
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.kindRow}>
        {(['note', 'craving', 'win', 'slip'] as JournalKind[]).map((k) => (
          <Pressable key={k} onPress={() => setKind(k)} style={[styles.kind, kind === k && styles.kindOn]}>
            <Text style={[styles.kindText, kind === k && styles.kindTextOn]}>{KIND_LABEL[k]}</Text>
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
      {entries.map((entry) => (
        <View key={entry.id} style={styles.entryRow}>
          <Text style={styles.entry}>
            {new Date(entry.atISO).toLocaleString('ru-RU')} · {KIND_LABEL[entry.kind]} · {entry.text || '—'}
          </Text>
          <Pressable
            onPress={() =>
              Alert.alert('Удалить запись?', '', [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Удалить', style: 'destructive', onPress: () => onRemove(entry.id) },
              ])
            }
            hitSlop={8}>
            <Text style={styles.entryDelete}>удалить</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export function SecretVault() {
  const { state, patchSecret, addJournal, removeJournal, setCalendarDay } = useEngine();
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
          track="thc"
          extra={
            <View style={{ marginTop: 16, gap: 10 }}>
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
                entries={secret.thcJournal}
                onAdd={(kind, text) => addJournal('thc', kind, text)}
                onRemove={(id) => removeJournal('thc', id)}
              />
            </View>
          }
        />

        <Counter
          fill={isTablet}
          title="NoFap / Semen Retention"
          accent={colors.violet}
          startISO={secret.nofapStartISO}
          track="nofap"
          extra={
            <View style={{ marginTop: 16, gap: 10 }}>
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
                entries={secret.nofapJournal}
                onAdd={(kind, text) => addJournal('nofap', kind, text)}
                onRemove={(id) => removeJournal('nofap', id)}
              />
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
                  style={[styles.cell, styles.day, { borderColor: tone }, selected === day && styles.daySel]}>
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
  page: { paddingBottom: 56, gap: 18 },
  split: { flexDirection: 'row', gap: 18, alignItems: 'stretch' },
  hero: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: 0.4 },
  lead: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 20,
  },
  cardKicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginBottom: 8 },
  big: { color: colors.text, fontSize: 44, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unit: { fontSize: 18, color: colors.muted, fontWeight: '600' },
  clock: { color: colors.muted, marginTop: 4 },
  started: { color: colors.faint, fontSize: 12, marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cta: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  ctaText: { color: colors.bg, fontWeight: '800' },
  relapse: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.crimson,
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  relapseText: { color: colors.crimson, fontWeight: '800' },
  ghostBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostBtnText: { color: colors.text, fontWeight: '800' },
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
    minHeight: 72,
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    padding: 12,
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
  entryRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  entry: { color: colors.faint, fontSize: 12, flex: 1, lineHeight: 18 },
  entryDelete: { color: colors.crimson, fontSize: 11, fontWeight: '700' },
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
