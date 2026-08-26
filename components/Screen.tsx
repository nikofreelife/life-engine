import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, type ScrollViewProps } from 'react-native';

import { useEngineLayout } from '../src/layout';
import { colors, type } from '../src/theme';

type Props = ScrollViewProps & {
  children: ReactNode;
};

export function ScreenScroll({ children, contentContainerStyle, ...rest }: Props) {
  const { pad, tabPad } = useEngineLayout();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
      {...rest}
      style={[styles.screen, rest.style]}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: pad, paddingBottom: tabPad },
        contentContainerStyle,
      ]}>
      {children}
    </ScrollView>
  );
}

export function ScreenHeader({
  kicker,
  title,
  lead,
  accent = colors.emerald,
}: {
  kicker: string;
  title: string;
  lead: string;
  accent?: string;
}) {
  return (
    <>
      <Text style={[styles.kicker, { color: accent }]}>{kicker}</Text>
      <Text style={type.largeTitle}>{title}</Text>
      <Text style={styles.lead}>{lead}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minWidth: 0, backgroundColor: colors.bg },
  content: { width: '100%', flexGrow: 1, minWidth: 0 },
  kicker: {
    ...type.footnote,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  lead: {
    ...type.footnote,
    marginTop: 8,
    marginBottom: 18,
    maxWidth: 720,
    lineHeight: 20,
  },
});
