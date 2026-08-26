import type { Ageable } from './types';

export type AgeTone = 'mind' | 'body';

export type AgeGate = {
  minAge?: number;
  recommend: boolean;
  priority: boolean;
};

export function ageGate(item: Ageable, age: number, sectionMinAge?: number): AgeGate {
  const minAge = item.minAge ?? sectionMinAge;
  const recommend = minAge != null && age < minAge;
  const priority =
    item.priorityMin != null &&
    age >= item.priorityMin &&
    age <= (item.priorityMax ?? 99);
  return { minAge, recommend, priority };
}

export function recommendLabel(minAge: number, tone: AgeTone = 'body') {
  if (tone === 'mind') return `ЖЕЛАТЕЛЬНО С ${minAge} ЛЕТ`;
  if (minAge >= 25) return `ЖЕЛАТЕЛЬНО / РЕКОМЕНДОВАНО С ${minAge} ЛЕТ`;
  return `ЖЕЛАТЕЛЬНО С ${minAge} ЛЕТ`;
}

export function priorityLabel() {
  return 'ВЫСШИЙ ПРИОРИТЕТ ДЛЯ ТВОЕГО ВОЗРАСТА';
}

export function ageDisclaimer(minAge: number, tone: AgeTone = 'body') {
  if (tone === 'mind') {
    return `💡 Примечание: Данный материал рекомендован к освоению с ${minAge} лет для глубокого понимания контекста и формирования зрелого мировоззрения, но доступен для чтения уже сейчас.`;
  }
  return `💡 Примечание: Данная практика рекомендована к освоению с ${minAge} лет для оптимального формирования организма и ЦНС, но доступна для ознакомления уже сейчас.`;
}

export function splitByAge<T extends Ageable>(items: T[], age: number, sectionMinAge?: number) {
  const priority: T[] = [];
  const current: T[] = [];
  for (const item of items) {
    const gate = ageGate(item, age, sectionMinAge);
    if (gate.priority) priority.push(item);
    else current.push(item);
  }
  return { priority, current, future: [] as T[] };
}
