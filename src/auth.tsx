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

import { ACCOUNTS_KEY, SESSION_KEY, hashPin, uid, userPassKey } from './lib';
import type { UserAccount } from './types';

type SignUpInput = {
  email: string;
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
  signOut: () => Promise<void>;
  hasPassword: (id: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readPass(id: string) {
  try {
    return await SecureStore.getItemAsync(userPassKey(id));
  } catch {
    return null;
  }
}

async function writePass(id: string, password: string) {
  try {
    await SecureStore.setItemAsync(userPassKey(id), hashPin(password));
  } catch {
    /* web / unsupported — account still works as local */
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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
        const list = raw ? (JSON.parse(raw) as UserAccount[]) : [];
        const sessionId = await readSession();
        if (!alive) return;
        setAccounts(Array.isArray(list) ? list : []);
        setUser(list.find((entry) => entry.id === sessionId) ?? null);
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

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      user,
      accounts,
      signUp: async ({ email, password, age, local }) => {
        const years = parseAge(age);
        const trimmed = email.trim();
        const normalized = local
          ? trimmed || `local-${uid('acc')}`
          : trimmed.toLowerCase();
        if (local && !trimmed) {
          throw new Error('Введи имя локального аккаунта');
        }
        if (!local) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
            throw new Error('Введи корректный e-mail');
          }
          if (!password || password.length < 4) {
            throw new Error('Пароль — минимум 4 символа');
          }
        }
        if (accounts.some((entry) => entry.email.toLowerCase() === normalized.toLowerCase())) {
          throw new Error('Такой аккаунт уже есть на этом устройстве');
        }
        const account: UserAccount = {
          id: uid('usr'),
          email: normalized,
          age: years,
          createdAt: new Date().toISOString(),
          local: Boolean(local) || !password,
        };
        if (password) await writePass(account.id, password);
        await persist([...accounts, account], account);
      },
      signIn: async (email, password) => {
        const normalized = email.trim().toLowerCase();
        const account = accounts.find((entry) => entry.email.toLowerCase() === normalized);
        if (!account) throw new Error('Аккаунт не найден');
        const stored = await readPass(account.id);
        if (stored && hashPin(password ?? '') !== stored) {
          throw new Error('Неверный пароль');
        }
        if (!stored && password) {
          throw new Error('У этого аккаунта нет пароля — выбери его в списке локальных');
        }
        await persist(accounts, account);
      },
      signInAccount: async (id, password) => {
        const account = accounts.find((entry) => entry.id === id);
        if (!account) throw new Error('Аккаунт не найден');
        const stored = await readPass(account.id);
        if (stored && hashPin(password ?? '') !== stored) {
          throw new Error('Неверный пароль');
        }
        await persist(accounts, account);
      },
      updateAge: async (age) => {
        if (!user) return;
        const years = parseAge(age);
        const next = { ...user, age: years };
        await persist(
          accounts.map((entry) => (entry.id === user.id ? next : entry)),
          next,
        );
      },
      signOut: async () => {
        await persist(accounts, null);
      },
      hasPassword: async (id) => Boolean(await readPass(id)),
    }),
    [accounts, persist, ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
