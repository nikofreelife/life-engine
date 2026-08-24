import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ALL_SECTIONS, TRACKED_ITEMS } from './data/catalog';
import {
  STORAGE_KEY,
  defaultItem,
  emptyState,
  hashPin,
  todayKey,
  uid,
} from './lib';
import type {
  CalendarDay,
  CatalogItem,
  CatalogSection,
  EngineState,
  Habit,
  ItemState,
  JournalEntry,
  JournalKind,
  SecretState,
  Status,
  TabKey,
} from './types';

type EngineContextValue = {
  ready: boolean;
  state: EngineState;
  itemOf: (id: string) => ItemState;
  setItemStatus: (id: string, status: Status) => void;
  setItemNotes: (id: string, notes: string) => void;
  addItemTag: (id: string, tag: string) => void;
  addHabit: (name: string) => void;
  removeHabit: (id: string) => void;
  toggleHabitDay: (id: string, day?: string) => void;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  hasPin: boolean;
  patchSecret: (patch: Partial<SecretState>) => void;
  addJournal: (track: 'thc' | 'nofap', kind: JournalKind, text: string) => void;
  removeJournal: (track: 'thc' | 'nofap', id: string) => void;
  relapse: (track: 'thc' | 'nofap') => void;
  setTrackStart: (track: 'thc' | 'nofap', iso: string) => void;
  setCalendarDay: (day: string, value: CalendarDay) => void;
  addCustomSection: (tab: TabKey, title: string, description: string, accent: CatalogSection['accent']) => void;
  removeCustomSection: (id: string) => void;
  addSectionItem: (section: CatalogSection, title: string, subtitle?: string) => void;
  removeSectionItem: (sectionId: string, itemId: string) => void;
  sectionsFor: (tab: TabKey, builtin: CatalogSection[]) => CatalogSection[];
  progress: { done: number; total: number; ratio: number };
};

const EngineContext = createContext<EngineContextValue | null>(null);

async function readPinHash(): Promise<string | null> {
  try {
    const secure = await SecureStore.getItemAsync('life-engine-pin');
    if (secure) return secure;
  } catch {
    /* web / unsupported */
  }
  return null;
}

async function writePinHash(hash: string) {
  try {
    await SecureStore.setItemAsync('life-engine-pin', hash);
  } catch {
    /* persist via AsyncStorage blob as fallback */
  }
}

