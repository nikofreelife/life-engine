import { KNOWLEDGE_FACTORS } from './data/knowledge';
import { llmComplete } from './llm';

const FIGHT_RE =
  /бокс|ударк|ударн|спарринг|кикбокс|муай|mma|юфс|уличн\w*\s+бо[йе]|техник\w+\s+удар|груш[аи]|каратэ|тхэквондо|борцов/i;

export function coachAddress(user: { name?: string | null } | null | undefined) {
  const named = user?.name?.trim();
  return named || 'бро';
}

function stripMd(text: string) {
  return text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}

function factorBlurb(id: string, skipHeadings?: RegExp) {
  const factor = KNOWLEDGE_FACTORS.find((item) => item.id === id);
  if (!factor) return '';
  const parts = factor.sections
    .filter((section) => !(skipHeadings && skipHeadings.test(section.heading || '')))
    .map((section) => {
      const head = section.heading ? `${section.heading}. ` : '';
      return stripMd(head + section.body);
    });
  return `${factor.title}: ${parts.join(' ')}`;
}

function knowledgeContext(userText: string) {
  const fight = FIGHT_RE.test(userText);
  const blocks = [
    `ТЕРМИНЫ — НЕ ПУТАТЬ:
Профилактор / доска Евминова — наклонная доска для гравитационного вытяжения позвоночника. Цель: разгрузка дисков, мягкая тракция, работа глубоких мышц спины в разгруженном положении, осанка. Это НЕ тренажёр для ударов, НЕ груша, НЕ стойка для бокса и НЕ «ударка». Если спрашивают про Евминова — отвечай как спортивный физиолог про позвоночник и тракцию.
Метод Вима Хофа — циклы дыхания (глубокие вдохи / гипервентиляция + задержка) плюс дозированный холод. Не путать с ударной техникой.`,
    factorBlurb('needs'),
    factorBlurb('food'),
    factorBlurb('cold'),
    factorBlurb('sleep'),
    factorBlurb('spirit'),
    fight
      ? factorBlurb('body')
      : factorBlurb('body', /боевые/i) +
        ' Боевые искусства и ударную технику НЕ поднимай, пока пользователь сам об этом не спросил.',
  ].filter(Boolean);
  let text = `БАЗА ЗНАНИЙ LIFE ENGINE (физиология, гормоны, спорт). Опирайся на неё, не выдумывай термины:\n${blocks.join('\n')}`;
  if (text.length > 5200) text = `${text.slice(0, 5200)}…`;
  return text;
}

export function coachSystem(name: string) {
  const who = name.trim() || 'бро';
  return `Ты — экспертный, умный и прямой собеседник, опытный старший брат и спортивный физиолог. Пользователя зовут ${who}.

ТВОИ ЖЕЛЕЗНЫЕ ПРАВИЛА:
1. ФАКТЫ И ТОЧНОСТЬ: Отвечай строго по сути заданного вопроса. Если пользователь спрашивает про конкретный тренажер (например, Профилактор/Доска Евминова, Вим Хоф, биомеханика), давай ТОЧНЫЙ физиологический и спортивный ответ. НЕ ВЫДУМЫВАЙ и не путай термины!
2. НИКАКИХ ПРИВЯЗОК К УДАРКЕ БЕЗ ПОВОДА: Запрещено переводить тему разговора на бокс, технику ударов или уличный бой, если пользователь об этом не спрашивал.
3. РАЗГОВОР НА РАВНЫХ: Общайся как ровный бро, на "ты", используй живой сленг. Без душного морализаторства, без лекций про "дисциплину" и фальшивой вежливости.
4. КРАТКОСТЬ И ЛОГИКА: Отвечай четко, емко, по делу. Если не уверен в конкретном термине — не гадай, а отвечай с точки зрения логики и науки.

Никогда не пиши заглушки вроде «имя», «userName» или \${userName}. Обращайся «${who}», но не в каждом предложении.
Отвечай по-русски.`;
}

export { readLlmKey as readCoachKey, writeLlmKey as writeCoachKey } from './llm';

export async function coachReply(
  name: string,
  input: string,
  history: { role: 'user' | 'coach'; text: string }[],
) {
  const who = name.trim() || 'бро';
  const transcript = history
    .slice(-6)
    .map((m) => `${m.role === 'coach' ? 'Коуч' : who}: ${m.text}`)
    .join('\n');
  const prompt = `${knowledgeContext(input)}\n\n${transcript ? `${transcript}\n\n` : ''}${who}: ${input}\n\nКоуч:`;
  return llmComplete(coachSystem(who), prompt);
}

export const COACH_PRESETS = [
  'Как работать на доске Евминова?',
  'Гормоны и сон — коротко',
  'Вим Хоф: дыхание и холод',
];
