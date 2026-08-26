import { type ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { colors } from '../src/theme';

export function SwipeDeleteRow({
  children,
  fill,
  onDeletePress,
}: {
  children: ReactNode;
  fill?: boolean;
  onDeletePress: () => void;
}) {
  const revealDelete = (_progress: unknown, _translation: unknown, methods: SwipeableMethods) => (
    <RectButton
      accessibilityRole="button"
      accessibilityLabel="Удалить счетчик"
      onPress={() => {
        methods.close();
        onDeletePress();
      }}
      style={styles.action}>
      <Text style={styles.actionTitle}>Удалить / Delete</Text>
    </RectButton>
  );

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(220)}
      layout={LinearTransition.springify().damping(16)}
      style={[styles.wrap, fill && styles.fill]}>
      <Swipeable
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        enableTrackpadTwoFingerGesture
        containerStyle={styles.swipe}
        childrenContainerStyle={fill ? styles.fill : undefined}
        renderRightActions={revealDelete}>
        {children}
      </Swipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: 22,
  },
  fill: { flexGrow: 1, flex: 1, minWidth: 280 },
  swipe: {
    overflow: 'hidden',
    borderRadius: 22,
  },
  action: {
    width: 124,
    flex: 1,
    backgroundColor: colors.crimson,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  actionTitle: { color: colors.white, fontWeight: '800', fontSize: 13, textAlign: 'center' },
});
