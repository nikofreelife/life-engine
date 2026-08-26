import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from './auth';
import { ALL_SECTIONS, TRACKED_ITEMS } from './data/catalog';
import {
  STORAGE_KEY,
  LEGACY_MIGRATED_KEY,
  defaultItem,
  emptyState,
  hashPin,
  normalizeHabit,
  todayKey,
  uid,
  userPinKey,
  userStorageKey,
} from './lib';
import type {
  CalendarDay,
  CatalogItem,
  CatalogSection,
  CoachMessage,
  EngineState,
  Habit,
  HabitSlot,
  ItemState,
  JournalEntry,
  JournalKind,
  SecretState,
  Status,
  TabKey,
  TrackKind,
  VideoInsight,
  VideoWatchStatus,
  AbstinenceTrack,
  BreathLog,
} from './types';
import { makeTrack, migrateTracks } from './tracks';

type EngineContextValue = {
  ready: boolean;
  state: EngineState;
  itemOf: (id: string) => ItemState;
  setItemStatus: (id: string, status: Status) => void;
  setItemNotes: (id: string, notes: string) => void;
  addItemTag: (id: string, tag: string) => void;
  addHabit: (name: string, extras?: { emoji?: string; slot?: HabitSlot }) => void;
  removeHabit: (id: string) => void;
  toggleHabitDay: (id: string, day?: string) => void;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  hasPin: boolean;
  patchSecret: (patch: Partial<SecretState>) => void;
  addJournal: (track: string, kind: JournalKind, text: string) => void;
  removeJournal: (track: string, id: string) => void;
  relapse: (track: string, reason: string) => void;
  setTrackStart: (track: string, iso: string) => void;
  addCustomTrack: (name: string, monthlyCost?: number) => void;
  removeTrack: (id: string) => void;
  restoreTemplate: (kind: TrackKind) => void;
  patchTrack: (id: string, patch: Partial<AbstinenceTrack>) => void;
  setVideoInsight: (id: string, value: VideoInsight) => void;
  setVideoWatch: (id: string, status: VideoWatchStatus) => void;
  addBreathLog: (log: BreathLog) => void;
  addCoachMessage: (role: 'user' | 'coach', text: string) => void;
  clearCoach: () => void;
  setCalendarDay: (day: string, value: CalendarDay) => void;
  addCustomSection: (tab: TabKey, title: string, description: string, accent: CatalogSection['accent']) => void;
  removeCustomSection: (id: string) => void;
  addSectionItem: (section: CatalogSection, title: string, subtitle?: string) => void;
  removeSectionItem: (sectionId: string, itemId: string) => void;
  sectionsFor: (tab: TabKey, builtin: CatalogSection[]) => CatalogSection[];
  progress: { done: number; total: number; ratio: number };
};

const EngineContext = createContext<EngineContextValue | null>(null);

function mapTrack(prev: EngineState, id: string, fn: (track: AbstinenceTrack) => AbstinenceTrack): EngineState {
  return {
    ...prev,
    secret: {
      ...prev.secret,
      tracks: (prev.secret.tracks ?? []).map((track) => (track.id === id ? fn(track) : track)),
    },
  };
}

function removeTrackFromState(prev: EngineState, id: string): EngineState {
  const tracks = prev.secret.tracks ?? [];
  const removed = tracks.find((track) => String(track.id) === String(id));
  if (!removed) return prev;
  return {
    ...prev,
    secret: {
      ...prev.secret,
      tracks: tracks.filter((track) => String(track.id) !== String(id)),
      customTracks:
        removed.kind === 'custom'
          ? (prev.secret.customTracks ?? []).filter((item) => String(item.id) !== String(id))
          : prev.secret.customTracks,
      ...(removed.kind === 'thc'
        ? { thcStartISO: null, thcDailyCost: 0, thcMonthlyCost: 0, thcJournal: [] }
        : {}),
      ...(removed.kind === 'nofap' ? { nofapStartISO: null, nofapJournal: [] } : {}),
    },
  };
}

function patchTrackJournal(
  prev: EngineState,
  track: string,
  fn: (list: JournalEntry[]) => JournalEntry[],
): EngineState {
  return mapTrack(prev, track, (item) => ({ ...item, journal: fn(item.journal) }));
}

