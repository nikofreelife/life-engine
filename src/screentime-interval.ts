/**
 * DeviceActivity calls intervalDidStart both at a real midnight/Monday
 * boundary and immediately after stopMonitoring + startMonitoring while the
 * current interval still contains "now". Keep this in sync with
 * ScreenTimeStore.applyIntervalStart.
 */

export type IntervalLatchState = {
  weeklyHit: boolean;
  weeklyHitWeekId: string | null;
  dailyHitDayId: string | null;
  weekIntervalId: string | null;
  dayIntervalId: string | null;
  shielded: boolean;
};

export type IntervalEnv = {
  activityRaw: string;
  dayId: string;
  weekId: string;
  bypassed: boolean;
  todayCapMin: number;
  weeklyCapMin: number;
};

export type IntervalOutcome = IntervalLatchState & {
  shield: 'apply' | 'clear';
};

export function expireStaleLatches(state: IntervalLatchState, weekId: string): IntervalLatchState {
  if (!state.weeklyHit) return state;
  if (state.weeklyHitWeekId == null) {
    return { ...state, weeklyHitWeekId: weekId };
  }
  if (state.weeklyHitWeekId !== weekId) {
    return { ...state, weeklyHit: false };
  }
  return state;
}

export function shouldApplyShield(opts: {
  bypassed: boolean;
  todayCapMin: number;
  weeklyCapMin: number;
  weeklyHit: boolean;
  dailyHitToday: boolean;
  shielded: boolean;
  allowClear: boolean;
}): boolean {
  if (opts.bypassed) return false;
  if (opts.todayCapMin === 0 || opts.weeklyCapMin === 0 || opts.weeklyHit || opts.dailyHitToday) {
    return true;
  }
  if (!opts.allowClear && opts.shielded) return true;
  return false;
}

/** True when this is a real week boundary, not first bind or same-week re-registration. */
export function markWeekInterval(
  weekIntervalId: string | null,
  weekId: string,
): { weekIntervalId: string; newWeek: boolean } {
  if (weekIntervalId == null) return { weekIntervalId: weekId, newWeek: false };
  if (weekIntervalId === weekId) return { weekIntervalId, newWeek: false };
  return { weekIntervalId: weekId, newWeek: true };
}

/** True when this is a real local-midnight boundary, not first bind or same-day re-registration. */
export function markDayInterval(
  dayIntervalId: string | null,
  dayId: string,
): { dayIntervalId: string; newDay: boolean } {
  if (dayIntervalId == null) return { dayIntervalId: dayId, newDay: false };
  if (dayIntervalId === dayId) return { dayIntervalId, newDay: false };
  return { dayIntervalId: dayId, newDay: true };
}

export function applyIntervalStart(state: IntervalLatchState, env: IntervalEnv): IntervalOutcome {
  if (env.activityRaw === 'le.bypass') {
    return { ...state, shield: state.shielded ? 'apply' : 'clear' };
  }

  let next = expireStaleLatches(state, env.weekId);
  let allowClear = false;

  if (env.activityRaw === 'le.week') {
    const marked = markWeekInterval(next.weekIntervalId, env.weekId);
    next = {
      ...next,
      weekIntervalId: marked.weekIntervalId,
      weeklyHit: marked.newWeek ? false : next.weeklyHit,
    };
    allowClear = marked.newWeek;
  } else if (env.activityRaw.startsWith('le.day.')) {
    const marked = markDayInterval(next.dayIntervalId, env.dayId);
    next = { ...next, dayIntervalId: marked.dayIntervalId };
    allowClear = marked.newDay;
  }

  const apply = shouldApplyShield({
    bypassed: env.bypassed,
    todayCapMin: env.todayCapMin,
    weeklyCapMin: env.weeklyCapMin,
    weeklyHit: next.weeklyHit,
    dailyHitToday: next.dailyHitDayId === env.dayId,
    shielded: next.shielded,
    allowClear,
  });

  return {
    ...next,
    shielded: apply,
    shield: apply ? 'apply' : 'clear',
  };
}

export function applyThreshold(
  state: IntervalLatchState,
  env: IntervalEnv & { eventRaw: string },
): IntervalLatchState {
  const next = expireStaleLatches(state, env.weekId);
  if (env.activityRaw === 'le.week' || env.eventRaw === 'le.week.cap') {
    return { ...next, weeklyHit: true, weeklyHitWeekId: env.weekId, shielded: true };
  }
  return { ...next, dailyHitDayId: env.dayId, shielded: true };
}
