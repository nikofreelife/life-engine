import type { EngineState, Habit, ItemState, Status } from './types';

export const STORAGE_KEY = 'life-engine-v1';

export const STATUS_LABEL: Record<Status, string> = {
  planned: 'В планах',
  progress: 'В процессе',
  done: 'Сделано',
};

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
      seedHabit('Холодный душ'),
      seedHabit('Чтение 20 минут'),
      seedHabit('Движение / тренировка'),
    ],
    secret: {
      pinHash: null,
      thcStartISO: null,
      thcDailyCost: 0,
      thcJournal: [],
      nofapStartISO: null,
      nofapJournal: [],
      calendar: {},
    },
    customSections: [],
    extraItems: {},
  };
}

function seedHabit(name: string): Habit {
  return { id: uid('habit'), name, createdAt: new Date().toISOString(), completions: {} };
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
  const ms = Math.max(0, now - new Date(startISO).getTime());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const totalHours = Math.floor(ms / 3600000);
  return { days, hours, minutes, totalHours, ms };
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
