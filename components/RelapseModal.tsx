import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../src/theme';

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onSave: (reason: string) => void;
};

export function RelapseModal({ visible, title, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) setReason('');
  }, [visible]);

  const clean = reason.trim();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, { paddingTop: Math.max(insets.top, 18), paddingBottom: Math.max(insets.bottom, 18) }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.kicker}>ФИКСАЦИЯ СРЫВА</Text>
        <Text style={styles.title}>{title ?? 'Я сорвался'}</Text>
        <Text style={styles.lead}>
          Счётчик обнулится и начнётся заново. Причина уйдёт в историю и отметится красным в календаре чистоты.
        </Text>
        <Text style={styles.label}>Причина срыва / Что триггернуло?</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Стресс, компания, усталость, скука..."
          placeholderTextColor={colors.faint}
          style={styles.input}
          multiline
          autoFocus
        />
        <View style={styles.row}>
          <Pressable onPress={onClose} style={styles.ghost}>
            <Text style={styles.ghostText}>Отмена</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!clean) return;
              onSave(clean);
              onClose();
            }}
            style={[styles.ok, !clean && styles.okOff]}>
            <Text style={styles.okText}>Сохранить срыв</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22 },
  kicker: { color: colors.crimson, fontWeight: '800', letterSpacing: 2, fontSize: 12, marginBottom: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  lead: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 22 },
  label: { color: colors.text, fontWeight: '700', marginBottom: 8 },
  input: {
    minHeight: 140,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    color: colors.text,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: 12, marginTop: 20 },
  ghost: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { color: colors.muted, fontWeight: '700' },
  ok: {
    flex: 1.4,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.crimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okOff: { opacity: 0.4 },
  okText: { color: colors.white, fontWeight: '800' },
});
