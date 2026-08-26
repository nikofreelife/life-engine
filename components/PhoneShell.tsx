import { type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../src/theme';

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {children}
      </SafeAreaView>
    </View>
  );
}

export function ContentWidth({ children }: { children: ReactNode }) {
  return <View style={styles.content}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({ width: '100vw', height: '100vh' } as object)
      : { width: '100%', height: '100%' }),
  },
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    minWidth: 0,
    minHeight: 0,
  },
  content: {
    width: '100%',
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 24,
  },
});
