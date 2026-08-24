import type { Accent } from './theme';

export type Status = 'planned' | 'progress' | 'done';
export type TabKey = 'books' | 'learn' | 'health' | 'knowledge';

export type CatalogItem = {
  id: string;
  title: string;
  subtitle?: string;
  helper?: string;
  body?: string;
  tags: string[];
  accent: Accent;
  custom?: boolean;
  minAge?: number;
  priorityMin?: number;
  priorityMax?: number;
};

export type CatalogSection = {
  id: string;
  title: string;
  description?: string;
  accent: Accent;
  items: CatalogItem[];
  mode?: 'catalog' | 'guide';
  tab?: TabKey;
  custom?: boolean;
  minAge?: number;
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

export type CustomTrack = {
  id: string;
  name: string;
  startISO: string | null;
  journal: JournalEntry[];
};

export type SecretState = {
  pinHash: string | null;
  thcStartISO: string | null;
  thcDailyCost: number;
  thcMonthlyCost: number;
  thcJournal: JournalEntry[];
  nofapStartISO: string | null;
  nofapJournal: JournalEntry[];
  customTracks: CustomTrack[];
  calendar: Record<string, CalendarDay>;
};

export type UserAccount = {
  id: string;
  email: string;
  age: number;
  createdAt: string;
  local?: boolean;
};

export type Ageable = {
  minAge?: number;
  priorityMin?: number;
  priorityMax?: number;
};

export type KnowledgeTopic = Ageable & {
  id: string;
  title: string;
  icon: string;
  gives: string;
  how: string;
  when: string;
};

export type KnowledgeFactor = Ageable & {
  id: string;
  emoji: string;
  title: string;
  description: string;
  accent: Accent;
  topics: KnowledgeTopic[];
};

export type CoachMessage = {
  id: string;
  role: 'user' | 'coach';
  text: string;
  atISO: string;
};

export type EngineState = {
  items: Record<string, ItemState>;
  habits: Habit[];
  secret: SecretState;
  customSections: CatalogSection[];
  extraItems: Record<string, CatalogItem[]>;
  coachMessages: CoachMessage[];
};
