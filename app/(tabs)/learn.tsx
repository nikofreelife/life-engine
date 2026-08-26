import { CatalogView } from '@/components/CatalogView';
import { ScreenHeader, ScreenScroll } from '@/components/Screen';
import { LEARNING } from '@/src/data/catalog';
import { colors } from '@/src/theme';

export default function LearnScreen() {
  return (
    <ScreenScroll>
      <ScreenHeader
        kicker="Практика"
        title="Обучение и практики"
        lead="Курсы по возрасту и системы самопознания. Статусы, теги и инсайты — к каждому пункту."
        accent={colors.amber}
      />
      <CatalogView sections={LEARNING} searchHint="Найти курс или практику..." tab="learn" />
    </ScreenScroll>
  );
}
