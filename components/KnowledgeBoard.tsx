import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useAuth } from '../src/auth';
import { ageGate } from '../src/age';
import { KNOWLEDGE_FACTORS, KNOWLEDGE_GROUPS } from '../src/data/knowledge';
import { useEngineLayout } from '../src/layout';
import { accentGlow, colors, radius, type, type Accent } from '../src/theme';
import type { KnowledgeFactor } from '../src/types';
import { PressScale } from './PressScale';
import { hapticLight } from '../src/haptics';
import { AgeBadges, AgeDisclaimer } from './AgeRecommend';

function RichText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <Text style={styles.blockText}>
      {lines.map((line, lineIndex) => (
        <Text key={lineIndex}>
          {lineIndex > 0 ? '\n' : null}
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => {
            const bold = /^\*\*([^*]+)\*\*$/.exec(part);
            if (bold) {
              return (
                <Text key={partIndex} style={styles.blockBold}>
                  {bold[1]}
                </Text>
              );
            }
            return part;
          })}
        </Text>
      ))}
    </Text>
  );
}

function FactorAccordion({
  factor,
  age,
  opened,
  onToggle,
}: {
  factor: KnowledgeFactor;
  age: number;
  opened: boolean;
  onToggle: () => void;
}) {
  const gate = ageGate(factor, age);
  const rotation = useSharedValue(opened ? 180 : 0);

  useEffect(() => {
    rotation.value = withTiming(opened ? 180 : 0, {
      duration: 180,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [opened, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggle = () => {
    void hapticLight();
    onToggle();
  };

  return (
    <View style={[styles.factor, { borderColor: colors[factor.accent] + '55' }]}>
      <PressScale haptic="none" onPress={toggle} style={styles.factorHead} accessibilityRole="button">
        <View style={[styles.factorMark, { backgroundColor: accentGlow[factor.accent as Accent] }]}>
          <Text style={styles.factorEmoji}>{factor.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.factorTitle}>{factor.title}</Text>
          <Text style={styles.factorDesc}>{factor.description}</Text>
          <AgeBadges gate={gate} tone={factor.group === 'social' ? 'mind' : 'body'} />
        </View>
        <Animated.Text style={[styles.chevron, chevronStyle]}>⌄</Animated.Text>
      </PressScale>
      {opened ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={styles.factorBody}>
          <AgeDisclaimer minAge={gate.minAge} tone={factor.group === 'social' ? 'mind' : 'body'} />
          {factor.sections.map((section, index) => (
            <View key={`${factor.id}-${index}`} style={styles.block}>
              {section.heading ? <Text style={styles.blockKicker}>{section.heading}</Text> : null}
              <RichText text={section.body} />
            </View>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

export function KnowledgeBoard() {
  const { user } = useAuth();
  const age = user?.age ?? 0;
  const { isTablet } = useEngineLayout();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const factors = KNOWLEDGE_FACTORS.filter((factor) => {
    if (!q) return true;
    const group = factor.group ? KNOWLEDGE_GROUPS[factor.group] : undefined;
    const hay = [
      factor.title,
      factor.description,
      factor.badge ?? '',
      group?.title ?? '',
      group?.lead ?? '',
      ...factor.sections.map((section) => `${section.heading ?? ''} ${section.body}`),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Найти кодекс, НЛП, практику, протокол..."
        placeholderTextColor={colors.faint}
        style={[styles.search, isTablet && styles.searchTablet]}
      />
      {factors.map((factor, index) => {
        const prev = factors[index - 1];
        const group = factor.group ? KNOWLEDGE_GROUPS[factor.group] : undefined;
        const showGroup = Boolean(group && factor.group !== prev?.group);
        return (
          <View key={factor.id}>
            {showGroup && group ? (
              <View style={styles.groupHead}>
                <Text style={styles.groupEyebrow}>
                  {factor.group === 'warrior'
                    ? 'ФУНДАМЕНТ'
                    : factor.group === 'social'
                      ? 'СОЦИУМ'
                      : 'ИССЛЕДОВАНИЕ'}
                </Text>
                <Text style={styles.groupTitle}>
                  {group.emoji}  {group.title}
                </Text>
                <Text style={styles.groupLead}>{group.lead}</Text>
              </View>
            ) : null}
            <FactorAccordion
              factor={factor}
              age={age}
              opened={openId === factor.id}
              onToggle={() => setOpenId(openId === factor.id ? null : factor.id)}
            />
          </View>
        );
      })}
      {factors.length === 0 ? <Text style={styles.empty}>Ничего не найдено.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    marginBottom: 16,
  },
  searchTablet: { paddingVertical: 18, fontSize: 17, borderRadius: 18 },
  groupHead: { marginTop: 8, marginBottom: 14, gap: 6 },
  groupEyebrow: {
    color: colors.amber,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  groupTitle: { ...type.title },
  groupLead: { ...type.footnote, lineHeight: 21, maxWidth: 720 },
  factor: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderRadius: radius.lg,
    marginBottom: 14,
    overflow: 'hidden',
  },
  factorHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
  },
  factorMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factorEmoji: { fontSize: 24 },
  factorTitle: { ...type.headline },
  factorDesc: { ...type.footnote, marginTop: 4 },
  chevron: { color: colors.faint, fontSize: 18, fontWeight: '700', paddingLeft: 4, marginTop: 2 },
  factorBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  block: { gap: 6 },
  blockKicker: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  blockText: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  blockBold: { color: colors.text, fontWeight: '800' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 24 },
});
