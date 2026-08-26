import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const KEY = 'life-engine-llm-key';
const PROVIDER = 'life-engine-llm-provider';
const LEGACY_KEY = 'life-engine-openai-key';

export type LlmProvider = 'openai' | 'anthropic' | 'groq' | 'openrouter';
export type LlmProviderChoice = 'auto' | LlmProvider;

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
  if (!key) throw new Error('NO_KEY');
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
        max_tokens: 1400,
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
      ? 'llama-3.3-70b-versatile'
      : provider === 'openrouter'
        ? 'openai/gpt-4o-mini'
        : 'gpt-4o-mini';

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://lifeengine.app';
    headers['X-Title'] = 'Life Engine';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.55,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(await errorText(res));
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Пустой ответ модели');
  return text;
}

async function errorText(res: Response) {
  try {
    const body = await res.text();
    return `LLM ${res.status}: ${body.slice(0, 280)}`;
  } catch {
    return `LLM ${res.status}`;
  }
}