export function EngineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EngineState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const pinHash = await readPinHash();
        if (!alive) return;
        if (raw) {
          const parsed = JSON.parse(raw) as EngineState;
          setState({
            ...emptyState(),
            ...parsed,
            customSections: parsed.customSections ?? [],
            extraItems: parsed.extraItems ?? {},
            secret: {
              ...emptyState().secret,
              ...parsed.secret,
              pinHash: pinHash ?? parsed.secret?.pinHash ?? null,
            },
          });
        } else if (pinHash) {
          setState((prev) => ({
            ...prev,
            secret: { ...prev.secret, pinHash },
          }));
        }
      } catch {
        /* keep defaults */
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [ready, state]);

  const mutate = useCallback((fn: (prev: EngineState) => EngineState) => {
    setState((prev) => fn(prev));
  }, []);

  const itemOf = useCallback(
    (id: string) => state.items[id] ?? defaultItem(),
    [state.items],
  );

  const patchItem = useCallback(
    (id: string, patch: Partial<ItemState>) => {
      mutate((prev) => {
        const current = prev.items[id] ?? defaultItem();
        return {
          ...prev,
          items: { ...prev.items, [id]: { ...current, ...patch } },
        };
      });
    },
    [mutate],
  );

  const value = useMemo<EngineContextValue>(() => {
    const guideIds = new Set(ALL_SECTIONS.filter((section) => section.mode === 'guide').map((section) => section.id));
    const tracked = [
      ...TRACKED_ITEMS,
      ...state.customSections.flatMap((section) => section.items),
      ...Object.entries(state.extraItems).flatMap(([sectionId, items]) => (guideIds.has(sectionId) ? [] : items)),
    ];
    const progressDone = tracked.filter((item) => state.items[item.id]?.status === 'done').length;
    return {
      ready,
      state,
      itemOf,
      setItemStatus: (id, status) => patchItem(id, { status }),
      setItemNotes: (id, notes) => patchItem(id, { notes }),
      addItemTag: (id, tag) => {
        const clean = tag.trim();
        if (!clean) return;
        const current = itemOf(id);
        if (current.extraTags.includes(clean)) return;
        patchItem(id, { extraTags: [...current.extraTags, clean] });
      },
      addHabit: (name) => {
        const clean = name.trim();
        if (!clean) return;
        const habit: Habit = {
          id: uid('habit'),
          name: clean,
          createdAt: new Date().toISOString(),
          completions: {},
        };
        mutate((prev) => ({ ...prev, habits: [...prev.habits, habit] }));
      },
      removeHabit: (id) => {
        mutate((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));
      },
      toggleHabitDay: (id, day = todayKey()) => {
        mutate((prev) => ({
          ...prev,
          habits: prev.habits.map((h) => {
            if (h.id !== id) return h;
            const next = { ...h.completions };
            if (next[day]) delete next[day];
            else next[day] = true;
            return { ...h, completions: next };
          }),
        }));
      },
      setPin: async (pin) => {
        const pinHash = hashPin(pin);
        await writePinHash(pinHash);
        mutate((prev) => ({ ...prev, secret: { ...prev.secret, pinHash } }));
      },
      verifyPin: async (pin) => {
        const incoming = hashPin(pin);
        if (state.secret.pinHash) return incoming === state.secret.pinHash;
        const stored = await readPinHash();
        return stored ? incoming === stored : false;
      },
      hasPin: Boolean(state.secret.pinHash),
      patchSecret: (patch) => {
        mutate((prev) => ({ ...prev, secret: { ...prev.secret, ...patch } }));
      },
      addJournal: (track, kind, text) => {
        const entry: JournalEntry = {
          id: uid('j'),
          atISO: new Date().toISOString(),
          kind,
          text: text.trim(),
        };
        mutate((prev) => {
          const key = track === 'thc' ? 'thcJournal' : 'nofapJournal';
          return {
            ...prev,
            secret: { ...prev.secret, [key]: [entry, ...prev.secret[key]] },
          };
        });
      },
      removeJournal: (track, id) => {
        mutate((prev) => {
          const key = track === 'thc' ? 'thcJournal' : 'nofapJournal';
          return {
            ...prev,
            secret: { ...prev.secret, [key]: prev.secret[key].filter((entry) => entry.id !== id) },
          };
        });
      },
      setTrackStart: (track, iso) => {
        const key = track === 'thc' ? 'thcStartISO' : 'nofapStartISO';
        mutate((prev) => ({ ...prev, secret: { ...prev.secret, [key]: iso } }));
      },
      relapse: (track) => {
        const now = new Date();
        const day = todayKey(now);
        const entry: JournalEntry = {
          id: uid('j'),
          atISO: now.toISOString(),
          kind: 'slip',
          text: 'Срыв',
        };
        const journalKey = track === 'thc' ? 'thcJournal' : 'nofapJournal';
        const startKey = track === 'thc' ? 'thcStartISO' : 'nofapStartISO';
        mutate((prev) => {
          const existing = prev.secret.calendar[day];
          return {
            ...prev,
            secret: {
              ...prev.secret,
              [startKey]: now.toISOString(),
              [journalKey]: [entry, ...prev.secret[journalKey]],
              calendar: {
                ...prev.secret.calendar,
                [day]: {
                  state: 'slip',
                  mood: existing?.mood ?? 2,
                  note: existing?.note?.trim() ? existing.note : 'Срыв',
                },
              },
            },
          };
        });
      },
      setCalendarDay: (day, value) => {
        mutate((prev) => ({
          ...prev,
          secret: {
            ...prev.secret,
            calendar: { ...prev.secret.calendar, [day]: value },
          },
        }));
      },
      addCustomSection: (tab, title, description, accent) => {
        const clean = title.trim();
        if (!clean) return;
        const section: CatalogSection = {
          id: uid('sec'),
          title: clean,
          description: description.trim() || undefined,
          accent,
          items: [],
          tab,
          custom: true,
        };
        mutate((prev) => ({ ...prev, customSections: [...prev.customSections, section] }));
      },
      removeCustomSection: (id) => {
        mutate((prev) => ({
          ...prev,
          customSections: prev.customSections.filter((section) => section.id !== id),
        }));
      },
      addSectionItem: (section, title, subtitle) => {
        const clean = title.trim();
        if (!clean) return;
        const item: CatalogItem = {
          id: uid('user'),
          title: clean,
          subtitle: subtitle?.trim() || undefined,
          tags: ['своё'],
          accent: section.accent,
          custom: true,
        };
        mutate((prev) => {
          if (section.custom) {
            return {
              ...prev,
              customSections: prev.customSections.map((entry) =>
                entry.id === section.id ? { ...entry, items: [...entry.items, item] } : entry,
              ),
            };
          }
          const extra = prev.extraItems[section.id] ?? [];
          return { ...prev, extraItems: { ...prev.extraItems, [section.id]: [...extra, item] } };
        });
      },
      removeSectionItem: (sectionId, itemId) => {
        mutate((prev) => ({
          ...prev,
          customSections: prev.customSections.map((section) =>
            section.id === sectionId
              ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
              : section,
          ),
          extraItems: {
            ...prev.extraItems,
            [sectionId]: (prev.extraItems[sectionId] ?? []).filter((item) => item.id !== itemId),
          },
        }));
      },
      sectionsFor: (tab, builtin) => {
        const extras = state.extraItems;
        const withExtras = builtin.map((section) => ({
          ...section,
          items: [...section.items, ...(extras[section.id] ?? [])],
        }));
        const custom = state.customSections.filter((section) => section.tab === tab);
        return [...withExtras, ...custom];
      },
      progress: {
        done: progressDone,
        total: tracked.length,
        ratio: tracked.length ? progressDone / tracked.length : 0,
      },
    };
  }, [itemOf, mutate, patchItem, ready, state]);

  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}

export function useEngine() {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error('useEngine must be used within EngineProvider');
  return ctx;
}
