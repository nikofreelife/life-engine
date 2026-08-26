import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { playerHtml, type VideoEmbedProps } from '../src/player';

function keepInsideApp(url: string, isTopFrame?: boolean) {
  if (/^(intent:|market:|youtube:|vnd\.youtube)/i.test(url)) return false;
  if (isTopFrame && /youtube\.com\/watch|youtu\.be\//i.test(url)) return false;
  return true;
}

export function VideoEmbed({ source, cinema, onCinemaChange, onEnded }: VideoEmbedProps) {
  const webRef = useRef<WebView>(null);

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
        } catch {
          /* ignore */
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: '#000' },
});
