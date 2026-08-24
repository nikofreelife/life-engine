import { ScrollView, StyleSheet, Text } from 'react-native';

import { CatalogView } from '@/components/CatalogView';
import { LEARNING } from '@/src/data/catalog';
import { useEngineLayout } from '@/src/layout';
import { colors } from '@/src/theme';

export default function LearnScreen() {
  const { pad, titleSize, isTablet } = useEngineLayout();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingHorizontal: pad, paddingBottom: isTablet ? 56 : 40 }]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>ПРАКТИКА</Text>
      <Text style={[styles.title, { fontSize: titleSize }]}>Обучение и практики</Text>
      <Text style={[styles.lead, isTablet && styles.leadTablet]}>
        Курсы по возрасту и системы самопознания. Статусы, теги и инсайты — к каждому пункту.
      </Text>
      <CatalogView sections={LEARNING} searchHint="Найти курс или практику..." tab="learn" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40, width: '100%', maxWidth: 1280, alignSelf: 'center' },
  eyebrow: { color: colors.amber, letterSpacing: 3, fontWeight: '800', fontSize: 11 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 6 },
  lead: { color: colors.muted, marginTop: 8, marginBottom: 16, lineHeight: 20, maxWidth: 720 },
  leadTablet: { fontSize: 17, lineHeight: 26, marginBottom: 22 },
});
