import * as Haptics from 'expo-haptics';

async function run(fn: () => Promise<void>) {
  try {
    await fn();
  } catch {
    /* web / unsupported / low power */
  }
}

export function hapticLight() {
  return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticMedium() {
  return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function hapticRigid() {
  return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid));
}

export function hapticSuccess() {
  return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function hapticWarning() {
  return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

export type HapticKind = 'light' | 'medium' | 'rigid' | 'success' | 'warning' | 'none';

export function haptic(kind: HapticKind = 'light') {
  if (kind === 'none') return Promise.resolve();
  if (kind === 'medium') return hapticMedium();
  if (kind === 'rigid') return hapticRigid();
  if (kind === 'success') return hapticSuccess();
  if (kind === 'warning') return hapticWarning();
  return hapticLight();
}
