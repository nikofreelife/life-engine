import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DateStartPicker } from './DateStartPicker';
import { NativeSheet } from './NativeSheet';
import { RelapseModal } from './RelapseModal';
import { SwipeDeleteRow } from './SwipeDeleteRow';
import { hapticMedium, hapticSuccess, hapticWarning } from '../src/haptics';

import { elapsedParts, money, monthMatrix, thcSavings, todayKey } from '../src/lib';
import { useEngineLayout } from '../src/layout';
import { useEngine } from '../src/store';
import { colors } from '../src/theme';
import { CUSTOM_SCALES, TRACK_TEMPLATES, scalePercent, templateOf } from '../src/tracks';
import type { AbstinenceTrack, DayState, JournalKind } from '../src/types';

const WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const KIND_LABEL: Record<JournalKind, string> = {
  note: 'заметка',
  craving: 'тяга',
  win: 'победа',
  slip: 'срыв',
};

function Counter({
  title,
  name,
  accent,
  startISO,
  track,
  extra,
  fill,
  onDelete,
  onOpenStats,
}: {
  title: string;
  name: string;
  accent: string;
  startISO: string | null;
  track: string;
  extra?: ReactNode;
  fill?: boolean;
  onDelete: () => void;
  onOpenStats: () => void;
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

  const onLongPress = () => {
    void hapticMedium();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: name,
          options: ['Отмена', 'Подробная статистика', 'Удалить трекер'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
          userInterfaceStyle: 'dark',
        },
        (index) => {
          if (index === 1) onOpenStats();
          if (index === 2) onDelete();
        },
      );
      return;
    }
    onDelete();
  };

  return (
    <View style={[styles.card, { borderColor: accent }, fill && { flex: 1 }]}>
      <View style={styles.headRow}>
        <Pressable onLongPress={onLongPress} delayLongPress={420} style={styles.headCopy}>
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
        </Pressable>
        <View style={styles.headActions}>
          <Pressable
            onPress={onOpenStats}
            onLongPress={onLongPress}
            hitSlop={8}
            accessibilityLabel="Подробная статистика"
            style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>📊</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            accessibilityLabel="Удалить трекер"
            style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>🗑️</Text>
          </Pressable>
        </View>
      </View>
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
            onPress={() => {
              void hapticSuccess();
              setTrackStart(track, new Date().toISOString());
            }}
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
      </View>
      {extra}
      <DateStartPicker
        visible={picker}
        value={startISO ? new Date(startISO) : new Date()}
        onClose={() => setPicker(false)}
        onSave={(date) => {
          void hapticSuccess();
          setTrackStart(track, date.toISOString());
        }}
      />
      <RelapseModal
        visible={relapseOpen}
        title={title}
        onClose={() => setRelapseOpen(false)}
        onSave={(reason) => {
          void hapticWarning();
          relapse(track, reason);
        }}
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

function ScaleBar({
  label,
  days,
  daysToFull,
  milestones,
  color,
}: {
  label: string;
  days: number;
  daysToFull: number;
  milestones?: number[];
  color: string;
}) {
  const pct = scalePercent(days, daysToFull);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>
        {label} · {Math.round(pct)}%
      </Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      {milestones?.length ? (
        <View style={styles.miles}>
          {milestones.map((m) => (
            <Text key={m} style={[styles.mile, days >= m && { color }]}>
              {m}д {days >= m ? '✓' : ''}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function TrackExtras({ track }: { track: AbstinenceTrack }) {
  const { patchTrack, addJournal, removeJournal } = useEngine();
  const tpl = templateOf(track.kind);
  const accent = colors[tpl?.accent ?? 'amber'];
  const elapsed = elapsedParts(track.startISO);
  const savings = thcSavings(track.monthlyCost, track.startISO);
  const showMoney = track.kind === 'custom' || Boolean(tpl?.money);
  const scales = tpl?.scales ?? CUSTOM_SCALES;

  return (
    <View style={{ marginTop: 16, gap: 10 }}>
      {showMoney ? (
        <>
          <Text style={styles.label}>{tpl?.moneyLabel || 'Траты в месяц (₽ / $)'}</Text>
          <TextInput
            keyboardType="numeric"
            value={track.monthlyCost ? String(Math.round(track.monthlyCost)) : ''}
            onChangeText={(v) => patchTrack(track.id, { monthlyCost: Number(v.replace(/[^\d.]/g, '')) || 0 })}
            placeholder="0"
            placeholderTextColor={colors.faint}
            style={styles.money}
          />
          <Text style={styles.saved}>
            Сэкономлено за стрик: {money(savings.saved)} · {elapsed.days}д {elapsed.hours}ч
          </Text>
          <View style={styles.proj}>
            <Text style={styles.projItem}>1 мес · {money(savings.month)}</Text>
            <Text style={styles.projItem}>6 мес · {money(savings.sixMonths)}</Text>
            <Text style={styles.projItem}>1 год · {money(savings.year)}</Text>
          </View>
        </>
      ) : null}
      {scales.map((scale) => (
        <ScaleBar
          key={scale.label}
          label={scale.label}
          days={elapsed.days}
          daysToFull={scale.daysToFull}
          milestones={scale.milestones}
          color={accent}
        />
      ))}
      <JournalBox
        placeholder="Тяга, срыв, победа или заметка"
        entries={track.journal}
        onAdd={(kind, text) => addJournal(track.id, kind, text)}
        onRemove={(id) => removeJournal(track.id, id)}
      />
    </View>
  );
}

function TrackStatsModal({
  track,
  visible,
  onClose,
  onDelete,
}: {
  track: AbstinenceTrack | null;
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  if (!track) return null;
  const tpl = templateOf(track.kind);
  const title = `${tpl?.emoji ?? '➕'} ${track.name}`;
  const t = elapsedParts(track.startISO);

  return (
    <NativeSheet visible={visible} onClose={onClose}>
      <View style={styles.statsRoot}>
        <View style={styles.statsTop}>
          <Text style={styles.statsKicker}>ПОДРОБНАЯ СТАТИСТИКА</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.ghostBtnText}>Закрыть</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.statsBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.hero}>{title}</Text>
          {track.startISO ? (
            <Text style={styles.clock}>
              {t.days} дн · {t.hours} ч {t.minutes} мин · старт {new Date(track.startISO).toLocaleString('ru-RU')}
            </Text>
          ) : (
            <Text style={styles.clock}>Счётчик ещё не запущен</Text>
          )}
          <TrackExtras track={track} />
          <Pressable onPress={onDelete} style={styles.deleteTracker}>
            <Text style={styles.deleteTrackerText}>🗑️  Удалить трекер</Text>
          </Pressable>
        </ScrollView>
      </View>
    </NativeSheet>
  );
}

function DeleteConfirmModal({
  name,
  visible,
  onCancel,
  onConfirm,
}: {
  name: string;
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <NativeSheet visible={visible} onClose={onCancel} height="auto">
      <View style={styles.confirmCard}>
        <Text style={styles.confirmTitle}>Удалить счетчик {name}?</Text>
        <Text style={styles.confirmLead}>Вся история и текущий стрик будут сброшены.</Text>
        <View style={styles.confirmRow}>
          <Pressable onPress={onCancel} style={styles.confirmGhost}>
            <Text style={styles.ghostBtnText}>Отмена</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void hapticWarning();
              onConfirm();
            }}
            style={styles.confirmDelete}>
            <Text style={styles.confirmDeleteText}>Удалить</Text>
          </Pressable>
        </View>
      </View>
    </NativeSheet>
  );
}

export function SecretVault() {
  const { state, setCalendarDay, addCustomTrack, removeTrack, restoreTemplate } = useEngine();
  const { isTablet } = useEngineLayout();
  const secret = state.secret;
  const tracks = secret.tracks ?? [];
  const now = new Date();
  const matrix = useMemo(() => monthMatrix(now.getFullYear(), now.getMonth()), [now.getFullYear(), now.getMonth()]);
  const [selected, setSelected] = useState(todayKey());
  const [customName, setCustomName] = useState('');
  const [customMoney, setCustomMoney] = useState('');
  const [statsId, setStatsId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AbstinenceTrack | null>(null);
  const selectedDay = secret.calendar[selected];
  const missingTemplates = TRACK_TEMPLATES.filter((tpl) => !tracks.some((track) => track.kind === tpl.kind));
  const statsTrack = tracks.find((track) => track.id === statsId) ?? null;

  const requestDelete = (track: AbstinenceTrack) => {
    setStatsId(null);
    setPendingDelete(track);
  };

  const commitDelete = () => {
    const id = pendingDelete?.id;
    setPendingDelete(null);
    setStatsId(null);
    if (id) removeTrack(id);
  };

  return (
    <>
    <ScrollView
      contentContainerStyle={styles.page}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <Text style={[styles.hero, isTablet && { fontSize: 36 }]}>Чистый Разум</Text>
      <Text style={[styles.lead, isTablet && { fontSize: 16, lineHeight: 24 }]}>
        Hardcore Mode · шаблоны воздержания, экономия и восстановление. Укажи прошедшую дату — счётчик пересчитается сразу.
      </Text>

      <View style={[styles.trackList, isTablet && styles.split]}>
        {tracks.map((track) => {
          const tpl = templateOf(track.kind);
          return (
            <SwipeDeleteRow key={track.id} fill={isTablet} onDeletePress={() => requestDelete(track)}>
              <Counter
                fill={isTablet}
                title={`${tpl?.emoji ?? '➕'} ${track.name}`}
                name={track.name}
                accent={colors[tpl?.accent ?? 'amber']}
                startISO={track.startISO}
                track={track.id}
                onDelete={() => requestDelete(track)}
                onOpenStats={() => setStatsId(track.id)}
                extra={<TrackExtras track={track} />}
              />
            </SwipeDeleteRow>
          );
        })}
      </View>

      <View style={styles.addTrack}>
        <Text style={styles.label}>+ Добавить своё воздержание</Text>
        {tracks.length === 0 ? (
          <Text style={styles.clock}>
            Пока пусто. Нажми «+ Добавить своё воздержание» — шаблон или счётчик с нуля.
          </Text>
        ) : null}
        {missingTemplates.length ? (
          <>
            <Text style={styles.subLabel}>Быстрый шаблон</Text>
            {missingTemplates.map((tpl) => (
              <Pressable key={tpl.kind} onPress={() => restoreTemplate(tpl.kind)} style={styles.tplCard}>
                <Text style={styles.tplTitle}>
                  {tpl.emoji} {tpl.name}
                </Text>
                <Text style={styles.tplHint}>{tpl.scales.map((scale) => scale.label).join(' · ')}</Text>
              </Pressable>
            ))}
          </>
        ) : null}
        <Text style={styles.subLabel}>Или создать с нуля</Text>
        <TextInput
          value={customName}
          onChangeText={setCustomName}
          placeholder="Название: игромания, соцсети..."
          placeholderTextColor={colors.faint}
          style={styles.money}
        />
        <TextInput
          value={customMoney}
          onChangeText={setCustomMoney}
          keyboardType="numeric"
          placeholder="Траты в месяц (необязательно)"
          placeholderTextColor={colors.faint}
          style={styles.money}
        />
        <Pressable
          onPress={() => {
            addCustomTrack(customName, Number(customMoney.replace(/[^\d.]/g, '')) || 0);
            setCustomName('');
            setCustomMoney('');
          }}
          style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Добавить своё воздержание</Text>
        </Pressable>
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
    <TrackStatsModal
      track={statsTrack}
      visible={Boolean(statsTrack)}
      onClose={() => setStatsId(null)}
      onDelete={() => {
        if (statsTrack) requestDelete(statsTrack);
      }}
    />
    <DeleteConfirmModal
      visible={Boolean(pendingDelete)}
      name={pendingDelete?.name ?? ''}
      onCancel={() => setPendingDelete(null)}
      onConfirm={commitDelete}
    />
    </>
  );
}

const styles = StyleSheet.create({
  page: { paddingBottom: 56, gap: 18 },
  trackList: { gap: 18 },
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
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  headCopy: { flex: 1, minWidth: 0 },
  headActions: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#0F141F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 16 },
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
  subLabel: { color: colors.faint, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginTop: 4 },
  tplCard: {
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  tplTitle: { color: colors.text, fontWeight: '800', fontSize: 13 },
  tplHint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
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
    alignItems: 'center',
  },
  addBtnText: { color: colors.bg, fontWeight: '800', fontSize: 13 },
  statsRoot: { flex: 1, backgroundColor: colors.bg },
  statsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  statsKicker: { color: colors.crimson, fontWeight: '800', letterSpacing: 1.6, fontSize: 11 },
  statsBody: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  deleteTracker: {
    marginTop: 12,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.crimson,
    backgroundColor: 'rgba(239,68,68,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteTrackerText: { color: colors.crimson, fontWeight: '800', fontSize: 15 },
  confirmRoot: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  confirmBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.64)',
  },
  confirmCard: {
    backgroundColor: colors.card,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 24,
  },
  confirmTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  confirmLead: { color: colors.muted, marginTop: 8, lineHeight: 20 },
  confirmRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  confirmGhost: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDelete: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.crimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
