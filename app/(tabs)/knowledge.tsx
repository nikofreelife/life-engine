import { ScrollView, StyleSheet, Text } from 'react-native';

import { CatalogView } from '@/components/CatalogView';
import { KNOWLEDGE } from '@/src/data/knowledge';
import { useEngineLayout } from '@/src/layout';
import { colors } from '@/src/theme';

export default function KnowledgeScreen() {
  const { pad, titleSize, isTablet } = useEngineLayout();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingHorizontal: pad, paddingBottom: isTablet ? 56 : 40 }]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>БАЗА ЗНАНИЙ</Text>
      <Text style={[styles.title, { fontSize: titleSize }]}>Фундамент, не чеклист</Text>
      <Text style={[styles.lead, isTablet && styles.leadTablet]}>
        Энциклопедия принципов. Без галочек, статусов и прогресса — только карты, которые держат жизнь.
      </Text>
      <CatalogView
        sections={KNOWLEDGE}
        searchHint="Найти принцип, термин, практику..."
        tab="knowledge"
        library
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40, width: '100%', maxWidth: 1280, alignSelf: 'center' },
  eyebrow: { color: colors.blue, letterSpacing: 3, fontWeight: '800', fontSize: 11 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 6 },
  lead: { color: colors.muted, marginTop: 8, marginBottom: 16, lineHeight: 20, maxWidth: 720 },
  leadTablet: { fontSize: 17, lineHeight: 26, marginBottom: 22 },
});
