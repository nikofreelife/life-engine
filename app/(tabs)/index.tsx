import { CatalogView } from '@/components/CatalogView';
import { ScreenHeader, ScreenScroll } from '@/components/Screen';
import { BOOKS } from '@/src/data/catalog';
import { colors } from '@/src/theme';

export default function BooksScreen() {
  return (
    <ScreenScroll>
      <ScreenHeader
        kicker="Библиотека"
        title="Книги как система"
        lead="Читай по слоям: сначала психология и влияние, затем трансерфинг, затем стратегия. Глубокий канон — на будущее."
        accent={colors.violet}
      />
      <CatalogView sections={BOOKS} searchHint="Найти книгу, автора, тег..." tab="books" />
    </ScreenScroll>
  );
}
