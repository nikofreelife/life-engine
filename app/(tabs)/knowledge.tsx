import { KnowledgeBoard } from '@/components/KnowledgeBoard';
import { ScreenHeader, ScreenScroll } from '@/components/Screen';
import { colors } from '@/src/theme';

export default function KnowledgeScreen() {
  return (
    <ScreenScroll>
      <ScreenHeader
        kicker="База знаний"
        title="База знаний"
        lead="Кодекс воина, социальная динамика, контуры тела. Только аккордеоны — без галочек и статусов."
        accent={colors.blue}
      />
      <KnowledgeBoard />
    </ScreenScroll>
  );
}
