import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

type MiniAudio = {
  createOscillator: () => {
    type: string;
    frequency: { value: number };
    connect: (node: unknown) => void;
    start: () => void;
    stop: (when: number) => void;
  };
  createGain: () => {
    gain: {
      value: number;
      exponentialRampToValueAtTime: (v: number, t: number) => void;
    };
    connect: (node: unknown) => void;
  };
  destination: unknown;
  currentTime: number;
  resume?: () => Promise<void>;
};

let ctx: MiniAudio | null = null;

function audioCtx(): MiniAudio | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    (window as unknown as { AudioContext?: new () => MiniAudio; webkitAudioContext?: new () => MiniAudio })
      .AudioContext ??
    (window as unknown as { webkitAudioContext?: new () => MiniAudio }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = ctx ?? new Ctor();
  void ctx.resume?.();
  return ctx;
}

function beep(freq: number, ms: number, haptic: 'light' | 'medium') {
  const ac = audioCtx();
  if (ac) {
    try {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.07;
      osc.connect(gain);
      gain.connect(ac.destination);
      const t = ac.currentTime;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, t + ms / 1000);
      osc.stop(t + ms / 1000);
    } catch {
      /* fall through to haptics */
    }
  }
  if (Platform.OS !== 'web') {
    void Haptics.impactAsync(
      haptic === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    );
  }
}

export function unlockBreathAudio() {
  audioCtx();
}

export function playInhaleTone() {
  beep(392, 160, 'medium');
}

export function playExhaleTone() {
  beep(247, 200, 'light');
}

export function playHoldTone() {
  beep(330, 140, 'medium');
}
