import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ItemCard, SectionTitle } from './ItemCard';
import { STATUS_LABEL } from '../src/lib';
import { useEngineLayout } from '../src/layout';
import { useEngine } from '../src/store';
import { colors } from '../src/theme';
import type { CatalogSection, Status } from '../src/types';

const FILTERS: Array<'all' | Status> = ['all', 'planned', 'progress', 'done'];

export function CatalogView({
  sections,
  searchHint,
}: {
  sections: CatalogSection[];
  searchHint: string;
}) {
  const { itemOf } = useEngine();
  const { isTablet, slot } = useEngineLayout();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const state = itemOf(item.id);
          if (filter !== 'all' && state.status !== filter) return false;
          if (!q) return true;
          return [item.title, item.subtitle, item.helper, ...item.tags, ...state.extraTags, state.notes]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [filter, itemOf, query, sections]);

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={searchHint}
        placeholderTextColor={colors.faint}
        style={[styles.search, isTablet && styles.searchTablet]}
      />
      <View style={[styles.filterWrap, isTablet && { height: 48 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((key) => {
            const active = filter === key;
            return (
              <Pressable key={key} onPress={() => setFilter(key)} style={[styles.filter, isTablet && styles.filterTablet, active && styles.filterOn]}>
                <Text style={[styles.filterText, isTablet && { fontSize: 14 }, active && styles.filterTextOn]}>
                  {key === 'all' ? 'Все' : STATUS_LABEL[key]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      {visible.map((section) => (
        <View key={section.id}>
          <SectionTitle title={section.title} description={section.description} accent={section.accent} />
          <View style={styles.grid}>
            {section.items.map((item, index) => (
              <View key={item.id} style={slot}>
                <ItemCard item={item} index={index} flush />
              </View>
            ))}
          </View>
        </View>
      ))}
      {visible.length === 0 ? (
        <Text style={styles.empty}>Ничего не найдено. Смени фильтр или запрос.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  searchTablet: { paddingVertical: 16, fontSize: 17, borderRadius: 16 },
  filterWrap: { height: 42, marginBottom: 4 },
  filters: { gap: 8, paddingBottom: 6, alignItems: 'center' },
  filter: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 34,
    justifyContent: 'center',
  },
  filterTablet: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 44 },
  filterOn: { backgroundColor: colors.cardElevated, borderColor: colors.violet },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  filterTextOn: { color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 28 },
});
