import { ScreenHeader, ScreenScroll } from '@/components/Screen';
import { VideoBoard } from '@/components/VideoBoard';
import { colors } from '@/src/theme';

export default function VideoScreen() {
  return (
    <ScreenScroll nestedScrollEnabled directionalLockEnabled scrollEventThrottle={16}>
      <ScreenHeader
        kicker="Видео и ресурсы"
        title="Смотри. Разбирай. Применяй"
        lead="Философия внутри приложения: превью, встроенный плеер, статус просмотра и разбор ИИ. Наружу на YouTube не вылетаешь."
        accent={colors.violet}
      />
      <VideoBoard />
    </ScreenScroll>
  );
}
