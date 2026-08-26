import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NativeSheet } from './NativeSheet';
import { VideoEmbed } from './VideoEmbed';
import { episodeSource, type FreemanEpisode } from '../src/data/freeman';
import type { PlayerSource } from '../src/player';
import { colors } from '../src/theme';

type Props = {
  episode?: FreemanEpisode | null;
  uri?: string | null;
  heading?: string;
  onClose: () => void;
};

export function VideoPlayerModal({ episode, uri, heading, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [cinema, setCinema] = useState(false);
  const source: PlayerSource | null = episode ? episodeSource(episode) : uri ? { type: 'page', uri } : null;

  useEffect(() => {
    if (!source) setCinema(false);
  }, [source]);

  if (!source) return null;

  if (cinema) {
    return (
      <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
        <View style={[styles.root, styles.rootCinema]}>
          <View style={[styles.stage, styles.stageCinema]}>
            <VideoEmbed source={source} cinema onCinemaChange={setCinema} onEnded={onClose} />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <NativeSheet visible onClose={onClose}>
      <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.head}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
            <Text style={styles.closeText}>Закрыть</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            {episode ? <Text style={styles.kicker}>Ep. {episode.part} · плеер Life Engine</Text> : null}
            <Text style={styles.title} numberOfLines={2}>
              {episode?.title ?? heading ?? 'Плеер'}
            </Text>
          </View>
        </View>
        <View style={styles.stage}>
          <VideoEmbed source={source} cinema={false} onCinemaChange={setCinema} onEnded={onClose} />
        </View>
      </View>
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  rootCinema: { padding: 0 },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  close: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  closeText: { color: colors.text, fontWeight: '800' },
  kicker: { color: colors.violet, fontWeight: '800', letterSpacing: 0.6, fontSize: 11 },
  title: { color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 4 },
  stage: {
    flex: 1,
    backgroundColor: '#000',
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  stageCinema: { marginHorizontal: 0, borderRadius: 0 },
  missing: { color: colors.muted, textAlign: 'center', marginTop: 48, paddingHorizontal: 24 },
});
