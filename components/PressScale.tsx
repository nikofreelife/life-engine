import { type ReactNode } from 'react';
import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptic, type HapticKind } from '../src/haptics';
import { pressScale, spring } from '../src/theme';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: HapticKind;
  scaleTo?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressScale({
  children,
  style,
  haptic: kind = 'light',
  scaleTo = pressScale,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (Platform.OS === 'web') {
    return (
      <Pressable
        {...rest}
        style={(state) => {
          const pressed = state.pressed ? scaleTo : 1;
          const motion = {
            transitionProperty: 'transform',
            transitionDuration: '0.18s',
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            transform: `scale(${pressed}) translateZ(0)`,
          } as unknown as ViewStyle;
          return [style, motion];
        }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={(event) => {
          void haptic(kind);
          onPress?.(event);
        }}>
        {children}
      </Pressable>
    );
  }

  return (
    <AnimatedPressable
      {...rest}
      style={[style, { backfaceVisibility: 'hidden' }, anim]}
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
