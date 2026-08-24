import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { monthMatrix, streakFor, todayKey } from '../src/lib';
import { useEngineLayout } from '../src/layout';
import { useEngine } from '../src/store';
import { colors } from '../src/theme';

const WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function HabitBoard() {
  const { state, addHabit, removeHabit, toggleHabitDay } = useEngine();
  const { columns, isTablet } = useEngineLayout();
  const habitCols = Math.min(columns, 2);
  const [name, setName] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const matrix = useMemo(() => monthMatrix(year, month), [year, month]);
  const today = todayKey();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.kicker, isTablet && { fontSize: 18 }]}>Дневной трекер привычек</Text>
      <View style={styles.addRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Новая привычка"
          placeholderTextColor={colors.faint}
          style={styles.input}
          onSubmitEditing={() => {
            addHabit(name);
            setName('');
          }}
        />
        <Pressable
          onPress={() => {
            addHabit(name);
            setName('');
          }}
          style={styles.addBtn}>
          <Text style={styles.addBtnText}>Добавить</Text>
        </Pressable>
      </View>

      <View style={styles.habitGrid}>
      {state.habits.map((habit) => {
        const streak = streakFor(habit);
        const doneToday = Boolean(habit.completions[today]);
        const open = openId === habit.id;
        return (
          <Animated.View
            key={habit.id}
            layout={LinearTransition.springify()}
            entering={FadeIn}
            style={[styles.card, habitCols > 1 && styles.cardHalf]}>
            <View style={styles.head}>
              <Pressable
                onPress={() => toggleHabitDay(habit.id)}
                style={[styles.check, doneToday && styles.checkOn]}>
                {doneToday ? <Text style={styles.tick}>✓</Text> : null}
              </Pressable>
              <Pressable style={{ flex: 1 }} onPress={() => setOpenId(open ? null : habit.id)}>
                <Text style={styles.name}>{habit.name}</Text>
                <Text style={styles.meta}>
                  {streak} дн. стрик · календарь {open ? 'скрыть' : 'открыть'}
                </Text>
              </Pressable>
              <Pressable onPress={() => removeHabit(habit.id)} hitSlop={8}>
                <Text style={styles.delete}>удалить</Text>
              </Pressable>
            </View>
            {open ? (
              <View style={styles.cal}>
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
                          onPress={() => toggleHabitDay(habit.id, day)}
                          style={[
                            styles.cell,
                            styles.day,
                            on && styles.dayOn,
                            isToday && styles.dayToday,
                          ]}>
                          <Text style={[styles.dayText, on && styles.dayTextOn]}>
                            {Number(day.slice(-2))}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            ) : null}
          </Animated.View>
        );
      })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14, marginBottom: 16 },
  kicker: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  habitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  cardHalf: { flexBasis: 340, flexGrow: 1, maxWidth: '100%' },
  addRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addBtn: {
    backgroundColor: colors.emerald,
    borderRadius: 14,
    paddingHorizontal: 18,
    minHeight: 48,
    justifyContent: 'center',
  },
  addBtnText: { color: colors.bg, fontWeight: '800', fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  checkOn: { backgroundColor: colors.emerald },
  tick: { color: colors.bg, fontWeight: '900' },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  delete: { color: colors.crimson, fontSize: 11, fontWeight: '700' },
  cal: { marginTop: 12, gap: 6 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  week: { flex: 1, textAlign: 'center', color: colors.faint, fontSize: 10, fontWeight: '700' },
  cell: { flex: 1, aspectRatio: 1, maxHeight: 48, alignItems: 'center', justifyContent: 'center' },
  day: { borderRadius: 10, backgroundColor: '#0F141F' },
  dayOn: { backgroundColor: colors.emerald },
  dayToday: { borderWidth: 1, borderColor: colors.amber },
  dayText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  dayTextOn: { color: colors.bg },
});
