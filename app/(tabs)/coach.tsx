import { StyleSheet, View } from 'react-native';

import { CoachChat } from '@/components/CoachChat';
import { useEngineLayout } from '@/src/layout';
import { colors } from '@/src/theme';

export default function CoachScreen() {
  const { pad } = useEngineLayout();
  return (
    <View style={[styles.screen, { paddingHorizontal: pad }]}>
      <CoachChat />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, width: '100%', minWidth: 0 },
});
