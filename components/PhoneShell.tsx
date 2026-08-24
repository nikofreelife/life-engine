import { type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useEngineLayout } from '../src/layout';
import { colors } from '../src/theme';

export function PhoneShell({ children }: { children: ReactNode }) {
  const { isTablet, maxContent } = useEngineLayout();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.stage, isTablet && { maxWidth: maxContent + 80 }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          {children}
        </SafeAreaView>
      </View>
    </View>
  );
}

export function ContentWidth({ children }: { children: ReactNode }) {
  const { pad, maxContent, isTablet } = useEngineLayout();
  return (
    <View
      style={{
        width: '100%',
        maxWidth: isTablet ? maxContent : undefined,
        alignSelf: 'center',
        paddingHorizontal: pad,
      }}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  stage: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.bg,
  },
  safe: { flex: 1, backgroundColor: colors.bg },
});
