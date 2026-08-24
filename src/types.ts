import type { Accent } from './theme';

export type Status = 'planned' | 'progress' | 'done';

export type CatalogItem = {
  id: string;
  title: string;
  subtitle?: string;
  helper?: string;
  tags: string[];
  accent: Accent;
};

export type CatalogSection = {
  id: string;
  title: string;
  description?: string;
  accent: Accent;
  items: CatalogItem[];
};

export type ItemState = {
  status: Status;
  notes: string;
  extraTags: string[];
};

export type Habit = {
  id: string;
  name: string;
  createdAt: string;
  completions: Record<string, boolean>;
};

export type JournalKind = 'craving' | 'slip' | 'win' | 'note';

export type JournalEntry = {
  id: string;
  atISO: string;
  kind: JournalKind;
  text: string;
};

export type DayState = 'clean' | 'craving' | 'slip';

export type CalendarDay = {
  state: DayState;
  mood: number;
  note: string;
};

export type SecretState = {
  pinHash: string | null;
  thcStartISO: string | null;
  thcDailyCost: number;
  thcJournal: JournalEntry[];
  nofapStartISO: string | null;
  nofapJournal: JournalEntry[];
  calendar: Record<string, CalendarDay>;
};

export type EngineState = {
  items: Record<string, ItemState>;
  habits: Habit[];
  secret: SecretState;
};
