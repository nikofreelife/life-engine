import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { NativeSheet } from './NativeSheet';
import { colors } from '../src/theme';

type Props = {
  visible: boolean;
  title: string;
  value: string;
  placeholder?: string;
  onChange: (text: string) => void;
  onClose: () => void;
};

export function NoteEditor({ visible, title, value, placeholder, onChange, onClose }: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [value, visible]);

  const save = () => {
    onChange(draft);
    onClose();
  };

  return (
    <NativeSheet visible={visible} onClose={save}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.top, { paddingTop: 8 }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.ghost}>Закрыть</Text>
          </Pressable>
          <Text style={styles.kicker} numberOfLines={1}>
            Блокнот
          </Text>
          <Pressable onPress={save} hitSlop={12}>
            <Text style={styles.save}>Готово</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>{title}</Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder ?? 'Конспект, мысль, формулировка...'}
          placeholderTextColor={colors.faint}
          style={styles.input}
          multiline
          textAlignVertical="top"
          autoFocus
        />
      </KeyboardAvoidingView>
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  kicker: { color: colors.muted, fontWeight: '800', letterSpacing: 1.6, fontSize: 12 },
  ghost: { color: colors.muted, fontWeight: '700', fontSize: 16 },
  save: { color: colors.emerald, fontWeight: '800', fontSize: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 16, lineHeight: 28 },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    color: colors.text,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 28,
  },
});
