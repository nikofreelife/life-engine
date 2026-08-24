import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInUp, LinearTransition } from 'react-native-reanimated';

import { NoteEditor } from './NoteEditor';
import { STATUS_LABEL } from '../src/lib';
import { useEngine } from '../src/store';
import { accentGlow, colors, type Accent } from '../src/theme';
import type { CatalogItem, Status } from '../src/types';

const STATUSES: Status[] = ['planned', 'progress', 'done'];

export function ItemCard({
  item,
  index,
  guide,
  onRemove,
}: {
  item: CatalogItem;
  index: number;
  guide?: boolean;
  onRemove?: () => void;
}) {
  const { itemOf, setItemStatus, setItemNotes, addItemTag } = useEngine();
  const state = itemOf(item.id);
  const [tagDraft, setTagDraft] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const accent = colors[item.accent];
  const done = state.status === 'done';
  const notePreview = state.notes.trim();

  return (
    <>
      <Animated.View
        entering={FadeInUp.delay(Math.min(index, 8) * 40).duration(380)}
        layout={LinearTransition.springify()}
        style={[styles.card, { borderColor: colors.border, shadowColor: accent }, done && !guide ? styles.cardDone : null]}>
        <View style={[styles.rail, { backgroundColor: accent, shadowColor: accent }]} />
        <View style={styles.body}>
          <View style={styles.row}>
            {guide ? (
              <View style={[styles.guideMark, { backgroundColor: accentGlow[item.accent] }]} />
            ) : (
              <Pressable
                onPress={() => setItemStatus(item.id, done ? 'planned' : 'done')}
                style={[
                  styles.check,
                  { borderColor: accent },
                  done ? { backgroundColor: accent } : { backgroundColor: accentGlow[item.accent] },
                ]}>
                {done ? <Text style={styles.checkMark}>✓</Text> : null}
              </Pressable>
            )}
            <View style={styles.titles}>
              <Text style={[styles.title, done && !guide ? styles.titleDone : null]}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
              {item.helper ? <Text style={styles.helper}>{item.helper}</Text> : null}
              {item.body ? <Text style={styles.bodyText}>{item.body}</Text> : null}
            </View>
          </View>

          {guide ? null : (
            <View style={styles.chips}>
              {STATUSES.map((status) => {
                const active = state.status === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => setItemStatus(item.id, status)}
                    style={[styles.chip, active ? { backgroundColor: accent, borderColor: accent } : null]}>
                    <Text style={[styles.chipText, active ? styles.chipTextOn : null]}>{STATUS_LABEL[status]}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.tags}>
            {[...item.tags, ...state.extraTags].map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {guide ? null : (
              <TextInput
                value={tagDraft}
                onChangeText={setTagDraft}
                placeholder="+ тег"
                placeholderTextColor={colors.faint}
                style={styles.tagInput}
                onSubmitEditing={() => {
                  addItemTag(item.id, tagDraft);
                  setTagDraft('');
                }}
              />
            )}
          </View>

          <Pressable onPress={() => setNoteOpen(true)} style={styles.noteBtn}>
            <Text style={styles.noteKicker}>{notePreview ? 'Заметка' : 'Блокнот'}</Text>
            <Text style={styles.notePreview} numberOfLines={3}>
              {notePreview || 'Открыть полноценный блокнот для конспекта и мыслей'}
            </Text>
          </Pressable>

          {onRemove ? (
            <Pressable
              onPress={() =>
                Alert.alert('Удалить пункт?', item.title, [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Удалить', style: 'destructive', onPress: onRemove },
                ])
              }>
              <Text style={styles.delete}>удалить пункт</Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
      <NoteEditor
        visible={noteOpen}
        title={item.title}
        value={state.notes}
        onChange={(text) => setItemNotes(item.id, text)}
        onClose={() => setNoteOpen(false)}
      />
    </>
  );
}

export function SectionTitle({
  title,
  description,
  accent,
  onAddItem,
  onRemoveSection,
}: {
  title: string;
  description?: string;
  accent: Accent;
  onAddItem?: () => void;
  onRemoveSection?: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={[styles.dot, { backgroundColor: colors[accent] }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description ? <Text style={styles.sectionDesc}>{description}</Text> : null}
      </View>
      {onAddItem ? (
        <Pressable onPress={onAddItem} style={styles.sectionBtn}>
          <Text style={styles.sectionBtnText}>+ пункт</Text>
        </Pressable>
      ) : null}
      {onRemoveSection ? (
        <Pressable onPress={onRemoveSection} style={styles.sectionBtn}>
          <Text style={[styles.sectionBtnText, { color: colors.crimson }]}>удалить</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function AddSectionCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.addSection}>
      <Text style={styles.addSectionTitle}>Новый раздел</Text>
      <Text style={styles.addSectionLead}>Своя категория в этой вкладке — книги, курсы или протоколы.</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderRadius: 22,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 168,
  },
  cardDone: { opacity: 0.82 },
  rail: { width: 3, shadowOpacity: 0.8, shadowRadius: 8 },
  body: { flex: 1, padding: 20, gap: 14 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  check: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkMark: { color: colors.bg, fontWeight: '900', fontSize: 14 },
  guideMark: { width: 8, height: 8, borderRadius: 99, marginTop: 8 },
  titles: { flex: 1 },
  title: { color: colors.text, fontSize: 16.5, fontWeight: '700', lineHeight: 23 },
  titleDone: { textDecorationLine: 'line-through', color: colors.muted },
  subtitle: { color: colors.muted, fontSize: 13.5, marginTop: 6, lineHeight: 20 },
  helper: { color: colors.faint, fontSize: 13, marginTop: 8, lineHeight: 19 },
  bodyText: { color: colors.muted, fontSize: 14.5, marginTop: 12, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 34,
    backgroundColor: colors.cardElevated,
  },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  chipTextOn: { color: colors.bg },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  tag: {
    backgroundColor: '#0F141F',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: { color: colors.muted, fontSize: 11 },
  tagInput: {
    minWidth: 64,
    color: colors.text,
    fontSize: 12,
    paddingVertical: 2,
  },
  noteBtn: {
    backgroundColor: '#0F141F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 72,
  },
  noteKicker: {
    color: colors.emerald,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  notePreview: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  delete: { color: colors.crimson, fontSize: 12, fontWeight: '700' },
  section: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 28,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  dot: { width: 8, height: 8, borderRadius: 99, marginTop: 8 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sectionDesc: { color: colors.muted, fontSize: 13.5, marginTop: 6, lineHeight: 20 },
  sectionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 6,
  },
  sectionBtnText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  addSection: {
    marginTop: 28,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 22,
    padding: 22,
    backgroundColor: colors.card,
    gap: 8,
  },
  addSectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  addSectionLead: { color: colors.muted, fontSize: 13, lineHeight: 19 },
});