function patchTrackStart(prev: EngineState, track: string, iso: string): EngineState {
  return mapTrack(prev, track, (item) => ({ ...item, startISO: iso }));
}

async function readPinHash(userId: string): Promise<string | null> {
  try {
    const keyed = await SecureStore.getItemAsync(userPinKey(userId));
    if (keyed) return keyed;
    const legacy = await SecureStore.getItemAsync('life-engine-pin');
    if (legacy) {
      await SecureStore.setItemAsync(userPinKey(userId), legacy);
      return legacy;
    }
  } catch {
    /* web / unsupported */
  }
  return null;
}

async function writePinHash(userId: string, hash: string) {
  try {
    await SecureStore.setItemAsync(userPinKey(userId), hash);
  } catch {
    /* persist via AsyncStorage blob as fallback */
  }
}

function hydrateState(parsed: EngineState, pinHash: string | null): EngineState {
  return {
    ...emptyState(),
    ...parsed,
    customSections: parsed.customSections ?? [],
    extraItems: parsed.extraItems ?? {},
    coachMessages: parsed.coachMessages ?? [],
    videoInsights: parsed.videoInsights ?? {},
    videoWatch: parsed.videoWatch ?? {},
    breathLogs: parsed.breathLogs ?? [],
    habits: (parsed.habits ?? emptyState().habits).map(normalizeHabit),
    secret: {
      ...emptyState().secret,
      ...parsed.secret,
      thcMonthlyCost: parsed.secret?.thcMonthlyCost
        ?? ((parsed.secret?.thcDailyCost ?? 0) > 0 ? parsed.secret.thcDailyCost * 30.437 : 0),
      customTracks: parsed.secret?.customTracks ?? [],
      pinHash: pinHash ?? parsed.secret?.pinHash ?? null,
      tracks: migrateTracks({
        ...emptyState().secret,
        ...parsed.secret,
        thcMonthlyCost: parsed.secret?.thcMonthlyCost
          ?? ((parsed.secret?.thcDailyCost ?? 0) > 0 ? parsed.secret.thcDailyCost * 30.437 : 0),
        customTracks: parsed.secret?.customTracks ?? [],
      }),
    },
  };
}

