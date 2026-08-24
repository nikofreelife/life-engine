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
import { RelapseModal } from './RelapseModal';
import { elapsedParts, money, monthMatrix, thcMonthlyFromSecret, thcSavings, todayKey } from '../src/lib';
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
  onDelete,
}: {
  title: string;
  accent: string;
  startISO: string | null;
  track: string;
  extra?: ReactNode;
  fill?: boolean;
  onDelete?: () => void;
}) {
  const { setTrackStart, relapse } = useEngine();
  const [, setTick] = useState(0);
  const [picker, setPicker] = useState(false);
  const [relapseOpen, setRelapseOpen] = useState(false);
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
        <Text style={styles.clock}>Счётчик ещё не запущен</Text>
      )}
      <View style={styles.actionCol}>
        <Pressable
          onPress={() => setPicker(true)}
          hitSlop={8}
          style={({ pressed }) => [styles.cta, { backgroundColor: accent }, pressed && styles.pressed]}>
          <Text style={styles.ctaText}>{startISO ? 'Изменить дату старта' : 'Указать дату'}</Text>
        </Pressable>
        <View style={styles.actionRow}>
          {startISO ? null : (
            <Pressable
              onPress={() => setTrackStart(track, new Date().toISOString())}
              hitSlop={8}
              style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}>
              <Text style={styles.ghostBtnText}>Старт сейчас</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => setRelapseOpen(true)}
            hitSlop={10}
            style={({ pressed }) => [styles.relapse, pressed && styles.pressed, !startISO && { flex: 1 }]}>
            <Text style={styles.relapseText}>Я сорвался</Text>
          </Pressable>
        </View>
        {onDelete ? (
          <Pressable onPress={onDelete} hitSlop={8}>
            <Text style={styles.entryDelete}>удалить счётчик</Text>
          </Pressable>
        ) : null}
      </View>
      {extra}
      <DateStartPicker
        visible={picker}
        value={startISO ? new Date(startISO) : new Date()}
        onClose={() => setPicker(false)}
        onSave={(date) => setTrackStart(track, date.toISOString())}
      />
      <RelapseModal
        visible={relapseOpen}
        title={title}
        onClose={() => setRelapseOpen(false)}
        onSave={(reason) => relapse(track, reason)}
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
          <Text style={[styles.entry, entry.kind === 'slip' && styles.entrySlip]}>
            {new Date(entry.atISO).toLocaleString('ru-RU')} · {KIND_LABEL[entry.kind]} · {entry.text || '—'}
          </Text>
          <Pressable
            onPress={() =>
              Alert.alert('Удалить запись?', '', [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Удалить', style: 'destructive', onPress: () => onRemove(entry.id) },
              ])
            }
            hitSlop={10}>
            <Text style={styles.entryDelete}>удалить</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export function SecretVault() {
  const { state, patchSecret, addJournal, removeJournal, setCalendarDay, addCustomTrack, removeCustomTrack } =
    useEngine();
  const { isTablet } = useEngineLayout();
  const secret = state.secret;
  const now = new Date();
  const matrix = useMemo(() => monthMatrix(now.getFullYear(), now.getMonth()), [now.getFullYear(), now.getMonth()]);
  const [selected, setSelected] = useState(todayKey());
  const [customName, setCustomName] = useState('');
  const selectedDay = secret.calendar[selected];
  const nofap = elapsedParts(secret.nofapStartISO);
  const dopamine = Math.min(100, (nofap.days / 90) * 100);
  const monthly = thcMonthlyFromSecret(secret.thcMonthlyCost, secret.thcDailyCost);
  const savings = thcSavings(monthly, secret.thcStartISO);

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
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
              <Text style={styles.label}>Траты на ТГК в месяц (₽ / $)</Text>
              <TextInput
                keyboardType="numeric"
                value={monthly ? String(Math.round(monthly)) : ''}
                onChangeText={(v) => patchSecret({ thcMonthlyCost: Number(v.replace(/[^\d.]/g, '')) || 0, thcDailyCost: 0 })}
                placeholder="0"
                placeholderTextColor={colors.faint}
                style={styles.money}
              />
              <Text style={styles.saved}>
                Сэкономлено за стрик: {money(savings.saved)} · {elapsedParts(secret.thcStartISO).days}д{' '}
                {elapsedParts(secret.thcStartISO).hours}ч
              </Text>
              <View style={styles.proj}>
                <Text style={styles.projItem}>1 мес · {money(savings.month)}</Text>
                <Text style={styles.projItem}>6 мес · {money(savings.sixMonths)}</Text>
                <Text style={styles.projItem}>1 год · {money(savings.year)}</Text>
              </View>
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

      {(secret.customTracks ?? []).map((track) => (
        <Counter
          key={track.id}
          title={track.name}
          accent={colors.amber}
          startISO={track.startISO}
          track={track.id}
          onDelete={() =>
            Alert.alert('Удалить счётчик?', track.name, [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Удалить', style: 'destructive', onPress: () => removeCustomTrack(track.id) },
            ])
          }
          extra={
            <View style={{ marginTop: 16 }}>
              <JournalBox
                placeholder="Заметка, тяга или срыв"
                entries={track.journal}
                onAdd={(kind, text) => addJournal(track.id, kind, text)}
                onRemove={(id) => removeJournal(track.id, id)}
              />
            </View>
          }
        />
      ))}

      <View style={styles.addTrack}>
        <Text style={styles.label}>Свой счётчик воздержания</Text>
        <View style={styles.addRow}>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="Сахар, алко, вейп, фастфуд..."
            placeholderTextColor={colors.faint}
            style={[styles.money, { flex: 1 }]}
          />
          <Pressable
            onPress={() => {
              addCustomTrack(customName);
              setCustomName('');
            }}
            style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Добавить</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[styles.cardKicker, { color: colors.amber }]}>Календарь чистоты</Text>
        <Text style={styles.lead}>Фиксация состояния и эмоционального фона. Срыв — красный маркер.</Text>
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
              const slip = rec?.state === 'slip';
              const tone =
                rec?.state === 'clean'
                  ? colors.emerald
                  : rec?.state === 'craving'
                    ? colors.amber
                    : slip
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
                    slip && styles.daySlip,
                    selected === day && styles.daySel,
                  ]}>
                  <Text style={[styles.dayText, slip && styles.dayTextSlip]}>{Number(day.slice(-2))}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        <Text style={[styles.label, { marginTop: 12 }]}>День {selected}</Text>
        {selectedDay?.state === 'slip' && selectedDay.note ? (
          <Text style={styles.slipNote}>Срыв: {selectedDay.note}</Text>
        ) : null}
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
  split: { flexDirection: 'row', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' },
  hero: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: 0.4 },
  lead: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 20,
    minWidth: 280,
    flexGrow: 1,
  },
  cardKicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginBottom: 8 },
  big: { color: colors.text, fontSize: 44, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unit: { fontSize: 18, color: colors.muted, fontWeight: '600' },
  clock: { color: colors.muted, marginTop: 4 },
  started: { color: colors.faint, fontSize: 12, marginTop: 6 },
  actionCol: { gap: 10, marginTop: 14 },
  actionRow: { flexDirection: 'row', gap: 10 },
  cta: { borderRadius: 14, minHeight: 48, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: colors.bg, fontWeight: '800' },
  relapse: {
    flex: 1,
    borderRadius: 14,
    minHeight: 48,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.crimson,
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  relapseText: { color: colors.crimson, fontWeight: '800' },
  pressed: { opacity: 0.75 },
  ghostBtn: {
    flex: 1,
    borderRadius: 14,
    minHeight: 48,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: 12,
    minHeight: 48,
  },
  saved: { color: colors.emerald, fontWeight: '700', lineHeight: 20 },
  proj: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  projItem: {
    color: colors.text,
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontWeight: '700',
    fontSize: 12,
  },
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
    paddingVertical: 10,
    minHeight: 40,
  },
  saveText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  entryRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  entry: { color: colors.faint, fontSize: 12, flex: 1, lineHeight: 18 },
  entrySlip: { color: colors.crimson },
  entryDelete: { color: colors.crimson, fontSize: 11, fontWeight: '700' },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kind: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
  daySlip: { backgroundColor: colors.crimson },
  daySel: { backgroundColor: colors.cardElevated },
  dayText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  dayTextSlip: { color: colors.white },
  slipNote: { color: colors.crimson, fontWeight: '700', marginBottom: 8, lineHeight: 20 },
  mood: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: colors.amber,
  },
  moodOn: { backgroundColor: colors.amber },
  addTrack: { gap: 8 },
  addRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  addBtn: {
    backgroundColor: colors.amber,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addBtnText: { color: colors.bg, fontWeight: '800', fontSize: 13 },
});
