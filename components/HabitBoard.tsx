import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { EmojiPicker } from './EmojiPicker';
import { NativeSheet } from './NativeSheet';
import { PressScale } from './PressScale';
import { isEmoji } from '../src/data/emoji';
import { monthMatrix, streakFor, todayKey } from '../src/lib';
import { useEngineLayout } from '../src/layout';
import { useEngine } from '../src/store';
import { colors } from '../src/theme';
import type { Habit, HabitSlot } from '../src/types';

const WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const SLOTS: { id: HabitSlot; label: string }[] = [
  { id: 'morning', label: 'Утро' },
  { id: 'day', label: 'День' },
  { id: 'evening', label: 'Вечер' },
];

export function HabitBoard() {
  const { state, addHabit, removeHabit, toggleHabitDay } = useEngine();
  const { isTablet } = useEngineLayout();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [slot, setSlot] = useState<HabitSlot>('morning');
  const [picker, setPicker] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const matrix = useMemo(() => monthMatrix(year, month), [year, month]);
  const today = todayKey();

  const grouped = SLOTS.map((group) => ({
    ...group,
    habits: state.habits.filter((habit) => (habit.slot ?? 'day') === group.id),
  }));

  const submit = () => {
    const clean = name.trim();
    if (!clean) return;
    addHabit(clean, { emoji: isEmoji(emoji) ? emoji : '✨', slot });
    setName('');
    setEmoji('✨');
    setSlot('morning');
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.kicker, isTablet && { fontSize: 18 }]}>Дневной трекер привычек</Text>

      <View style={styles.composer}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Название привычки"
          placeholderTextColor={colors.faint}
          style={styles.input}
          onSubmitEditing={submit}
        />
        <PressScale haptic="light" onPress={() => setPicker(true)} style={styles.iconPick}>
          <View style={styles.iconMark}>
            <Text style={styles.iconGlyph}>{emoji}</Text>
          </View>
          <Text style={styles.iconLabel}>Иконка</Text>
        </PressScale>
        <NativeSheet visible={picker} onClose={() => setPicker(false)} height="full">
          <View style={{ flex: 1 }}>
            <EmojiPicker
              value={emoji}
              onSelect={(next) => {
                if (!isEmoji(next)) return;
                setEmoji(next);
                setPicker(false);
              }}
            />
          </View>
        </NativeSheet>
        <Text style={styles.fieldLabel}>Время суток</Text>
        <View style={styles.chipRow}>
          {SLOTS.map((item) => {
            const on = slot === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSlot(item.id)}
                style={[styles.slotChip, on && styles.slotChipOn]}>
                <Text style={[styles.slotChipText, on && styles.slotChipTextOn]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={submit} style={styles.addBtn}>
          <Text style={styles.addBtnText}>Добавить привычку</Text>
        </Pressable>
      </View>

      {grouped.map((group) => (
        <View key={group.id} style={styles.group}>
          <Text style={styles.groupTitle}>{group.label}</Text>
          {group.habits.length ? (
            group.habits.map((habit) => (
              <HabitStrip
                key={habit.id}
                habit={habit}
                today={today}
                open={openId === habit.id}
                matrix={matrix}
                onToggleToday={() => toggleHabitDay(habit.id)}
                onToggleDay={(day) => toggleHabitDay(habit.id, day)}
                onOpen={() => setOpenId(openId === habit.id ? null : habit.id)}
                onRemove={() => removeHabit(habit.id)}
              />
            ))
          ) : (
            <Text style={styles.empty}>Пока пусто — создай привычку выше (название, emoji, утро/день/вечер).</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function HabitStrip({
  habit,
  today,
  open,
  matrix,
  onToggleToday,
  onToggleDay,
  onOpen,
  onRemove,
}: {
  habit: Habit;
  today: string;
  open: boolean;
  matrix: (string | null)[][];
  onToggleToday: () => void;
  onToggleDay: (day: string) => void;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const streak = streakFor(habit);
  const doneToday = Boolean(habit.completions[today]);

  return (
    <View style={styles.strip}>
      <View style={styles.stripRow}>
        <Pressable onPress={onOpen} style={styles.stripMain}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{habit.emoji || '✨'}</Text>
          </View>
          <View style={styles.stripCopy}>
            <Text style={styles.name} numberOfLines={1}>
              {habit.name}
            </Text>
            <Text style={styles.meta}>
              {streak} дн. стрик · календарь {open ? 'скрыть' : 'открыть'}
            </Text>
          </View>
        </Pressable>
        <PressScale
          haptic="rigid"
          onPress={onToggleToday}
          hitSlop={6}
          style={[styles.check, doneToday && styles.checkOn]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: doneToday }}
          accessibilityLabel={doneToday ? 'Снять отметку' : 'Отметить выполненным'}>
          {doneToday ? <Text style={styles.tick}>✓</Text> : null}
        </PressScale>
      </View>
      {open ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={styles.cal}>
          <Pressable onPress={onRemove} hitSlop={8} style={styles.deleteHit}>
            <Text style={styles.delete}>удалить привычку</Text>
          </Pressable>
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
                const on = Boolean(habit.completions[day]);
                const isToday = day === today;
                return (
                  <Pressable
                    key={day}
                    onPress={() => onToggleDay(day)}
                    style={[styles.cell, styles.day, on && styles.dayOn, isToday && styles.dayToday]}>
                    <Text style={[styles.dayText, on && styles.dayTextOn]}>{Number(day.slice(-2))}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14, marginBottom: 16 },
  kicker: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  composer: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  input: {
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  iconPick: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
  },
  iconMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#0F141F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: { fontSize: 22, textAlign: 'center' },
  iconLabel: { color: colors.text, fontWeight: '800', fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  slotChipOn: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  slotChipText: { color: colors.muted, fontWeight: '800', fontSize: 13 },
  slotChipTextOn: { color: colors.bg },
  addBtn: {
    backgroundColor: colors.emerald,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: colors.bg, fontWeight: '800', fontSize: 13 },
  group: { gap: 8 },
  groupTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  empty: { color: colors.faint, fontSize: 12, paddingHorizontal: 4 },
  strip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  stripRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stripMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 20 },
  stripCopy: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,185,129,0.10)',
  },
  checkOn: { backgroundColor: colors.emerald },
  tick: { color: colors.bg, fontWeight: '900', fontSize: 16 },
  cal: { marginTop: 12, gap: 6 },
  deleteHit: { alignSelf: 'flex-start' },
  delete: { color: colors.crimson, fontSize: 11, fontWeight: '700' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  week: { flex: 1, textAlign: 'center', color: colors.faint, fontSize: 10, fontWeight: '700' },
  cell: { flex: 1, aspectRatio: 1, maxHeight: 48, alignItems: 'center', justifyContent: 'center' },
  day: { borderRadius: 10, backgroundColor: '#0F141F' },
  dayOn: { backgroundColor: colors.emerald },
  dayToday: { borderWidth: 1, borderColor: colors.amber },
  dayText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  dayTextOn: { color: colors.bg },
});
