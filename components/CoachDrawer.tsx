import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PressScale } from './PressScale';
import { useEngine } from '../src/store';
import { colors, fonts, radius } from '../src/theme';
import type { CoachChatThread } from '../src/types';

function confirmDelete(title: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`Удалить «${title}»?`)) onYes();
    return;
  }
  Alert.alert('Удалить чат?', title, [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Удалить', style: 'destructive', onPress: onYes },
  ]);
}

export function CoachDrawer({ onPick }: { onPick?: () => void }) {
  const { state, newCoachChat, selectCoachChat, renameCoachChat, deleteCoachChat } = useEngine();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const chats = [...(state.coachChats ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const startRename = (chat: CoachChatThread) => {
    setEditingId(chat.id);
    setDraft(chat.title);
  };

  const commitRename = () => {
    if (!editingId) return;
    renameCoachChat(editingId, draft);
    setEditingId(null);
  };

  return (
    <View style={styles.root}>
      <PressScale
        haptic="medium"
        onPress={() => {
          newCoachChat();
          onPick?.();
        }}
        style={styles.newBtn}>
        <Text style={styles.newText}>+ Новый чат</Text>
      </PressScale>
      <ScrollView style={styles.list} contentContainerStyle={styles.listInner} showsVerticalScrollIndicator={false}>
        {chats.map((chat) => {
          const on = chat.id === state.activeCoachChatId;
          const editing = editingId === chat.id;
          return (
            <View key={chat.id} style={[styles.row, on && styles.rowOn]}>
              {editing ? (
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  onBlur={commitRename}
                  onSubmitEditing={commitRename}
                  autoFocus
                  style={styles.rename}
                  placeholder="Название"
                  placeholderTextColor={colors.faint}
                />
              ) : (
                <PressScale
                  haptic="light"
                  onPress={() => {
                    selectCoachChat(chat.id);
                    onPick?.();
                  }}
                  style={styles.hit}>
                  <Text style={[styles.title, on && styles.titleOn]} numberOfLines={1}>
                    {chat.title}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {chat.messages.length ? `${chat.messages.length} сообщ.` : 'Пустой'}
                  </Text>
                </PressScale>
              )}
              <PressScale haptic="light" onPress={() => startRename(chat)} style={styles.iconBtn}>
                <Text style={styles.icon}>✎</Text>
              </PressScale>
              <PressScale
                haptic="warning"
                onPress={() => confirmDelete(chat.title, () => deleteCoachChat(chat.id))}
                style={styles.iconBtn}>
                <Text style={styles.iconDanger}>✕</Text>
              </PressScale>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 12, paddingTop: 4 },
  newBtn: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newText: { color: colors.bg, fontWeight: '800', fontSize: 15, fontFamily: fonts },
  list: { flex: 1 },
  listInner: { gap: 8, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingRight: 4,
  },
  rowOn: {
    borderColor: 'rgba(34,211,238,0.45)',
    backgroundColor: colors.cardElevated,
  },
  hit: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, minHeight: 56, justifyContent: 'center' },
  title: { color: colors.text, fontWeight: '700', fontSize: 14, fontFamily: fonts },
  titleOn: { color: colors.cyan },
  meta: { color: colors.faint, fontSize: 11, marginTop: 3, fontWeight: '600' },
  rename: {
    flex: 1,
    color: colors.text,
    paddingHorizontal: 12,
    minHeight: 48,
    fontFamily: fonts,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  icon: { color: colors.muted, fontSize: 14 },
  iconDanger: { color: colors.crimson, fontSize: 16, fontWeight: '700' },
});