export function EngineProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [state, setState] = useState<EngineState>(emptyState);
  const [ready, setReady] = useState(false);
  const loadedId = useRef<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      loadedId.current = null;
      setState(emptyState());
      setReady(true);
      return;
    }
    let alive = true;
    loadedId.current = null;
    setReady(false);
    (async () => {
      try {
        let raw = await AsyncStorage.getItem(userStorageKey(user.id));
        if (!raw) {
          const migrated = await AsyncStorage.getItem(LEGACY_MIGRATED_KEY);
          if (!migrated) {
            raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
              await AsyncStorage.setItem(userStorageKey(user.id), raw);
              await AsyncStorage.setItem(LEGACY_MIGRATED_KEY, user.id);
            }
          }
        }
        const pinHash = await readPinHash(user.id);
        if (!alive) return;
        if (raw) {
          setState(hydrateState(JSON.parse(raw) as EngineState, pinHash));
        } else {
          const base = emptyState();
          setState({
            ...base,
            secret: { ...base.secret, pinHash, tracks: migrateTracks(base.secret) },
          });
        }
        loadedId.current = user.id;
      } catch {
        if (alive) {
          setState(emptyState());
          loadedId.current = user.id;
        }
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [authReady, user?.id]);

  useEffect(() => {
    if (!ready || !user || loadedId.current !== user.id) return;
    AsyncStorage.setItem(userStorageKey(user.id), JSON.stringify(state)).catch(() => undefined);
  }, [ready, state, user]);

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
    const guideIds = new Set(
      ALL_SECTIONS.filter((section) => section.mode === 'guide').map((section) => section.id),
    );
    const tracked = [
      ...TRACKED_ITEMS,
      ...state.customSections.filter((section) => section.mode !== 'guide').flatMap((section) => section.items),
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
      addHabit: (name, extras) => {
        const clean = name.trim();
        if (!clean) return;
        const habit: Habit = {
          id: uid('habit'),
          name: clean,
          emoji: extras?.emoji?.trim() || '✨',
          slot: extras?.slot ?? 'day',
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
        if (!user) return;
        const pinHash = hashPin(pin);
        await writePinHash(user.id, pinHash);
        mutate((prev) => ({ ...prev, secret: { ...prev.secret, pinHash } }));
      },
      verifyPin: async (pin) => {
        const incoming = hashPin(pin);
        if (state.secret.pinHash) return incoming === state.secret.pinHash;
        if (!user) return false;
        const stored = await readPinHash(user.id);
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
        mutate((prev) => patchTrackJournal(prev, track, (list) => [entry, ...list]));
      },
      removeJournal: (track, id) => {
        mutate((prev) => patchTrackJournal(prev, track, (list) => list.filter((entry) => entry.id !== id)));
      },
      setTrackStart: (track, iso) => {
        mutate((prev) => patchTrackStart(prev, track, iso));
      },
      relapse: (track, reason) => {
        const now = new Date();
        const day = todayKey(now);
        const why = reason.trim() || 'Срыв';
        const entry: JournalEntry = {
          id: uid('j'),
          atISO: now.toISOString(),
          kind: 'slip',
          text: why,
        };
        mutate((prev) => {
          const withJournal = patchTrackJournal(prev, track, (list) => [entry, ...list]);
          const withStart = patchTrackStart(withJournal, track, now.toISOString());
          const existing = withStart.secret.calendar[day];
          return {
            ...withStart,
            secret: {
              ...withStart.secret,
              calendar: {
                ...withStart.secret.calendar,
                [day]: {
                  state: 'slip',
                  mood: existing?.mood ?? 2,
                  note: why,
                },
              },
            },
          };
        });
      },
      addCustomTrack: (name, monthlyCost = 0) => {
        const clean = name.trim();
        if (!clean) return;
        const track = makeTrack('custom', { id: uid('trk'), name: clean, monthlyCost });
        mutate((prev) => ({
          ...prev,
          secret: { ...prev.secret, tracks: [...(prev.secret.tracks ?? []), track] },
        }));
      },
      removeTrack: (id) => {
        mutate((prev) => {
          const next = removeTrackFromState(prev, id);
          if (user && next !== prev) {
            void AsyncStorage.setItem(userStorageKey(user.id), JSON.stringify(next));
          }
          return next;
        });
      },
      restoreTemplate: (kind) => {
        mutate((prev) => {
          if ((prev.secret.tracks ?? []).some((track) => track.kind === kind && track.kind !== 'custom')) {
            return prev;
          }
          return {
            ...prev,
            secret: { ...prev.secret, tracks: [...(prev.secret.tracks ?? []), makeTrack(kind)] },
          };
        });
      },
      patchTrack: (id, patch) => {
        mutate((prev) => mapTrack(prev, id, (track) => ({ ...track, ...patch, id: track.id, kind: track.kind })));
      },
      setVideoInsight: (id, value) => {
        mutate((prev) => ({ ...prev, videoInsights: { ...prev.videoInsights, [id]: value } }));
      },
      setVideoWatch: (id, status) => {
        mutate((prev) => ({ ...prev, videoWatch: { ...(prev.videoWatch ?? {}), [id]: status } }));
      },
      addBreathLog: (log) => {
        mutate((prev) => ({ ...prev, breathLogs: [log, ...(prev.breathLogs ?? [])].slice(0, 200) }));
      },
      addCoachMessage: (role, text) => {
        const message: CoachMessage = {
          id: uid('msg'),
          role,
          text,
          atISO: new Date().toISOString(),
        };
        mutate((prev) => ({ ...prev, coachMessages: [...prev.coachMessages, message] }));
      },
      clearCoach: () => {
        mutate((prev) => ({ ...prev, coachMessages: [] }));
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
          mode: tab === 'knowledge' ? 'guide' : 'catalog',
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
  }, [itemOf, mutate, patchItem, ready, state, user]);

  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}

export function useEngine() {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error('useEngine must be used within EngineProvider');
  return ctx;
}
