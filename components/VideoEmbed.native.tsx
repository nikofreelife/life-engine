import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { openYoutubeWatch, playerHtml, type VideoEmbedProps } from '../src/player';
import { colors } from '../src/theme';

function keepInsideApp(url: string, isTopFrame?: boolean) {
  if (/^(intent:|market:|youtube:|vnd\.youtube)/i.test(url)) return false;
  if (isTopFrame && /youtube\.com\/watch|youtu\.be\//i.test(url)) return false;
  return true;
}

export function VideoEmbed({ source, cinema, onCinemaChange, onEnded }: VideoEmbedProps) {
  const webRef = useRef<WebView>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    setBlocked(false);
  }, [source]);

  useEffect(() => {
    webRef.current?.injectJavaScript(`try{window.__leSetCinema(${cinema ? 'true' : 'false'})}catch(e){};true;`);
  }, [cinema]);

  if (source.type === 'page') {
    return (
      <WebView
        source={{ uri: source.uri }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(req) => keepInsideApp(req.url, req.isTopFrame)}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        source={{ html: playerHtml(source), baseUrl: 'https://www.youtube.com' }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        scrollEnabled={false}
        bounces={false}
        startInLoadingState
        onShouldStartLoadWithRequest={(req) => keepInsideApp(req.url, req.isTopFrame)}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data) as { type?: string };
            if (msg.type === 'ended') onEnded?.();
            if (msg.type === 'cinema') onCinemaChange?.(true);
            if (msg.type === 'chrome') onCinemaChange?.(false);
            if (msg.type === 'error') setBlocked(true);
            if (msg.type === 'openyt' && source.type === 'youtube') void openYoutubeWatch(source.id);
          } catch {
            /* ignore */
          }
        }}
      />
      {blocked && source.type === 'youtube' ? (
        <View style={styles.fallback} pointerEvents="box-none">
          <Pressable onPress={() => void openYoutubeWatch(source.id)} style={styles.openYt}>
            <Text style={styles.openYtText}>Смотреть в YouTube / Открыть ссылку</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  web: { flex: 1, backgroundColor: '#000' },
  fallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 28,
  },
  openYt: {
    backgroundColor: colors.crimson,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  openYtText: { color: colors.white, fontWeight: '800' },
});
