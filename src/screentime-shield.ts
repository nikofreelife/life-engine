/**
 * Native applyPolicy must not lift a DeviceActivity shield just because JS
 * re-pushed limits. Keep this in sync with ScreenTimeBridge.applyPolicy.
 */
export function shouldClearShieldOnPolicyPush(opts: {
  bypassed: boolean;
  dailyCapMin: number;
  weeklyLimitMin: number;
  weeklyHit: boolean;
  alreadyShielded: boolean;
}): boolean {
  if (opts.bypassed) return true;
  if (opts.dailyCapMin === 0 || opts.weeklyLimitMin === 0 || opts.weeklyHit) return false;
  if (opts.alreadyShielded) return false;
  return true;
}
