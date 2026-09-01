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

import { ACCOUNTS_KEY, SESSION_KEY, hashPin, uid, userPassKey } from './lib';
import type { UserAccount } from './types';

export function normalizeIdentity(value: string) {
  return value.trim().toLowerCase();
}

export function displayName(user: { name?: string; email?: string } | null) {
  const named = user?.name?.trim();
  if (named) return named;
  const email = user?.email?.trim() ?? '';
  if (email.includes('@')) return email.split('@')[0] || 'друг';
  return email || 'друг';
}

type SignUpInput = {
  email: string;
  name: string;
  password?: string;
  age: number;
  local?: boolean;
};

type AuthContextValue = {
  ready: boolean;
  user: UserAccount | null;
  accounts: UserAccount[];
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (email: string, password?: string) => Promise<void>;
  signInAccount: (id: string, password?: string) => Promise<void>;
  updateAge: (age: number) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateProfile: (input: { name: string; age: number }) => Promise<void>;
  signOut: () => Promise<void>;
  hasPassword: (id: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readPass(id: string) {
  try {
    const secure = await SecureStore.getItemAsync(userPassKey(id));
    if (secure) return secure;
  } catch {
    /* web */
  }
  return AsyncStorage.getItem(userPassKey(id));
}

async function writePass(id: string, password: string) {
  const hashed = hashPin(password);
  try {
    await SecureStore.setItemAsync(userPassKey(id), hashed);
  } catch {
    /* web / unsupported */
  }
  await AsyncStorage.setItem(userPassKey(id), hashed);
  return hashed;
}

async function loadAccounts(): Promise<UserAccount[]> {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as UserAccount[];
    if (!Array.isArray(list)) return [];
    return list.map((entry) => ({
      ...entry,
      email: normalizeIdentity(entry.email),
      name: (entry.name ?? '').trim() || displayName(entry),
    }));
  } catch {
    return [];
  }
}

async function readSession() {
  try {
    return await SecureStore.getItemAsync(SESSION_KEY);
  } catch {
    return AsyncStorage.getItem(SESSION_KEY);
  }
}

async function writeSession(id: string | null) {
  try {
    if (id) await SecureStore.setItemAsync(SESSION_KEY, id);
    else await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    if (id) await AsyncStorage.setItem(SESSION_KEY, id);
    else await AsyncStorage.removeItem(SESSION_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [ready, setReady] = useState(false);
  const userRef = useRef<UserAccount | null>(null);
  userRef.current = user;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
        const list = raw ? (JSON.parse(raw) as UserAccount[]) : [];
        const sessionId = await readSession();
        if (!alive) return;
        let dirty = false;
        const registry = Array.isArray(list)
          ? list.map((entry) => {
              const name = (entry.name ?? '').trim() || displayName(entry);
              if (name !== (entry.name ?? '')) dirty = true;
              return {
                ...entry,
                email: normalizeIdentity(entry.email),
                name,
              };
            })
          : [];
        if (dirty) {
          await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(registry));
        }
        setAccounts(registry);
        setUser(registry.find((entry) => entry.id === sessionId) ?? null);
      } catch {
        if (alive) {
          setAccounts([]);
          setUser(null);
        }
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback(async (list: UserAccount[], nextUser: UserAccount | null) => {
    setAccounts(list);
    setUser(nextUser);
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
    await writeSession(nextUser?.id ?? null);
  }, []);

  const parseAge = (age: number) => {
    const n = Math.round(Number(age));
    if (!Number.isFinite(n) || n < 10 || n > 99) {
      throw new Error('Укажи возраст от 10 до 99 лет');
    }
    return n;
  };

  const patchAccount = useCallback(
    async (patch: Partial<Pick<UserAccount, 'name' | 'age'>>) => {
      const current = userRef.current;
      if (!current) throw new Error('Нет аккаунта');
      const registry = await loadAccounts();
      const stored = registry.find((entry) => entry.id === current.id) ?? current;
      const next: UserAccount = { ...stored, ...patch };
      await persist(
        registry.map((entry) => (entry.id === current.id ? next : entry)),
        next,
      );
    },
    [persist],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      user,
      accounts,
      signUp: async ({ email, name, password, age, local }) => {
        const years = parseAge(age);
        const registry = await loadAccounts();
        const normalized = normalizeIdentity(email);
        const display = name.trim();
        if (!display) {
          throw new Error('Введи своё имя');
        }
        if (local && !normalized) {
          throw new Error('Введи имя локального аккаунта');
        }
        if (!normalized) {
          throw new Error('Введи e-mail или имя аккаунта');
        }
        if (!local) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
            throw new Error('Введи корректный e-mail');
          }
          if (!password || password.length < 4) {
            throw new Error('Пароль — минимум 4 символа');
          }
        }
        if (registry.some((entry) => normalizeIdentity(entry.email) === normalized)) {
          throw new Error('Такой аккаунт уже есть на этом устройстве');
        }
        const account: UserAccount = {
          id: uid('usr'),
          email: normalized,
          name: display,
          age: years,
          createdAt: new Date().toISOString(),
          local: Boolean(local) || !password,
        };
        if (password) {
          account.passHash = await writePass(account.id, password);
        }
        await persist([...registry, account], account);
      },
      signIn: async (email, password) => {
        const normalized = normalizeIdentity(email);
        const registry = await loadAccounts();
        const account = registry.find((entry) => normalizeIdentity(entry.email) === normalized);
        if (!account) throw new Error('Аккаунт не найден');
        const stored = (await readPass(account.id)) || account.passHash || null;
        if (stored) {
          if (!password) throw new Error('Введи пароль');
          if (hashPin(password) !== stored) throw new Error('Неверный пароль');
        }
        await persist(registry, account);
      },
      signInAccount: async (id, password) => {
        const registry = await loadAccounts();
        const account = registry.find((entry) => entry.id === id);
        if (!account) throw new Error('Аккаунт не найден');
        const stored = (await readPass(account.id)) || account.passHash || null;
        if (stored && password && hashPin(password) !== stored) {
          throw new Error('Неверный пароль');
        }
        await persist(registry, account);
      },
      updateAge: async (age) => {
        await patchAccount({ age: parseAge(age) });
      },
      updateName: async (name) => {
        const display = name.trim();
        if (!display) throw new Error('Введи своё имя');
        await patchAccount({ name: display });
      },
      updateProfile: async ({ name, age }) => {
        const display = name.trim();
        if (!display) throw new Error('Введи своё имя');
        await patchAccount({ name: display, age: parseAge(age) });
      },
      signOut: async () => {
        await persist(accounts, null);
      },
      hasPassword: async (id) => Boolean(await readPass(id)),
    }),
    [accounts, persist, ready, user, patchAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
