import { DailyQuote } from '@/components/DailyQuote';
import { HabitBoard } from '@/components/HabitBoard';
import { ScreenHeader, ScreenScroll } from '@/components/Screen';
import { WimHofBreath } from '@/components/WimHofBreath';
import { colors } from '@/src/theme';

export default function HealthScreen() {
  return (
    <ScreenScroll>
      <ScreenHeader
        kicker="Тело и режим"
        title="Практические трекеры"
        lead="Только инструменты дня: цитата, привычки и дыхание. Экранное время — отдельная вкладка. Теория живёт в «Знания»."
        accent={colors.emerald}
      />
      <DailyQuote />
      <HabitBoard />
      <WimHofBreath />
    </ScreenScroll>
  );
}
