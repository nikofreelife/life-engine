import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { WatchYoutubeButton } from './WatchYoutubeButton';
import { openYoutubeWatch, playerHtml, type VideoEmbedProps } from '../src/player';

function keepInsideApp(url: string, isTopFrame?: boolean) {
  if (/^(intent:|market:|youtube:|vnd\.youtube)/i.test(url)) return false;
  if (isTopFrame && /youtube\.com\/watch|youtu\.be\//i.test(url)) return false;
  return true;
}

export function VideoEmbed({ source, cinema, onCinemaChange, onEnded }: VideoEmbedProps) {
  const webRef = useRef<WebView>(null);
  const opened = useRef(false);

  useEffect(() => {
    opened.current = false;
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
            if (msg.type === 'error' && source.type === 'youtube' && !opened.current) {
              opened.current = true;
              void openYoutubeWatch(source.id);
            }
            if (msg.type === 'openyt' && source.type === 'youtube') void openYoutubeWatch(source.id);
          } catch {
            /* ignore */
          }
        }}
      />
      {source.type === 'youtube' ? (
        <View style={[styles.bar, cinema && styles.barCinema]}>
          <WatchYoutubeButton id={source.id} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  web: { flex: 1, backgroundColor: '#000' },
  bar: { backgroundColor: '#000' },
  barCinema: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
  },
});
