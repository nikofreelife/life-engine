import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../src/theme';

type Props = {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onSave: (date: Date) => void;
};

export function DateStartPicker({ visible, value, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value.getTime() > Date.now() ? new Date() : value);
  }, [value, visible]);

  const commit = () => {
    const next = draft.getTime() > Date.now() ? new Date() : draft;
    onSave(next);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <Text style={styles.title}>Дата и время старта</Text>
          <Text style={styles.lead}>
            Если поставить дату в прошлом, дни и часы сразу посчитаются с того момента.
          </Text>
          <DateTimePicker
            value={draft}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            locale="ru-RU"
            maximumDate={new Date()}
            themeVariant="dark"
            textColor={colors.text}
            style={{ height: 216 }}
            onChange={(_, date) => {
              if (date) setDraft(date);
            }}
          />
          <View style={styles.row}>
            <Pressable onPress={onClose} style={styles.ghost}>
              <Text style={styles.ghostText}>Отмена</Text>
            </Pressable>
            <Pressable onPress={commit} style={styles.ok}>
              <Text style={styles.okText}>Поставить</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 12,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  ghost: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { color: colors.muted, fontWeight: '700' },
  ok: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okText: { color: colors.bg, fontWeight: '800' },
});
