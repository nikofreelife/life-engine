import type { ComponentType } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  selectionData?: string | null;
  style?: StyleProp<ViewStyle>;
};

export function UsageReport({ selectionData, style }: Props) {
  if (Platform.OS !== 'ios') return <View style={[styles.web, style]} />;
  try {
    const { requireNativeViewManager } = require('expo-modules-core') as {
      requireNativeViewManager: (name: string) => ComponentType<{
        selectionData?: string;
        style?: StyleProp<ViewStyle>;
      }>;
    };
    const Native = requireNativeViewManager('LifeEngineScreenTime');
    return <Native selectionData={selectionData ?? ''} style={[styles.native, style]} />;
  } catch {
    return <View style={[styles.web, style]} />;
  }
}

const styles = StyleSheet.create({
  native: { height: 112, borderRadius: 16, overflow: 'hidden' },
  web: { height: 0 },
});
