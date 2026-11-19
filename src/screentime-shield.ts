/**
 * Immediate ManagedSettings shield on/off after a policy push.
 * Keep in sync with ScreenTimeBridge.applyPolicy and
 * ScreenTimeStore.applyIntervalStart.
 *
 * Must use today's grid cap, not the fallback dailyCapMin. A Saturday=0
 * slot with daily still at 30 has to shield now: DeviceActivity's
 * intervalDidStart already ran at midnight and will not run again today.
 */
export function shouldApplyImmediateShield(opts: {
  bypassed: boolean;
  todayCapMin: number;
  weeklyLimitMin: number;
  weeklyHit: boolean;
}): boolean {
  if (opts.bypassed) return false;
  return opts.todayCapMin === 0 || opts.weeklyLimitMin === 0 || opts.weeklyHit;
}
