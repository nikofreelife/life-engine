import { shouldApplyImmediateShield } from '../src/screentime-shield.ts';

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

assert(
  shouldApplyImmediateShield({
    bypassed: false,
    todayCapMin: 0,
    weeklyLimitMin: 120,
    weeklyHit: false,
  }) === true,
  'Saturday=0 must shield even when fallback daily is 30',
);

assert(
  shouldApplyImmediateShield({
    bypassed: false,
    todayCapMin: 15,
    weeklyLimitMin: 120,
    weeklyHit: false,
  }) === false,
  'Monday=15 must not shield from the fallback daily field',
);

assert(
  shouldApplyImmediateShield({
    bypassed: true,
    todayCapMin: 0,
    weeklyLimitMin: 120,
    weeklyHit: false,
  }) === false,
  'active bypass keeps the shield off',
);

assert(
  shouldApplyImmediateShield({
    bypassed: false,
    todayCapMin: 15,
    weeklyLimitMin: 0,
    weeklyHit: false,
  }) === true,
  'weekly 0 still means immediate shield',
);

assert(
  shouldApplyImmediateShield({
    bypassed: false,
    todayCapMin: 15,
    weeklyLimitMin: 120,
    weeklyHit: true,
  }) === true,
  'weekly hit still means immediate shield',
);

console.log('OK');
