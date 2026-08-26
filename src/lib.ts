import type { EngineState, Habit, HabitSlot, ItemState, Status } from './types';

export const STORAGE_KEY = 'life-engine-v1';
export const ACCOUNTS_KEY = 'life-engine-accounts';
export const SESSION_KEY = 'le-session';
export const LEGACY_MIGRATED_KEY = 'life-engine-legacy-migrated';

export function userStorageKey(userId: string) {
  return `${STORAGE_KEY}:${userId}`;
}

export function userPinKey(userId: string) {
  return `life-engine-pin:${userId}`;
}

export function userPassKey(userId: string) {
  return `le-pass-${userId}`;
}

export const STATUS_LABEL: Record<Status, string> = {
  planned: 'В планах',
  progress: 'В процессе',
  done: 'Сделано',
};

export const DAYS_PER_MONTH = 30.437;

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Milliseconds until the next local midnight (00:00). */
export function msUntilNextMidnight(from = new Date()): number {
  const next = new Date(from);
  next.setHours(24, 0, 0, 0);
  return Math.max(0, next.getTime() - from.getTime());
}

export function formatHms(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(total / 3600)).padStart(2, '0');
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function hashPin(pin: string): string {
  let h = 2166136261;
  const input = `life-engine-v1::${pin}`;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function defaultItem(): ItemState {
  return { status: 'planned', notes: '', extraTags: [] };
}

export function emptyState(): EngineState {
  return {
    items: {},
    habits: [
      seedHabit('Холодный душ', '🚿', 'morning'),
      seedHabit('Чтение 20 минут', '📖', 'evening'),
      seedHabit('Движение / тренировка', '🏃', 'day'),
    ],
    secret: {
      pinHash: null,
      thcStartISO: null,
      thcDailyCost: 0,
      thcMonthlyCost: 0,
      thcJournal: [],
      nofapStartISO: null,
      nofapJournal: [],
      customTracks: [],
      tracks: [],
      calendar: {},
    },
    customSections: [],
    extraItems: {},
    coachMessages: [],
    videoInsights: {},
    videoWatch: {},
    breathLogs: [],
  };
}

function seedHabit(name: string, emoji: string, slot: HabitSlot): Habit {
  return {
    id: uid('habit'),
    name,
    emoji,
    slot,
    createdAt: new Date().toISOString(),
    completions: {},
  };
}

const SEED_HABIT_LOOK: Record<string, { emoji: string; slot: HabitSlot }> = {
  'Холодный душ': { emoji: '🚿', slot: 'morning' },
  'Чтение 20 минут': { emoji: '📖', slot: 'evening' },
  'Движение / тренировка': { emoji: '🏃', slot: 'day' },
};

export function normalizeHabit(habit: Habit): Habit {
  const inferred = SEED_HABIT_LOOK[habit.name] ?? { emoji: '✨', slot: 'day' as HabitSlot };
  return {
    ...habit,
    emoji: habit.emoji || inferred.emoji,
    slot: habit.slot ?? inferred.slot,
  };
}

export function streakFor(habit: Habit, from = new Date()): number {
  let n = 0;
  const cursor = new Date(from);
  cursor.setHours(12, 0, 0, 0);
  if (!habit.completions[todayKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (habit.completions[todayKey(cursor)]) {
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

export function elapsedParts(startISO: string | null, now = Date.now()) {
  if (!startISO) return { days: 0, hours: 0, minutes: 0, totalHours: 0, ms: 0 };
  const start = new Date(startISO).getTime();
  if (Number.isNaN(start)) return { days: 0, hours: 0, minutes: 0, totalHours: 0, ms: 0 };
  const ms = Math.max(0, now - start);
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const totalHours = Math.floor(ms / 3600000);
  return { days, hours, minutes, totalHours, ms };
}

export function money(n: number) {
  return Math.round(n).toLocaleString('ru-RU');
}

export function thcMonthlyFromSecret(monthly: number, daily: number) {
  if (monthly > 0) return monthly;
  if (daily > 0) return daily * DAYS_PER_MONTH;
  return 0;
}

export function thcSavings(monthly: number, startISO: string | null, now = Date.now()) {
  const elapsed = elapsedParts(startISO, now);
  const perDay = monthly / DAYS_PER_MONTH;
  const saved = (elapsed.ms / 86400000) * perDay;
  return {
    saved,
    perDay,
    month: monthly,
    sixMonths: monthly * 6,
    year: monthly * 12,
  };
}

export function monthMatrix(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(startPad).fill(null);
  for (let d = 1; d <= days; d += 1) {
    cells.push(todayKey(new Date(year, month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function shiftDays(days: number, from = new Date()) {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}
