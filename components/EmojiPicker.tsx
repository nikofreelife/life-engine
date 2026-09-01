import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { filterEmojiGroups, firstGrapheme, isEmoji } from '../src/data/emoji';
import { colors, fonts } from '../src/theme';

export function EmojiPicker({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (emoji: string) => void;
}) {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => filterEmojiGroups(query), [query]);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Эмодзи</Text>
      <Text style={styles.lead}>Только эмодзи — буквы и цифры не принимаются.</Text>
      <View style={styles.previewRow}>
        <Text style={styles.preview}>{value || '✨'}</Text>
        <TextInput
          value=""
          onChangeText={(next) => {
            const glyph = firstGrapheme(next);
            if (isEmoji(glyph)) onSelect(glyph);
          }}
          placeholder="Вставь эмодзи"
          placeholderTextColor={colors.faint}
          style={styles.keyboard}
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="off"
        />
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Поиск по разделу"
        placeholderTextColor={colors.faint}
        style={styles.search}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <ScrollView style={styles.catalog} contentContainerStyle={styles.catalogInner} keyboardShouldPersistTaps="handled">
        {groups.map((group) => (
          <View key={group.id} style={styles.group}>
            <Text style={styles.groupTitle}>{group.label}</Text>
            <View style={styles.grid}>
              {group.glyphs.map((glyph) => {
                const on = value === glyph;
                return (
                  <Pressable
                    key={`${group.id}-${glyph}`}
                    onPress={() => onSelect(glyph)}
                    style={[styles.cell, on && styles.cellOn]}>
                    <Text style={styles.glyph}>{glyph}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', fontFamily: fonts },
  lead: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  preview: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 28,
    lineHeight: 52,
  },
  keyboard: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  search: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  catalog: { flex: 1 },
  catalogInner: { paddingBottom: 24, gap: 14 },
  group: { gap: 8 },
  groupTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellOn: { borderColor: colors.emerald, backgroundColor: 'rgba(16,185,129,0.16)' },
  glyph: { fontSize: 22 },
});
