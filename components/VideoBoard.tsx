import { useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { PressScale } from './PressScale';
import { AnalysisModal } from './AnalysisModal';
import { VideoPlayerModal } from './VideoPlayerModal';
import { FREEMAN_EPISODES, FREEMAN_GROUPS, episodeThumb, type FreemanEpisode } from '../src/data/freeman';
import { RESOURCE_LINKS } from '../src/data/resources';
import { useEngine } from '../src/store';
import { colors } from '../src/theme';
import type { VideoWatchStatus } from '../src/types';

function EpisodeCard({
  episode,
  onAnalyze,
  onPlay,
}: {
  episode: FreemanEpisode;
  onAnalyze: () => void;
  onPlay: () => void;
}) {
  const { state, setVideoWatch } = useEngine();
  const [thumbFail, setThumbFail] = useState(false);
  const saved = state.videoInsights?.[episode.id];
  const status: VideoWatchStatus = state.videoWatch?.[episode.id] ?? 'planned';
  const watched = status === 'watched';
  const thumb = episodeThumb(episode);

  return (
    <View style={[styles.ep, watched && styles.epWatched]}>
      <PressScale
        haptic="medium"
        onPress={onPlay}
        style={[styles.cover, styles.scrollFriendly]}>
        {thumb && !thumbFail ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Image
              source={{ uri: thumb }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => setThumbFail(true)}
            />
          </View>
        ) : (
          <View style={styles.coverFallback} pointerEvents="none" />
        )}
        <View style={styles.coverShade} pointerEvents="none" />
        <View style={styles.play} pointerEvents="none">
          <Text style={styles.playIcon}>▶</Text>
        </View>
        {watched ? (
          <View style={styles.seenBadge}>
            <Text style={styles.seenBadgeText}>Просмотрено</Text>
          </View>
        ) : null}
      </PressScale>
      <Text style={styles.epPart}>Ep. {episode.part}</Text>
      <Text style={styles.epTitle}>{episode.title}</Text>
      <Text style={styles.epDate}>
        {episode.date}
        {saved ? ` · разбор ${saved.source === 'ai' ? 'ИИ' : 'базовый'}` : ''}
      </Text>
      <View style={styles.statusRow}>
        <Pressable
          onPress={() => setVideoWatch(episode.id, 'watched')}
          style={[styles.status, watched && styles.statusOn]}>
          <Text style={[styles.statusText, watched && styles.statusTextOn]}>✓ Просмотрено</Text>
        </Pressable>
        <Pressable
          onPress={() => setVideoWatch(episode.id, 'planned')}
          style={[styles.status, !watched && styles.statusPlanOn]}>
          <Text style={[styles.statusText, !watched && styles.statusPlanText]}>○ В планах</Text>
        </Pressable>
      </View>
      <Pressable onPress={onAnalyze} style={styles.analyze}>
        <Text style={styles.analyzeText}>Разбор серии с ИИ</Text>
      </Pressable>
    </View>
  );
}

