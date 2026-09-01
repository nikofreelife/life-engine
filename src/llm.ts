import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const KEY = 'life-engine-llm-key';
const PROVIDER = 'life-engine-llm-provider';
const LEGACY_KEY = 'life-engine-openai-key';

export type LlmProvider = 'openai' | 'anthropic' | 'groq' | 'openrouter';
export type LlmProviderChoice = 'auto' | LlmProvider;

const BROWSER_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent': 'LifeEngine/1.0 (iOS; Expo)',
  Referer: 'https://lifeengine.app/',
  Origin: 'https://lifeengine.app',
};

async function secretGet(name: string) {
  try {
    const value = await SecureStore.getItemAsync(name);
    if (value) return value;
  } catch {
    /* web */
  }
  return (await AsyncStorage.getItem(name)) ?? '';
}

async function secretSet(name: string, value: string) {
  try {
    if (value) await SecureStore.setItemAsync(name, value);
    else await SecureStore.deleteItemAsync(name);
  } catch {
    /* web */
  }
  if (value) await AsyncStorage.setItem(name, value);
  else await AsyncStorage.removeItem(name);
}

export async function readLlmKey() {
  const current = await secretGet(KEY);
  if (current) return current;
  const legacy = await secretGet(LEGACY_KEY);
  if (legacy) {
    await secretSet(KEY, legacy);
    return legacy;
  }
  return '';
}

export async function writeLlmKey(key: string) {
  await secretSet(KEY, key.trim());
}

export async function readLlmProvider(): Promise<LlmProviderChoice> {
  const value = await secretGet(PROVIDER);
  if (
    value === 'openai' ||
    value === 'anthropic' ||
    value === 'groq' ||
    value === 'openrouter' ||
    value === 'auto'
  ) {
    return value;
  }
  return 'auto';
}

export async function writeLlmProvider(provider: LlmProviderChoice) {
  await secretSet(PROVIDER, provider);
}

export function detectProvider(key: string): LlmProvider {
  const k = key.trim();
  if (k.startsWith('sk-ant-')) return 'anthropic';
  if (k.startsWith('gsk_')) return 'groq';
  if (k.startsWith('sk-or-')) return 'openrouter';
  return 'openai';
}

export function resolveProvider(key: string, choice: LlmProviderChoice): LlmProvider {
  return choice === 'auto' ? detectProvider(key) : choice;
}

export async function llmComplete(system: string, user: string): Promise<string> {
  const key = await readLlmKey();

  try {
    return await llm7Complete(system, user);
  } catch {
    /* public proxy — next */
  }

  try {
    return await puterComplete(system, user);
  } catch {
    /* next */
  }

  try {
    return await pollinationsComplete(system, user);
  } catch {
    /* next */
  }

  if (key) {
    try {
      return await keyedComplete(key, system, user);
    } catch {
      /* optional key only */
    }
  }

  throw new Error('NETWORK');
}

async function llm7Complete(system: string, user: string) {
  const run = () =>
    openaiCompatible(
      'https://api.llm7.io/v1/chat/completions',
      {
        ...BROWSER_HEADERS,
        Authorization: 'Bearer unused',
      },
      'default',
      system,
      user,
    );
  try {
    return await run();
  } catch (err) {
    if (!String(err).includes('429')) throw err;
    await new Promise((resolve) => setTimeout(resolve, 1300));
    return run();
  }
}

async function pollinationsComplete(system: string, user: string) {
  const prompt = `${system}\n\n${user}`.slice(0, 3500);
  const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`, {
    headers: { Accept: 'text/plain', ...BROWSER_HEADERS },
    signal: AbortSignal.timeout(18000),
  });
  if (!res.ok) throw new Error(await errorText(res));
  const text = (await res.text()).trim();
  if (!text || /cloudflare|turnstile|just a moment|attention required/i.test(text)) {
    throw new Error('blocked');
  }
  return text;
}

async function puterComplete(system: string, user: string) {
  const res = await fetch('https://api.puter.com/drivers/call', {
    method: 'POST',
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(18000),
    body: JSON.stringify({
      interface: 'puter-chat-completion',
      method: 'complete',
      args: {
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      },
    }),
  });
  if (!res.ok) throw new Error(await errorText(res));
  const json = (await res.json()) as
    | { result?: string | { message?: { content?: string } }; message?: { content?: string }; output?: string }
    | string;
  if (typeof json === 'string' && json.trim()) return json.trim();
  if (typeof json === 'object' && json) {
    if (typeof json.result === 'string' && json.result.trim()) return json.result.trim();
    const nested =
      (typeof json.result === 'object' ? json.result?.message?.content : undefined) ??
      json.message?.content ??
      json.output;
    if (nested?.trim()) return nested.trim();
  }
  throw new Error('Пустой ответ');
}

async function keyedComplete(key: string, system: string, user: string) {
  const choice = await readLlmProvider();
  const provider = resolveProvider(key, choice);

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 500,
        temperature: 0.7,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) throw new Error(await errorText(res));
    const json = (await res.json()) as { content?: Array<{ text?: string }> };
    const text = json.content?.map((block) => block.text ?? '').join('\n').trim();
    if (!text) throw new Error('Пустой ответ Anthropic');
    return text;
  }

  const url =
    provider === 'groq'
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : provider === 'openrouter'
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
  const model =
    provider === 'groq'
      ? 'llama-3.1-8b-instant'
      : provider === 'openrouter'
        ? 'openrouter/free'
        : 'gpt-4o-mini';
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://lifeengine.app';
    headers['X-Title'] = 'Life Engine';
  }
  return openaiCompatible(url, headers, model, system, user);
}

const SAMPLING = {
  temperature: 0.7,
  max_tokens: 500,
  frequency_penalty: 0.5,
  presence_penalty: 0.3,
};

async function openaiCompatible(
  url: string,
  headers: Record<string, string>,
  model: string,
  system: string,
  user: string,
) {
  const payload = {
    model,
    messages: [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user },
    ],
  };
  const attempt = async (extra: Record<string, number>) => {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(18000),
      body: JSON.stringify({ ...payload, ...extra }),
    });
    if (!res.ok) throw new Error(await errorText(res));
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> } | string;
    if (typeof json === 'string' && json.trim()) return json.trim();
    const text = typeof json === 'object' ? json.choices?.[0]?.message?.content?.trim() : '';
    if (!text) throw new Error('Пустой ответ модели');
    return text;
  };
  try {
    return await attempt(SAMPLING);
  } catch (err) {
    if (!String(err).includes('422')) throw err;
    return attempt({});
  }
}

async function errorText(res: Response) {
  try {
    const body = await res.text();
    return `LLM ${res.status}: ${body.slice(0, 280)}`;
  } catch {
    return `LLM ${res.status}`;
  }
}
