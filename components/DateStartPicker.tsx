import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shiftDays } from '../src/lib';
import { colors } from '../src/theme';

type Props = {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onSave: (date: Date) => void;
};

function clampPast(date: Date) {
  return date.getTime() > Date.now() ? new Date() : date;
}

function applyDate(base: Date, picked: Date) {
  const next = new Date(base);
  next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  return clampPast(next);
}

function applyTime(base: Date, picked: Date) {
  const next = new Date(base);
  next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return clampPast(next);
}

const PRESETS = [
  { label: 'Сейчас', days: 0 },
  { label: '3 дня назад', days: -3 },
  { label: 'Неделя', days: -7 },
  { label: 'Месяц', days: -30 },
];

export function DateStartPicker({ visible, value, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(clampPast(value));

  useEffect(() => {
    if (visible) setDraft(clampPast(value));
  }, [value, visible]);

  const commit = () => {
    onSave(clampPast(draft));
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.head}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.ghost}>Закрыть</Text>
          </Pressable>
          <Text style={styles.kicker}>СТАРТ ЦИКЛА</Text>
          <Pressable onPress={commit} hitSlop={12}>
            <Text style={styles.save}>Поставить</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>Дата и время</Text>
        <Text style={styles.lead}>
          Выбери любую прошедшую точку. Счётчик дней, часов и экономии пересчитается с неё, а не с текущего момента.
        </Text>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.presets}>
            {PRESETS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => setDraft(clampPast(shiftDays(item.days)))}
                style={styles.preset}>
                <Text style={styles.presetText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.preview}>{draft.toLocaleString('ru-RU')}</Text>
          <Text style={styles.section}>Календарь</Text>
          <View style={styles.pickerBox}>
            <DateTimePicker
              value={draft}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
              locale="ru-RU"
              maximumDate={new Date()}
              accentColor={colors.emerald}
              themeVariant="dark"
              onChange={(_, date) => {
                if (date) setDraft((prev) => applyDate(prev, date));
              }}
            />
          </View>
          <Text style={styles.section}>Время</Text>
          <View style={styles.pickerBox}>
            <DateTimePicker
              value={draft}
              mode="time"
              display="spinner"
              locale="ru-RU"
              is24Hour
              themeVariant="dark"
              textColor={colors.text}
              accentColor={colors.emerald}
              style={{ height: 180 }}
              onChange={(_, date) => {
                if (date) setDraft((prev) => applyTime(prev, date));
              }}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  kicker: { color: colors.muted, fontWeight: '800', letterSpacing: 1.5, fontSize: 11 },
  ghost: { color: colors.muted, fontWeight: '700', fontSize: 16 },
  save: { color: colors.emerald, fontWeight: '800', fontSize: 16 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 12 },
  body: { paddingBottom: 32, gap: 12 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  preview: { color: colors.emerald, fontWeight: '800', fontSize: 16 },
  section: { color: colors.muted, fontWeight: '800', letterSpacing: 1.2, fontSize: 11, marginTop: 6 },
  pickerBox: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
  },
});
