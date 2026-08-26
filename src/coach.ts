import { llmComplete, readLlmKey } from './llm';

const SYSTEM = `Ты — AI Discipline Coach в приложении Life Engine. Говоришь по-русски. Прямой, честный, без поддакивания и без токсичного унижения. Аргументируешь логикой и фактами. Темы: дисциплина, мотивация как побочный продукт действия, стратегия дня, твёрдость характера, тяга, срыв, стоицизм. Не продаёшь «позитив». Если пользователь ищет оправдание — режь его. Если держит удар — усиливай точность, не хвали за воздух. Короткие абзацы.`;

export { readLlmKey as readCoachKey, writeLlmKey as writeCoachKey } from './llm';

export async function coachReply(input: string, history: { role: 'user' | 'coach'; text: string }[]) {
  const key = await readLlmKey();
  if (!key) throw new Error('NO_KEY');

  const transcript = history
    .slice(-8)
    .map((m) => `${m.role === 'coach' ? 'Тренер' : 'Человек'}: ${m.text}`)
    .join('\n');
  return llmComplete(SYSTEM, `${transcript ? `${transcript}\n\n` : ''}Человек: ${input}`);
}

export const COACH_PRESETS = [
  'Как справиться с тягой?',
  'Дисциплина vs Мотивация',
  'Разбор стратегии на день',
];
