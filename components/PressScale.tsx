import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptic, type HapticKind } from '../src/haptics';
import { spring } from '../src/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: HapticKind;
  scaleTo?: number;
};

export function PressScale({
  children,
  style,
  haptic: kind = 'light',
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, anim]}
      onPressIn={(event) => {
        scale.value = withSpring(scaleTo, spring);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, spring);
        onPressOut?.(event);
      }}
      onPress={(event) => {
        void haptic(kind);
        onPress?.(event);
      }}>
      {children}
    </AnimatedPressable>
  );
}
