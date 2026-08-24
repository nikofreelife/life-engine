import { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import Animated, { FadeIn, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useAuth } from '../src/auth';
import { ageGate, lockLabel, splitByAge } from '../src/age';
import { KNOWLEDGE_FACTORS } from '../src/data/knowledge';
import { useEngineLayout } from '../src/layout';
import { accentGlow, colors, type Accent } from '../src/theme';
import type { KnowledgeTopic } from '../src/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function animate() {
  LayoutAnimation.configureNext({
    duration: 220,
    create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  });
}

function TopicAccordion({
  topic,
  age,
  sectionMinAge,
}: {
  topic: KnowledgeTopic;
  age: number;
  sectionMinAge?: number;
}) {
  const [open, setOpen] = useState(false);
  const rotation = useSharedValue(0);
  const gate = ageGate(topic, age, sectionMinAge);
  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggle = () => {
    animate();
    const next = !open;
    setOpen(next);
    rotation.value = withTiming(next ? 180 : 0, { duration: 180 });
  };

  return (
    <View style={[styles.topic, gate.locked && styles.topicLocked]}>
      <Pressable onPress={toggle} style={styles.topicHead}>
        <Text style={styles.topicIcon}>{topic.icon}</Text>
        <View style={styles.topicTitles}>
          <Text style={styles.topicTitle}>{topic.title}</Text>
          <View style={styles.badgeRow}>
            {gate.priority ? (
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>Высший приоритет на данный момент</Text>
              </View>
            ) : null}
            {gate.locked && gate.minAge != null ? (
              <View style={styles.lockBadge}>
                <Text style={styles.lockText}>{lockLabel(gate.minAge)}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Animated.Text style={[styles.chevron, chevron]}>⌄</Animated.Text>
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(160)} style={styles.topicBody}>
          <Text style={styles.blockKicker}>ЧТО ЭТО ДАЕТ</Text>
          <Text style={styles.blockText}>{topic.gives}</Text>
          <Text style={styles.blockKicker}>КАК ПРАВИЛЬНО ДЕЛАТЬ</Text>
          <Text style={styles.blockText}>{topic.how}</Text>
          <Text style={styles.blockKicker}>КОГДА НАЧИНАТЬ</Text>
          <Text style={styles.blockText}>{topic.when}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function TopicGroup({
  label,
  topics,
  age,
  sectionMinAge,
}: {
  label?: string;
  topics: KnowledgeTopic[];
  age: number;
  sectionMinAge?: number;
}) {
  if (!topics.length) return null;
  return (
    <View style={styles.group}>
      {label ? (
        <Text style={[styles.groupLabel, label === 'На будущее' && styles.groupLabelFuture]}>{label}</Text>
      ) : null}
      {topics.map((topic) => (
        <TopicAccordion key={topic.id} topic={topic} age={age} sectionMinAge={sectionMinAge} />
      ))}
    </View>
  );
}

export function KnowledgeBoard() {
  const { user } = useAuth();
  const age = user?.age ?? 0;
  const { isTablet } = useEngineLayout();
  const [query, setQuery] = useState('');
  const [openFactor, setOpenFactor] = useState<string | null>(KNOWLEDGE_FACTORS[0]?.id ?? null);

  const q = query.trim().toLowerCase();
  const factors = KNOWLEDGE_FACTORS.map((factor) => ({
    ...factor,
    topics: factor.topics.filter((topic) => {
      if (!q) return true;
      return [topic.title, topic.gives, topic.how, topic.when].join(' ').toLowerCase().includes(q);
    }),
  })).filter((factor) => factor.topics.length > 0 || !q);

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Найти практику, протокол, правило..."
        placeholderTextColor={colors.faint}
        style={[styles.search, isTablet && styles.searchTablet]}
      />
      {factors.map((factor) => {
        const opened = openFactor === factor.id;
        const split = splitByAge(factor.topics, age, factor.minAge);
        return (
          <Animated.View
            key={factor.id}
            layout={LinearTransition.duration(180)}
            style={[styles.factor, { borderColor: colors[factor.accent] + '55' }]}>
            <Pressable
              onPress={() => {
                animate();
                setOpenFactor(opened ? null : factor.id);
              }}
              style={styles.factorHead}>
              <View style={[styles.factorMark, { backgroundColor: accentGlow[factor.accent as Accent] }]}>
                <Text style={styles.factorEmoji}>{factor.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.factorTitle}>{factor.title}</Text>
                <Text style={styles.factorDesc}>{factor.description}</Text>
              </View>
              <Text style={styles.factorChevron}>{opened ? '⌃' : '⌄'}</Text>
            </Pressable>
            {opened ? (
              <View style={styles.factorBody}>
                <TopicGroup label="Высший приоритет на данный момент" topics={split.priority} age={age} sectionMinAge={factor.minAge} />
                <TopicGroup topics={split.current} age={age} sectionMinAge={factor.minAge} />
                <TopicGroup label="На будущее" topics={split.future} age={age} sectionMinAge={factor.minAge} />
              </View>
            ) : null}
          </Animated.View>
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
    borderRadius: 16,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  searchTablet: { paddingVertical: 18, fontSize: 17, borderRadius: 18 },
  factor: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderRadius: 22,
    marginBottom: 14,
    overflow: 'hidden',
  },
  factorHead: {
    flexDirection: 'row',
    alignItems: 'center',
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
  factorTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  factorDesc: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4 },
  factorChevron: { color: colors.faint, fontSize: 18, fontWeight: '700', paddingLeft: 4 },
  factorBody: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  group: { gap: 8 },
  groupLabel: {
    color: colors.amber,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  groupLabelFuture: { color: colors.crimson },
  topic: {
    backgroundColor: colors.cardElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  topicLocked: { opacity: 0.78 },
  topicHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 52,
  },
  topicIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  topicTitles: { flex: 1, gap: 4 },
  topicTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  chevron: { color: colors.muted, fontSize: 18, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  priorityBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: colors.amber,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priorityText: { color: colors.amber, fontSize: 10, fontWeight: '800' },
  lockBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: colors.crimson,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lockText: { color: colors.crimson, fontSize: 10, fontWeight: '800' },
  topicBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 6 },
  blockKicker: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  blockText: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 24 },
});
