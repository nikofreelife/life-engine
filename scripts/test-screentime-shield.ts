import { shouldClearShieldOnPolicyPush } from '../src/screentime-shield.ts';

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

assert(
  shouldClearShieldOnPolicyPush({
    bypassed: false,
    dailyCapMin: 30,
    weeklyLimitMin: 120,
    weeklyHit: false,
    alreadyShielded: true,
  }) === false,
  'opening the app after a daily cap must keep the shield',
);

assert(
  shouldClearShieldOnPolicyPush({
    bypassed: false,
    dailyCapMin: 30,
    weeklyLimitMin: 120,
    weeklyHit: false,
    alreadyShielded: false,
  }) === true,
  'policy push before any cap is hit must not lock apps',
);

assert(
  shouldClearShieldOnPolicyPush({
    bypassed: true,
    dailyCapMin: 30,
    weeklyLimitMin: 120,
    weeklyHit: false,
    alreadyShielded: true,
  }) === true,
  'completed phrase bypass must lift the shield',
);

assert(
  shouldClearShieldOnPolicyPush({
    bypassed: false,
    dailyCapMin: 0,
    weeklyLimitMin: 120,
    weeklyHit: false,
    alreadyShielded: false,
  }) === false,
  'daily cap of 0 minutes must keep apps shielded',
);

assert(
  shouldClearShieldOnPolicyPush({
    bypassed: false,
    dailyCapMin: 30,
    weeklyLimitMin: 120,
    weeklyHit: true,
    alreadyShielded: false,
  }) === false,
  'weekly cap hit must keep the shield',
);

console.log('OK');
