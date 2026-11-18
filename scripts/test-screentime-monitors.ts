import { monitorFingerprint, shouldRestartMonitors } from '../src/screentime-monitors.ts';

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

const policy = {
  weeklyLimitMin: 120,
  dailyCapMin: 30,
  useDayGrid: false,
  dayLimitsMin: [15, 15, 15, 15, 40, 40, 40],
  selectionData: 'abc',
};

const fp = monitorFingerprint(policy);

assert(
  shouldRestartMonitors({
    storedFingerprint: null,
    nextFingerprint: fp,
    dayMonitorsRunning: false,
    weekMonitorRunning: false,
    weeklyLimitMin: 120,
  }) === true,
  'first policy push must start monitors',
);

assert(
  shouldRestartMonitors({
    storedFingerprint: fp,
    nextFingerprint: fp,
    dayMonitorsRunning: true,
    weekMonitorRunning: true,
    weeklyLimitMin: 120,
  }) === false,
  'opening Screen Time with the same limits must not reset DeviceActivity',
);

assert(
  shouldRestartMonitors({
    storedFingerprint: fp,
    nextFingerprint: monitorFingerprint({ ...policy, dailyCapMin: 15 }),
    dayMonitorsRunning: true,
    weekMonitorRunning: true,
    weeklyLimitMin: 120,
  }) === true,
  'changing the daily cap must restart monitors',
);

assert(
  shouldRestartMonitors({
    storedFingerprint: fp,
    nextFingerprint: fp,
    dayMonitorsRunning: false,
    weekMonitorRunning: true,
    weeklyLimitMin: 120,
  }) === true,
  'dropped day monitors must be started again',
);

assert(
  shouldRestartMonitors({
    storedFingerprint: fp,
    nextFingerprint: fp,
    dayMonitorsRunning: true,
    weekMonitorRunning: false,
    weeklyLimitMin: 120,
  }) === true,
  'dropped week monitor must be started again when a weekly cap is set',
);

assert(
  shouldRestartMonitors({
    storedFingerprint: monitorFingerprint({ ...policy, weeklyLimitMin: 0 }),
    nextFingerprint: monitorFingerprint({ ...policy, weeklyLimitMin: 0 }),
    dayMonitorsRunning: true,
    weekMonitorRunning: false,
    weeklyLimitMin: 0,
  }) === false,
  'no weekly cap means a missing week monitor is not a reason to restart',
);

console.log('OK');
