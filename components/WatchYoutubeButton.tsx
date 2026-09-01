import { StyleSheet, Text } from 'react-native';

import { PressScale } from './PressScale';
import { openYoutubeWatch } from '../src/player';
import { colors } from '../src/theme';

export function WatchYoutubeButton({ id }: { id: string }) {
  return (
    <PressScale haptic="light" onPress={() => void openYoutubeWatch(id)} style={styles.btn}>
      <Text style={styles.text}>Смотреть в YouTube ↗</Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.crimson,
    borderRadius: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginBottom: 10,
    marginTop: 8,
  },
  text: { color: colors.white, fontWeight: '800', fontSize: 14 },
});
