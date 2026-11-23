import {
  applyIntervalStart,
  applyThreshold,
  expireStaleLatches,
  markDayInterval,
  markWeekInterval,
  shouldApplyShield,
  type IntervalEnv,
  type IntervalLatchState,
} from '../src/screentime-interval.ts';

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

const tuesday = {
  dayId: '2026-11-17',
  weekId: '2026-11-16',
};

const wednesday = {
  dayId: '2026-11-18',
  weekId: '2026-11-16',
};

const nextMonday = {
  dayId: '2026-11-23',
  weekId: '2026-11-23',
};

const fresh: IntervalLatchState = {
  weeklyHit: false,
  weeklyHitWeekId: null,
  dailyHitDayId: null,
  weekIntervalId: null,
  dayIntervalId: null,
  shielded: false,
};

const openDay: IntervalEnv = {
  activityRaw: 'le.day.3',
  ...tuesday,
  bypassed: false,
  todayCapMin: 30,
  weeklyCapMin: 120,
};

const openWeek: IntervalEnv = {
  activityRaw: 'le.week',
  ...tuesday,
  bypassed: false,
  todayCapMin: 30,
  weeklyCapMin: 120,
};

assert(markWeekInterval(null, tuesday.weekId).newWeek === false, 'first week bind is not a boundary');
assert(markWeekInterval(tuesday.weekId, tuesday.weekId).newWeek === false, 'same week is re-registration');
assert(markWeekInterval(tuesday.weekId, nextMonday.weekId).newWeek === true, 'Monday is a real week boundary');
assert(markDayInterval(null, tuesday.dayId).newDay === false, 'first day bind is not a boundary');
assert(markDayInterval(tuesday.dayId, tuesday.dayId).newDay === false, 'same day is re-registration');
assert(markDayInterval(tuesday.dayId, wednesday.dayId).newDay === true, 'midnight is a real day boundary');

assert(
  expireStaleLatches({ ...fresh, weeklyHit: true, weeklyHitWeekId: null }, tuesday.weekId).weeklyHit === true,
  'upgrade with weeklyHit and no week id must keep the latch for the current week',
);
assert(
  expireStaleLatches({ ...fresh, weeklyHit: true, weeklyHitWeekId: tuesday.weekId }, nextMonday.weekId)
    .weeklyHit === false,
  'weeklyHit from last week must expire',
);

const afterDailyCap = applyThreshold(
  { ...fresh, weekIntervalId: tuesday.weekId, dayIntervalId: tuesday.dayId, shielded: true },
  { ...openDay, eventRaw: 'le.cap' },
);
assert(afterDailyCap.dailyHitDayId === tuesday.dayId, 'daily threshold must latch today');
assert(afterDailyCap.weeklyHit === false, 'daily cap must not set weeklyHit');

const reregisterDay = applyIntervalStart(afterDailyCap, openDay);
assert(reregisterDay.shield === 'apply', 're-registering today after the daily cap must keep the shield');
assert(reregisterDay.dailyHitDayId === tuesday.dayId, 'same-day re-registration must not drop the daily latch');

const afterWeeklyCap = applyThreshold(
  { ...afterDailyCap, shielded: true },
  { ...openWeek, eventRaw: 'le.week.cap' },
);
assert(afterWeeklyCap.weeklyHit === true, 'weekly threshold must set weeklyHit');
assert(afterWeeklyCap.weeklyHitWeekId === tuesday.weekId, 'weeklyHit must bind to this week');

const reregisterWeek = applyIntervalStart(afterWeeklyCap, openWeek);
assert(reregisterWeek.weeklyHit === true, 'same-week monitor restart must not clear weeklyHit');
assert(reregisterWeek.shield === 'apply', 'same-week monitor restart after weekly cap must keep the shield');

const newDaySameWeek = applyIntervalStart(afterWeeklyCap, {
  ...openWeek,
  activityRaw: 'le.day.4',
  ...wednesday,
});
assert(newDaySameWeek.weeklyHit === true, 'Wednesday must still be locked after a weekly cap');
assert(newDaySameWeek.shield === 'apply', 'a new day in a spent week must stay shielded');

const newWeek = applyIntervalStart(afterWeeklyCap, {
  ...openWeek,
  ...nextMonday,
});
assert(newWeek.weeklyHit === false, 'Monday intervalDidStart must clear last week weeklyHit');
assert(newWeek.shield === 'clear', 'a fresh week with leftover daily allowance must unshield');

const newDayAfterDailyOnly = applyIntervalStart(afterDailyCap, {
  ...openDay,
  activityRaw: 'le.day.4',
  ...wednesday,
});
assert(newDayAfterDailyOnly.shield === 'clear', 'a new local day after only the daily cap must restore allowance');

const upgradeShielded = applyIntervalStart(
  { ...fresh, weeklyHit: true, shielded: true },
  openWeek,
);
assert(upgradeShielded.weeklyHit === true, 'existing weeklyHit without interval ids must survive first bind');
assert(upgradeShielded.shield === 'apply', 'first bind after upgrade must not lift an active weekly shield');

const firstStart = applyIntervalStart(fresh, openDay);
assert(firstStart.shield === 'clear', 'first policy start before any cap must not lock apps');

assert(
  shouldApplyShield({
    bypassed: true,
    todayCapMin: 30,
    weeklyCapMin: 120,
    weeklyHit: true,
    dailyHitToday: true,
    shielded: true,
    allowClear: false,
  }) === false,
  'live phrase bypass must lift the shield',
);

assert(
  shouldApplyShield({
    bypassed: false,
    todayCapMin: 0,
    weeklyCapMin: 120,
    weeklyHit: false,
    dailyHitToday: false,
    shielded: false,
    allowClear: true,
  }) === true,
  'a 0-minute day must stay shielded even on a real interval start',
);

console.log('OK');
