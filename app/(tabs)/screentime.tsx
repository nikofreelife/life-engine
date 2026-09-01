import { ScreenTimeBoard } from '@/components/ScreenTimeBoard';
import { ScreenHeader, ScreenScroll } from '@/components/Screen';
import { colors } from '@/src/theme';

export default function ScreenTimeScreen() {
  return (
    <ScreenScroll>
      <ScreenHeader
        kicker="Экранное время"
        title="Системный блокировщик"
        lead="Нативный FamilyActivityPicker, DeviceActivity и щит ManagedSettings. Без ручных сессий и текстовых пресетов."
        accent={colors.violet}
      />
      <ScreenTimeBoard />
    </ScreenScroll>
  );
}
