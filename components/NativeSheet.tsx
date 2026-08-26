import { type ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hapticLight } from '../src/haptics';
import { colors, radius, spring } from '../src/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  height?: 'full' | 'auto';
};

export function NativeSheet({ visible, onClose, children, height = 'full' }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);

  const close = () => {
    void hapticLight();
    translateY.value = 0;
    onClose();
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationY > 110 || event.velocityY > 900) {
        runOnJS(close)();
        return;
      }
      translateY.value = withSpring(0, spring);
    });

  const sheetAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (Platform.OS === 'ios') {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[styles.iosRoot, { paddingBottom: insets.bottom }]}>
          <View style={styles.handle} />
          {children}
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.webRoot}>
        <Pressable style={styles.backdrop} onPress={close} />
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.sheet,
              height === 'full' ? styles.sheetFull : styles.sheetAuto,
              { paddingBottom: Math.max(insets.bottom, 16) },
              sheetAnim,
            ]}>
            <View style={styles.handle} />
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  iosRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  webRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.backdrop,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sheetFull: {
    height: '92%',
  },
  sheetAuto: {
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(148, 163, 184, 0.45)',
    marginTop: 8,
    marginBottom: 6,
  },
});
