import { ScrollView, StyleSheet, Text } from 'react-native';

import { CatalogView } from '@/components/CatalogView';
import { HabitBoard } from '@/components/HabitBoard';
import { QuoteBanner } from '@/components/QuoteBanner';
import { HEALTH } from '@/src/data/catalog';
import { useEngineLayout } from '@/src/layout';
import { colors } from '@/src/theme';

export default function HealthScreen() {
  const { pad, titleSize, isTablet } = useEngineLayout();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingHorizontal: pad, paddingBottom: isTablet ? 56 : 40 }]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>ТЕЛО И РЕЖИМ</Text>
      <Text style={[styles.title, { fontSize: titleSize }]}>Привычки и здоровье</Text>
      <Text style={[styles.lead, isTablet && styles.leadTablet]}>
        Ежедневный контур: привычки, питание, холод, баня, сон, круг людей. Дисциплина собирается здесь.
      </Text>
      <QuoteBanner />
      <HabitBoard />
      <CatalogView sections={HEALTH} searchHint="Найти протокол, еду, практику..." tab="health" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40, width: '100%', maxWidth: 1280, alignSelf: 'center' },
  eyebrow: { color: colors.emerald, letterSpacing: 3, fontWeight: '800', fontSize: 11 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 6 },
  lead: { color: colors.muted, marginTop: 8, marginBottom: 16, lineHeight: 20, maxWidth: 720 },
  leadTablet: { fontSize: 17, lineHeight: 26, marginBottom: 22 },
});
