import { ScreenTimeBoard } from '@/components/ScreenTimeBoard';
import { ScreenHeader, ScreenScroll } from '@/components/Screen';
import { colors } from '@/src/theme';

export default function ScreenTimeScreen() {
  return (
    <ScreenScroll>
      <ScreenHeader
        kicker="Экранное время"
        title="Экранное время"
        lead="FamilyActivityPicker, DeviceActivity и щит ManagedSettings. Приложения с айфона, не текстовый список."
        accent={colors.violet}
      />
      <ScreenTimeBoard />
    </ScreenScroll>
  );
}
