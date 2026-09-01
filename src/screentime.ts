import { todayKey, uid } from './lib';
import type { ScreenTimeBypass, ScreenTimeSelection, ScreenTimeState, ScreenTimeUnlock } from './types';

export const DEFAULT_PHRASE =
  'Я осознанно управляю своим временем и держу фокус на главных целях';

export const PHRASE_CHIPS = [24, 48, 64, 100] as const;
export const SCREEN_REPEATS_REV = 1;

export const WEEK_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

export function defaultScreenTime(): ScreenTimeState {
  return {
    phrase: DEFAULT_PHRASE,
    repeats: 24,
    repeatsRev: SCREEN_REPEATS_REV,
    selection: null,
    weeklyLimitMin: 120,
    dailyCapMin: 30,
    useDayGrid: false,
    dayLimitsMin: [15, 15, 15, 15, 40, 40, 40],
    bypassUntil: null,
    bypassLog: [],
    unlock: null,
    nativeLocked: false,
  };
}

export function clampRepeats(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 24;
  return Math.max(1, Math.min(500, Math.round(n)));
}

export function clampMinutes(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(24 * 60 * 7, Math.round(n)));
}

export function weekdayIndex(date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

export function normalizeDays(days: unknown, dailyCapMin: number): number[] {
  const fallback = clampMinutes(dailyCapMin, 0);
  const list = Array.isArray(days) ? days : [];
  return Array.from({ length: 7 }, (_, i) => clampMinutes(list[i], fallback));
}

export function normalizePhrase(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function phraseMatches(typed: string, phrase: string): boolean {
  return normalizePhrase(typed) === normalizePhrase(phrase);
}

export function isBypassed(until: string | null, now = Date.now()): boolean {
  if (!until) return false;
  const ts = Date.parse(until);
  return Number.isFinite(ts) && ts > now;
}

export function effectiveDailyCapMin(state: ScreenTimeState, date = new Date()): number {
  if (state.useDayGrid) return clampMinutes(state.dayLimitsMin[weekdayIndex(date)], 0);
  return clampMinutes(state.dailyCapMin, 0);
}

export function formatMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h && r) return `${h} ч ${r} мин`;
  if (h) return `${h} ч`;
  return `${r} мин`;
}

function normalizeSelection(raw: unknown): ScreenTimeSelection | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as ScreenTimeSelection;
  if (!item.selectionData) return null;
  return {
    selectionData: item.selectionData,
    applicationCount: Math.max(0, Math.floor(Number(item.applicationCount) || 0)),
    categoryCount: Math.max(0, Math.floor(Number(item.categoryCount) || 0)),
    webCount: Math.max(0, Math.floor(Number(item.webCount) || 0)),
  };
}

function normalizeUnlock(raw: unknown): ScreenTimeUnlock | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as ScreenTimeUnlock;
  return {
    completed: Math.max(0, Math.floor(Number(item.completed) || 0)),
    startedAt: item.startedAt || new Date().toISOString(),
  };
}

function normalizeBypass(raw: unknown): ScreenTimeBypass | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as ScreenTimeBypass;
  if (!item.id) return null;
  return {
    id: item.id,
    atISO: item.atISO || new Date().toISOString(),
    repeats: clampRepeats(item.repeats),
  };
}

export function hydrateScreenTime(raw?: Partial<ScreenTimeState> | null): ScreenTimeState {
  const base = defaultScreenTime();
  if (!raw || typeof raw !== 'object') return base;
  const dailyCapMin = clampMinutes(raw.dailyCapMin, base.dailyCapMin);
  return {
    phrase: typeof raw.phrase === 'string' && normalizePhrase(raw.phrase) ? normalizePhrase(raw.phrase) : base.phrase,
    repeats: Number(raw.repeatsRev) >= SCREEN_REPEATS_REV ? clampRepeats(raw.repeats) : 24,
    repeatsRev: SCREEN_REPEATS_REV,
    selection: normalizeSelection(raw.selection),
    weeklyLimitMin: clampMinutes(raw.weeklyLimitMin, base.weeklyLimitMin),
    dailyCapMin,
    useDayGrid: Boolean(raw.useDayGrid),
    dayLimitsMin: normalizeDays(raw.dayLimitsMin, dailyCapMin),
    bypassUntil: typeof raw.bypassUntil === 'string' ? raw.bypassUntil : null,
    bypassLog: (Array.isArray(raw.bypassLog) ? raw.bypassLog : [])
      .map(normalizeBypass)
      .filter((item): item is ScreenTimeBypass => Boolean(item))
      .slice(0, 80),
    unlock: normalizeUnlock(raw.unlock),
    nativeLocked: Boolean(raw.nativeLocked) && !isBypassed(typeof raw.bypassUntil === 'string' ? raw.bypassUntil : null),
  };
}

export function makeBypassEvent(repeats: number, now = Date.now()): ScreenTimeBypass {
  return {
    id: uid('bypass'),
    atISO: new Date(now).toISOString(),
    repeats,
  };
}

export function selectionLabel(selection: ScreenTimeSelection | null): string {
  if (!selection) return 'Приложения не выбраны';
  const parts: string[] = [];
  if (selection.applicationCount) parts.push(`${selection.applicationCount} прил.`);
  if (selection.categoryCount) parts.push(`${selection.categoryCount} катег.`);
  if (selection.webCount) parts.push(`${selection.webCount} сайт.`);
  return parts.join(' · ') || 'Выбор Apple сохранён';
}

export { todayKey };
