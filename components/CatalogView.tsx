import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AddSectionCard, ItemCard, SectionTitle } from './ItemCard';
import { useAuth } from '../src/auth';
import { splitByAge } from '../src/age';
import { STATUS_LABEL } from '../src/lib';
import { useEngineLayout } from '../src/layout';
import { useEngine } from '../src/store';
import { colors, type Accent } from '../src/theme';
import type { CatalogSection, Status, TabKey } from '../src/types';

const FILTERS: Array<'all' | Status> = ['all', 'planned', 'progress', 'done'];
const ACCENTS: Accent[] = ['violet', 'amber', 'emerald', 'blue', 'crimson'];

export function CatalogView({
  sections,
  searchHint,
  tab,
  library,
}: {
  sections: CatalogSection[];
  searchHint: string;
  tab: TabKey;
  library?: boolean;
}) {
  const { itemOf, sectionsFor, addCustomSection, removeCustomSection, addSectionItem, removeSectionItem } = useEngine();
  const { user } = useAuth();
  const age = user?.age ?? 0;
  const { isTablet, cardWidth, gap } = useEngineLayout();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [composer, setComposer] = useState<'section' | CatalogSection | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSub, setDraftSub] = useState('');
  const [accent, setAccent] = useState<Accent>(
    tab === 'books' ? 'violet' : tab === 'learn' ? 'amber' : tab === 'knowledge' ? 'blue' : 'emerald',
  );

  const merged = sectionsFor(tab, sections);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return merged
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const state = itemOf(item.id);
          if (section.mode === 'guide' && filter !== 'all') return false;
          if (section.mode !== 'guide' && filter !== 'all' && state.status !== filter) return false;
          if (!q) return true;
          return [item.title, item.subtitle, item.helper, item.body, ...item.tags, ...state.extraTags, state.notes]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q);
        }),
      }))
      .filter((section) => section.items.length > 0 || section.custom);
  }, [filter, itemOf, merged, query]);

  const closeComposer = () => {
    setComposer(null);
    setDraftTitle('');
    setDraftSub('');
  };

  const submitComposer = () => {
    if (composer === 'section') {
      addCustomSection(tab, draftTitle, draftSub, accent);
    } else if (composer) {
      addSectionItem(composer, draftTitle, draftSub);
    }
    closeComposer();
  };

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={searchHint}
        placeholderTextColor={colors.faint}
        style={[styles.search, isTablet && styles.searchTablet]}
      />
      {library ? null : (
      <View style={[styles.filterWrap, isTablet && { height: 52 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((key) => {
            const active = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={[styles.filter, isTablet && styles.filterTablet, active && styles.filterOn]}>
                <Text style={[styles.filterText, isTablet && { fontSize: 14 }, active && styles.filterTextOn]}>
                  {key === 'all' ? 'Все' : STATUS_LABEL[key]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      )}
      {visible.map((section) => {
        const split = splitByAge(section.items, age, section.minAge);
        const groups: Array<{ label?: string; items: typeof section.items }> = [
          { label: 'Высший приоритет на данный момент', items: split.priority },
          { items: split.current },
          { label: 'На будущее', items: split.future },
        ];
        return (
          <View key={section.id}>
            <SectionTitle
              title={section.title}
              description={section.description}
              accent={section.accent}
              onAddItem={() => setComposer(section)}
              onRemoveSection={
                section.custom
                  ? () =>
                      Alert.alert('Удалить раздел?', section.title, [
                        { text: 'Отмена', style: 'cancel' },
                        { text: 'Удалить', style: 'destructive', onPress: () => removeCustomSection(section.id) },
                      ])
                  : undefined
              }
            />
            {groups.map((group, groupIndex) =>
              group.items.length ? (
                <View key={`${section.id}-${group.label ?? 'now'}-${groupIndex}`}>
                  {group.label ? (
                    <Text style={[styles.ageLabel, group.label === 'На будущее' && styles.ageLabelFuture]}>
                      {group.label}
                    </Text>
                  ) : null}
                  <View style={[styles.grid, { gap }]}>
                    {group.items.map((item, index) => (
                      <View key={item.id} style={{ width: cardWidth }}>
                        <ItemCard
                          item={item}
                          index={index}
                          guide={library || section.mode === 'guide'}
                          sectionMinAge={section.minAge}
                          onRemove={item.custom ? () => removeSectionItem(section.id, item.id) : undefined}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              ) : null,
            )}
          </View>
        );
      })}
      <AddSectionCard onPress={() => setComposer('section')} />
      {visible.length === 0 ? (
        <Text style={styles.empty}>Ничего не найдено. Смени фильтр или запрос.</Text>
      ) : null}

      <Modal visible={composer !== null} animationType="fade" transparent onRequestClose={closeComposer}>
        <View style={styles.modalBack}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{composer === 'section' ? 'Новый раздел' : 'Новый пункт'}</Text>
            <TextInput
              value={draftTitle}
              onChangeText={setDraftTitle}
              placeholder={composer === 'section' ? 'Название раздела' : 'Название'}
              placeholderTextColor={colors.faint}
              style={styles.modalInput}
              autoFocus
            />
            <TextInput
              value={draftSub}
              onChangeText={setDraftSub}
              placeholder={composer === 'section' ? 'Короткое описание' : 'Подзаголовок (необязательно)'}
              placeholderTextColor={colors.faint}
              style={styles.modalInput}
            />
            {composer === 'section' ? (
              <View style={styles.accentRow}>
                {ACCENTS.map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => setAccent(key)}
                    style={[styles.accent, { backgroundColor: colors[key] }, accent === key && styles.accentOn]}
                  />
                ))}
              </View>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable onPress={closeComposer} style={styles.modalGhost}>
                <Text style={styles.modalGhostText}>Отмена</Text>
              </Pressable>
              <Pressable onPress={submitComposer} style={styles.modalOk}>
                <Text style={styles.modalOkText}>Создать</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 14,
  },
  searchTablet: { paddingVertical: 18, fontSize: 17, borderRadius: 18 },
  filterWrap: { height: 46, marginBottom: 8 },
  filters: { gap: 10, paddingBottom: 8, alignItems: 'center' },
  filter: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterTablet: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 44 },
  filterOn: { backgroundColor: colors.cardElevated, borderColor: colors.violet },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  filterTextOn: { color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  ageLabel: {
    color: colors.amber,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  ageLabelFuture: { color: colors.crimson },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 28 },
  modalBack: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  modalInput: {
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  accentRow: { flexDirection: 'row', gap: 10, marginVertical: 4 },
  accent: { width: 28, height: 28, borderRadius: 14, opacity: 0.45 },
  accentOn: { opacity: 1, transform: [{ scale: 1.08 }] },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalGhost: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalGhostText: { color: colors.muted, fontWeight: '700' },
  modalOk: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOkText: { color: colors.bg, fontWeight: '800' },
});
