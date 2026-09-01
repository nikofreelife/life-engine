import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlayerChrome } from './PlayerChrome';
import {
  cropYouTubeIframe,
  END_GUARD_SEC,
  openYoutubeWatch,
  safeMediaId,
  YOUTUBE_PLAYER_VARS,
  type VideoEmbedProps,
} from '../src/player';
import { colors } from '../src/theme';

type YtPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
};

type VmPlayer = {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  setCurrentTime: (seconds: number) => Promise<number>;
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
  setVolume: (n: number) => Promise<number>;
  on: (ev: string, cb: () => void) => void;
  destroy: () => Promise<void>;
};

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: object) => YtPlayer; PlayerState: { PLAYING: number; ENDED: number } };
    onYouTubeIframeAPIReady?: () => void;
    Vimeo?: { Player: new (el: HTMLIFrameElement) => VmPlayer };
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(src));
    document.head.appendChild(el);
  });
}

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    void loadScript('https://www.youtube.com/iframe_api').then(() => {
      if (window.YT?.Player) resolve();
    });
  });
}

function sourceKey(source: VideoEmbedProps['source']) {
  return source.type === 'page' ? `page:${source.uri}` : `${source.type}:${source.id}`;
}

export function VideoEmbed({ source, cinema, onCinemaChange, onEnded }: VideoEmbedProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const ytRef = useRef<YtPlayer | null>(null);
  const vmRef = useRef<VmPlayer | null>(null);
  const sourceRef = useRef(source);
  const endedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  sourceRef.current = source;
  onEndedRef.current = onEnded;
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ending, setEnding] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const key = sourceKey(source);

  const finish = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnding(true);
    try {
      ytRef.current?.pauseVideo();
    } catch {
      /* ignore */
    }
    void vmRef.current?.pause();
    onEndedRef.current?.();
  }, []);

  useEffect(() => {
    let dead = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    const active = sourceRef.current;
    endedRef.current = false;
    setPlaying(false);
    setStarted(false);
    setEnding(false);
    setCurrent(0);
    setDuration(0);
    setError(null);

    async function start() {
      if (active.type === 'page') return;
      const id = safeMediaId(active.id);
      if (!id) {
        setError('Нет ролика для этой серии.');
        return;
      }

      if (active.type === 'youtube') {
        const mount = mountRef.current;
        if (!mount) return;
        mount.replaceChildren();
        await loadYouTubeApi();
        if (dead || !window.YT) return;
        const host = document.createElement('div');
        host.style.cssText = 'width:100%;height:100%;pointer-events:none;background:#000';
        mount.appendChild(host);
        const yt = new window.YT.Player(host, {
          videoId: id,
          width: '100%',
          height: '100%',
          playerVars: {
            ...YOUTUBE_PLAYER_VARS,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (dead) return;
              ytRef.current = yt;
              const iframe = mount.querySelector('iframe');
              if (iframe) cropYouTubeIframe(iframe);
              setDuration(yt.getDuration() || 0);
              try {
                yt.mute();
              } catch {
                /* ignore */
              }
              yt.playVideo();
              poll = setInterval(() => {
                try {
                  const now = yt.getCurrentTime() || 0;
                  const dur = yt.getDuration() || 0;
                  setCurrent(now);
                  setDuration(dur);
                  if (dur > 0 && dur - now <= END_GUARD_SEC) finish();
                } catch {
                  /* player torn down */
                }
              }, 200);
            },
            onStateChange: (e: { data: number }) => {
              const isPlaying = e.data === window.YT?.PlayerState.PLAYING;
              setPlaying(Boolean(isPlaying));
              if (isPlaying) {
                setStarted(true);
                try {
                  yt.unMute();
                } catch {
                  /* ignore */
                }
              }
              if (e.data === window.YT?.PlayerState.ENDED) finish();
            },
            onError: () => setError('Этот ролик нельзя открыть во встроенном плеере.'),
          },
        });
        ytRef.current = yt;
        return;
      }

      await loadScript('https://player.vimeo.com/api/player.js');
      if (dead || !iframeRef.current || !window.Vimeo) return;
      const vm = new window.Vimeo.Player(iframeRef.current);
      vmRef.current = vm;
      vm.on('play', () => {
        setPlaying(true);
        setStarted(true);
        void vm.setVolume(1);
      });
      vm.on('pause', () => setPlaying(false));
      vm.on('ended', () => finish());
      const dur = await vm.getDuration();
      if (dead) return;
      setDuration(dur || 0);
      poll = setInterval(() => {
        void vm.getCurrentTime().then((t) => {
          if (!dead) setCurrent(t || 0);
        });
        void vm.getDuration().then((d) => {
          if (dead) return;
          setDuration(d || 0);
          void vm.getCurrentTime().then((t) => {
            if (d > 0 && d - (t || 0) <= END_GUARD_SEC) finish();
          });
        });
      }, 200);
      await vm.setVolume(0);
      void vm.play();
    }

    void start();
    return () => {
      dead = true;
      if (poll) clearInterval(poll);
      try {
        ytRef.current?.destroy();
      } catch {
        /* ignore */
      }
      ytRef.current = null;
      void vmRef.current?.destroy();
      vmRef.current = null;
      mountRef.current?.replaceChildren();
    };
  }, [key, finish]);

  const toggle = useCallback(() => {
    if (endedRef.current) return;
    if (source.type === 'youtube') {
      if (playing) ytRef.current?.pauseVideo();
      else ytRef.current?.playVideo();
      return;
    }
    if (playing) void vmRef.current?.pause();
    else void vmRef.current?.play();
  }, [playing, source.type]);

  const seek = useCallback(
    (seconds: number) => {
      if (endedRef.current) return;
      if (source.type === 'youtube') ytRef.current?.seekTo(seconds, true);
      else void vmRef.current?.setCurrentTime(seconds);
      setCurrent(seconds);
    },
    [source.type],
  );

  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(false), 2500);
    return () => clearTimeout(t);
  }, [hint]);

  if (source.type === 'page') {
    return createElement('iframe', {
      src: source.uri,
      style: { border: 0, width: '100%', height: '100%', background: '#000' },
      title: 'page',
    });
  }

  return (
    <View style={styles.root}>
      <View style={styles.stage}>
        {source.type === 'youtube'
          ? createElement('div', {
              ref: mountRef,
              style: { position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' },
            })
          : createElement('iframe', {
              ref: iframeRef,
              src: `https://player.vimeo.com/video/${safeMediaId(source.id)}?autoplay=1&muted=1&controls=0&title=0&byline=0&portrait=0&dnt=1`,
              style: {
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 0,
                pointerEvents: 'none',
              },
              allow: 'autoplay; encrypted-media',
              title: 'player',
            })}
        <Pressable
          style={styles.hit}
          onPress={() => {
            if (cinema) setHint(true);
            else if (started) toggle();
          }}
        />
        {!started && !error ? <View style={styles.cover} pointerEvents="none" /> : null}
        {ending ? <View style={styles.cover} pointerEvents="none" /> : null}
        {error ? (
          <View style={styles.msgBox}>
            <Text style={styles.msg}>{error}</Text>
            {source.type === 'youtube' ? (
              <Pressable onPress={() => void openYoutubeWatch(source.id)} style={styles.openYt}>
                <Text style={styles.openYtText}>Смотреть в YouTube / Открыть ссылку</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {cinema && hint ? (
          <Pressable onPress={() => onCinemaChange?.(false)} style={styles.exit}>
            <Text style={styles.exitText}>Свернуть</Text>
          </Pressable>
        ) : null}
      </View>
      {cinema ? null : (
        <PlayerChrome
          playing={playing}
          current={current}
          duration={duration}
          onToggle={toggle}
          onSeek={seek}
          onFullscreen={() => onCinemaChange?.(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  stage: { flex: 1, backgroundColor: '#000', minHeight: 180, overflow: 'hidden' },
  hit: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 },
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 4,
  },
  exit: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exitText: { color: colors.text, fontWeight: '800' },
  msgBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 5,
  },
  msg: { color: colors.muted, textAlign: 'center' },
  openYt: {
    marginTop: 16,
    backgroundColor: colors.crimson,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  openYtText: { color: colors.white, fontWeight: '800', textAlign: 'center' },
});
