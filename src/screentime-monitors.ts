/**
 * DeviceActivity resets usage toward a threshold when the app calls
 * stopMonitoring() + startMonitoring() for the same activity names.
 * Keep this in sync with ScreenTimeBridge.startMonitors.
 */
export function monitorFingerprint(input: {
  weeklyLimitMin: number;
  dailyCapMin: number;
  useDayGrid: boolean;
  dayLimitsMin: number[];
  selectionData: string;
}): string {
  return [
    String(input.weeklyLimitMin),
    String(input.dailyCapMin),
    input.useDayGrid ? '1' : '0',
    input.dayLimitsMin.join(','),
    input.selectionData,
  ].join('|');
}

export function shouldRestartMonitors(opts: {
  storedFingerprint: string | null;
  nextFingerprint: string;
  dayMonitorsRunning: boolean;
  weekMonitorRunning: boolean;
  weeklyLimitMin: number;
}): boolean {
  if (!opts.dayMonitorsRunning) return true;
  if (opts.weeklyLimitMin > 0 && !opts.weekMonitorRunning) return true;
  return opts.storedFingerprint !== opts.nextFingerprint;
}
