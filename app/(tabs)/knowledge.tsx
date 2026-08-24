import { ScrollView, StyleSheet, Text } from 'react-native';

import { KnowledgeBoard } from '@/components/KnowledgeBoard';
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
      <Text style={[styles.title, { fontSize: titleSize }]}>Факторы. Раскрой и читай</Text>
      <Text style={[styles.lead, isTablet && styles.leadTablet]}>
        Восемь автономных разделов. Без галочек и статусов. Нажми тему — откроется, что даёт, как делать и когда начинать.
      </Text>
      <KnowledgeBoard />
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
