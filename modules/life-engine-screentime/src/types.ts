export type AuthStatus = 'approved' | 'denied' | 'notDetermined' | 'unavailable';

export type PickerResult = {
  selectionData: string;
  applicationCount: number;
  categoryCount: number;
  webCount: number;
};

export type NativePolicy = {
  selectionData: string;
  weeklyLimitMin: number;
  dailyCapMin: number;
  useDayGrid: boolean;
  dayLimitsMin: number[];
  bypassUntil: string | null;
};

export type ScreenTimeNative = {
  isNativeAvailable(): boolean;
  authorizationStatus(): Promise<AuthStatus>;
  requestAuthorization(): Promise<AuthStatus>;
  presentPicker(initial?: string | null): Promise<PickerResult>;
  applyPolicy(policy: NativePolicy): Promise<void>;
  clearPolicy(): Promise<void>;
  unlockUntilMidnight(): Promise<string>;
  consumePendingUnlock(): Promise<boolean>;
  isShielded(): Promise<boolean>;
  addListener?(event: string, cb: () => void): { remove: () => void };
};

export type ScreenTimeEvent = 'onPendingUnlock' | 'onThresholdReached';
