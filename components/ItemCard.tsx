import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp, LinearTransition } from 'react-native-reanimated';

import { STATUS_LABEL } from '../src/lib';
import { useEngine } from '../src/store';
import { accentGlow, colors, type Accent } from '../src/theme';
import type { CatalogItem, Status } from '../src/types';

const STATUSES: Status[] = ['planned', 'progress', 'done'];

export function ItemCard({ item, index, flush }: { item: CatalogItem; index: number; flush?: boolean }) {
  const { itemOf, setItemStatus, setItemNotes, addItemTag } = useEngine();
  const state = itemOf(item.id);
  const [tagDraft, setTagDraft] = useState('');
  const accent = colors[item.accent];
  const done = state.status === 'done';

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index, 8) * 40).duration(380)}
      layout={LinearTransition.springify()}
      style={[
        styles.card,
        { borderColor: colors.border, shadowColor: accent },
        done ? styles.cardDone : null,
        flush ? styles.cardFlush : null,
      ]}>
      <View style={[styles.rail, { backgroundColor: accent, shadowColor: accent }]} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Pressable
            onPress={() => setItemStatus(item.id, done ? 'planned' : 'done')}
            style={[
              styles.check,
              { borderColor: accent },
              done ? { backgroundColor: accent } : { backgroundColor: accentGlow[item.accent] },
            ]}>
            {done ? <Text style={styles.checkMark}>✓</Text> : null}
          </Pressable>
          <View style={styles.titles}>
            <Text style={[styles.title, done ? styles.titleDone : null]}>{item.title}</Text>
            {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
            {item.helper ? <Text style={styles.helper}>{item.helper}</Text> : null}
          </View>
        </View>

        <View style={styles.chips}>
          {STATUSES.map((status) => {
            const active = state.status === status;
            return (
              <Pressable
                key={status}
                onPress={() => setItemStatus(item.id, status)}
                style={[
                  styles.chip,
                  active ? { backgroundColor: accent, borderColor: accent } : null,
                ]}>
                <Text style={[styles.chipText, active ? styles.chipTextOn : null]}>
                  {STATUS_LABEL[status]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.tags}>
          {[...item.tags, ...state.extraTags].map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
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
        </View>

        <TextInput
          value={state.notes}
          onChangeText={(text) => setItemNotes(item.id, text)}
          placeholder="Инсайт / заметка к пункту"
          placeholderTextColor={colors.faint}
          style={styles.notes}
          multiline
        />
      </View>
    </Animated.View>
  );
}

export function SectionTitle({
  title,
  description,
  accent,
}: {
  title: string;
  description?: string;
  accent: Accent;
}) {
  return (
    <View style={styles.section}>
      <View style={[styles.dot, { backgroundColor: colors[accent] }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description ? <Text style={styles.sectionDesc}>{description}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardDone: { opacity: 0.78 },
  cardFlush: { marginBottom: 0, minHeight: 220, flex: 1 },
  rail: { width: 3, shadowOpacity: 0.8, shadowRadius: 8 },
  body: { flex: 1, padding: 14, gap: 10 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
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
  titles: { flex: 1 },
  title: { color: colors.text, fontSize: 15.5, fontWeight: '700', lineHeight: 21 },
  titleDone: { textDecorationLine: 'line-through', color: colors.muted },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  helper: { color: colors.faint, fontSize: 12, marginTop: 6, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 32,
    backgroundColor: colors.cardElevated,
  },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  chipTextOn: { color: colors.bg },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  tag: {
    backgroundColor: '#0F141F',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { color: colors.muted, fontSize: 11 },
  tagInput: {
    minWidth: 64,
    color: colors.text,
    fontSize: 12,
    paddingVertical: 2,
  },
  notes: {
    minHeight: 52,
    backgroundColor: '#0F141F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  section: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  dot: { width: 8, height: 8, borderRadius: 99, marginTop: 7 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  sectionDesc: { color: colors.muted, fontSize: 12.5, marginTop: 4, lineHeight: 18 },
});
