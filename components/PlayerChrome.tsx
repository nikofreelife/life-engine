import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatTimecode } from '../src/player';
import { colors } from '../src/theme';

type Props = {
  playing: boolean;
  current: number;
  duration: number;
  onToggle: () => void;
  onSeek: (seconds: number) => void;
  onFullscreen: () => void;
};

export function PlayerChrome({ playing, current, duration, onToggle, onSeek, onFullscreen }: Props) {
  const [trackW, setTrackW] = useState(1);
  const ratio = duration > 0 ? Math.min(1, Math.max(0, current / duration)) : 0;

  return (
    <View style={styles.bar}>
      <Pressable
        style={styles.seekTrack}
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width || 1)}
        onPress={(e) => {
          if (!duration) return;
          onSeek(Math.max(0, Math.min(duration, (e.nativeEvent.locationX / trackW) * duration)));
        }}>
        <View style={[styles.seekFill, { width: `${Math.round(ratio * 100)}%` }]} />
      </Pressable>
      <View style={styles.row}>
        <Pressable onPress={onToggle} style={styles.icon}>
          <Text style={styles.iconText}>{playing ? '❚❚' : '▶'}</Text>
        </Pressable>
        <Text style={styles.time}>
          {formatTimecode(current)} / {formatTimecode(duration)}
        </Text>
        <Text style={styles.brand}>Life Engine</Text>
        <Pressable onPress={onFullscreen} style={styles.icon}>
          <Text style={styles.iconText}>⛶</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  seekTrack: {
    height: 8,
    borderRadius: 99,
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  seekFill: { height: '100%', backgroundColor: colors.emerald },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: colors.text, fontSize: 16 },
  time: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  brand: {
    marginLeft: 'auto',
    color: colors.violet,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