export function VideoBoard() {
  const { state, setVideoWatch } = useEngine();
  const [open, setOpen] = useState<string | null>('philosophy');
  const [analyze, setAnalyze] = useState<FreemanEpisode | null>(null);
  const [playing, setPlaying] = useState<FreemanEpisode | null>(null);
  const [resource, setResource] = useState<string | null>(null);

  const total = FREEMAN_EPISODES.length;
  const watched = FREEMAN_EPISODES.filter((item) => state.videoWatch?.[item.id] === 'watched').length;
  const ratio = total ? watched / total : 0;

  return (
    <View>
      <View style={styles.factor}>
        <PressScale
          haptic="light"
          onPress={() => setOpen((v) => (v === 'philosophy' ? null : 'philosophy'))}
          style={styles.factorHead}>
          <Text style={styles.emoji}>🎬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.factorTitle}>Философия · Mr. Freeman</Text>
            <Text style={styles.factorDesc}>Плеер внутри приложения. Превью, статус просмотра и разбор ИИ.</Text>
          </View>
          <Text style={styles.chevron}>{open === 'philosophy' ? '⌃' : '⌄'}</Text>
        </PressScale>
        {open === 'philosophy' ? (
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={styles.factorBody}>
            <View style={styles.progressBox}>
              <Text style={styles.progressLabel}>
                Просмотрено {watched} / {total} серий (канон 00–64+)
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(ratio * 100)}%` }]} />
              </View>
            </View>
            {FREEMAN_GROUPS.map((group) => {
              const items = FREEMAN_EPISODES.filter((item) => item.group === group.id).sort((a, b) =>
                a.part.localeCompare(b.part, 'en', { numeric: true }),
              );
              return (
                <View key={group.id} style={{ gap: 10 }}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  <Text style={styles.groupLead}>{group.lead}</Text>
                  {items.map((item) => (
                    <EpisodeCard
                      key={item.id}
                      episode={item}
                      onAnalyze={() => setAnalyze(item)}
                      onPlay={() => {
                        setVideoWatch(item.id, 'watched');
                        setPlaying(item);
                      }}
                    />
                  ))}
                </View>
              );
            })}
          </Animated.View>
        ) : null}
      </View>

      <Text style={styles.resKicker}>ПОЛЕЗНЫЕ РЕСУРСЫ</Text>
      {RESOURCE_LINKS.map((item) => (
        <Pressable key={item.id} onPress={() => setResource(item.url)} style={[styles.linkCard, styles.scrollFriendly]}>
          <Text style={styles.linkTitle}>{item.title}</Text>
          <Text style={styles.linkLead}>{item.lead} · внутри приложения</Text>
        </Pressable>
      ))}

      {analyze ? <AnalysisModal episode={analyze} onClose={() => setAnalyze(null)} /> : null}
      {playing ? <VideoPlayerModal episode={playing} onClose={() => setPlaying(null)} /> : null}
      {resource ? <VideoPlayerModal uri={resource} heading="Ресурс" onClose={() => setResource(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  factor: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 18,
  },
  factorHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  emoji: { fontSize: 26 },
  factorTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  factorDesc: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4 },
  chevron: { color: colors.faint, fontSize: 18, fontWeight: '700' },
  factorBody: { paddingHorizontal: 12, paddingBottom: 14, gap: 14 },
  progressBox: { gap: 8, paddingHorizontal: 4 },
  progressLabel: { color: colors.emerald, fontWeight: '800', fontSize: 13 },
  progressTrack: {
    height: 8,
    borderRadius: 99,
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.emerald },
  groupTitle: { color: colors.amber, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  groupLead: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: -4 },
  ep: {
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    overflow: 'hidden',
    paddingBottom: 12,
  },
  epWatched: { borderColor: 'rgba(16,185,129,0.45)' },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#07090E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollFriendly: (Platform.OS === 'web' ? { touchAction: 'pan-y' } : {}) as ViewStyle,
  coverFallback: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#10151F' },
  coverShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' },
  play: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(10,12,16,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: colors.white, fontSize: 22, marginLeft: 4 },
  seenBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.emerald,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seenBadgeText: { color: colors.bg, fontSize: 10, fontWeight: '800' },
  epPart: { color: colors.violet, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginTop: 10, paddingHorizontal: 12 },
  epTitle: { color: colors.text, fontSize: 15, fontWeight: '700', lineHeight: 20, marginTop: 2, paddingHorizontal: 12 },
  epDate: { color: colors.faint, fontSize: 12, marginTop: 4, paddingHorizontal: 12 },
  statusRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginTop: 10 },
  status: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  statusOn: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  statusPlanOn: { borderColor: colors.amber, backgroundColor: 'rgba(245,158,11,0.12)' },
  statusText: { color: colors.muted, fontWeight: '800', fontSize: 12 },
  statusTextOn: { color: colors.bg },
  statusPlanText: { color: colors.amber },
  analyze: {
    marginHorizontal: 12,
    marginTop: 8,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  resKicker: { color: colors.blue, fontWeight: '800', letterSpacing: 1.6, fontSize: 11, marginBottom: 10 },
  linkCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  linkTitle: { color: colors.text, fontWeight: '800' },
  linkLead: { color: colors.muted, marginTop: 4, fontSize: 13 },
});
