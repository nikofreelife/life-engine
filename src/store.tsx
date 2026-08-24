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

import { ALL_ITEMS } from './data/catalog';
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
  EngineState,
  Habit,
  ItemState,
  JournalEntry,
  JournalKind,
  SecretState,
  Status,
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
  setCalendarDay: (day: string, value: CalendarDay) => void;
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
    const progressDone = ALL_ITEMS.filter((item) => state.items[item.id]?.status === 'done').length;
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
      setCalendarDay: (day, value) => {
        mutate((prev) => ({
          ...prev,
          secret: {
            ...prev.secret,
            calendar: { ...prev.secret.calendar, [day]: value },
          },
        }));
      },
      progress: {
        done: progressDone,
        total: ALL_ITEMS.length,
        ratio: ALL_ITEMS.length ? progressDone / ALL_ITEMS.length : 0,
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
