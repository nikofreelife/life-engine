import { Platform } from 'react-native';

import type { AuthStatus, NativePolicy, PickerResult, ScreenTimeNative } from './types';

const unavailable: ScreenTimeNative = {
  isNativeAvailable: () => false,
  authorizationStatus: async () => 'unavailable',
  requestAuthorization: async () => 'unavailable',
  presentPicker: async () => ({
    selectionData: '',
    applicationCount: 0,
    categoryCount: 0,
    webCount: 0,
  }),
  applyPolicy: async () => undefined,
  clearPolicy: async () => undefined,
  unlockUntilMidnight: async () => '',
  consumePendingUnlock: async () => false,
  isShielded: async () => false,
};

function loadNative(): ScreenTimeNative {
  if (Platform.OS !== 'ios') return unavailable;
  try {
    const { requireNativeModule } = require('expo-modules-core') as {
      requireNativeModule: (name: string) => ScreenTimeNative;
    };
    return requireNativeModule('LifeEngineScreenTime');
  } catch {
    return unavailable;
  }
}

const native = loadNative();

export const isNativeAvailable = native.isNativeAvailable();

export async function authorizationStatus(): Promise<AuthStatus> {
  try {
    return await native.authorizationStatus();
  } catch {
    return 'unavailable';
  }
}

export async function requestAuthorization(): Promise<AuthStatus> {
  try {
    return await native.requestAuthorization();
  } catch {
    return 'denied';
  }
}

export async function presentPicker(initial?: string | null): Promise<PickerResult> {
  return native.presentPicker(initial);
}

export async function applyPolicy(policy: NativePolicy): Promise<void> {
  if (!native.isNativeAvailable()) return;
  await native.applyPolicy(policy);
}

export async function clearPolicy(): Promise<void> {
  if (!native.isNativeAvailable()) return;
  await native.clearPolicy();
}

export async function unlockUntilMidnight(): Promise<string> {
  if (!native.isNativeAvailable()) return '';
  return native.unlockUntilMidnight();
}

export async function consumePendingUnlock(): Promise<boolean> {
  if (!native.isNativeAvailable()) return false;
  return native.consumePendingUnlock();
}

export async function isShielded(): Promise<boolean> {
  if (!native.isNativeAvailable()) return false;
  return native.isShielded();
}

export function addScreenTimeListener(
  event: 'onPendingUnlock' | 'onThresholdReached',
  cb: () => void,
): { remove: () => void } {
  if (typeof native.addListener !== 'function') return { remove() {} };
  return native.addListener(event, cb);
}

export { unavailable };
export type { AuthStatus, NativePolicy, PickerResult };
