import type { Ageable } from './types';

export type AgeGate = {
  locked: boolean;
  priority: boolean;
  minAge?: number;
};

export function ageGate(item: Ageable, age: number, sectionMinAge?: number): AgeGate {
  const minAge = item.minAge ?? sectionMinAge;
  const locked = minAge != null && age < minAge;
  const priority =
    !locked &&
    item.priorityMin != null &&
    age >= item.priorityMin &&
    age <= (item.priorityMax ?? 99);
  return { locked, priority, minAge };
}

export function lockLabel(minAge: number) {
  return `Locked: Доступно с ${minAge} лет`;
}

export function splitByAge<T extends Ageable>(items: T[], age: number, sectionMinAge?: number) {
  const priority: T[] = [];
  const current: T[] = [];
  const future: T[] = [];
  for (const item of items) {
    const gate = ageGate(item, age, sectionMinAge);
    if (gate.locked) future.push(item);
    else if (gate.priority) priority.push(item);
    else current.push(item);
  }
  return { priority, current, future };
}
