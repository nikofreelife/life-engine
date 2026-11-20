import assert from 'node:assert/strict';
import { test } from 'node:test';

import { stripUnusedDefaultTracks, stripUnusedSeedHabits } from './lib.ts';
import type { AbstinenceTrack, Habit } from './types.ts';

function habit(name: string, completions: Record<string, boolean> = {}): Habit {
  return {
    id: `habit-${name}`,
    name,
    emoji: '✨',
    slot: 'morning',
    createdAt: '2026-01-01T00:00:00.000Z',
    completions,
  };
}

function track(kind: AbstinenceTrack['kind'], patch?: Partial<AbstinenceTrack>): AbstinenceTrack {
  return {
    id: `trk-${kind}`,
    kind,
    name: kind,
    startISO: null,
    monthlyCost: 0,
    journal: [],
    ...patch,
  };
}

const fiveBlankTemplates = [
  track('thc'),
  track('nofap'),
  track('nicotine'),
  track('alcohol'),
  track('sugar'),
];

test('first hydrate still strips the original unused three-habit seed set', () => {
  const seeds = [
    habit('Холодный душ'),
    habit('Чтение 20 минут'),
    habit('Движение / тренировка'),
  ];
  assert.deepEqual(stripUnusedSeedHabits(seeds), []);
});

test('a user-created cold-shower habit is kept after the one-shot seed wipe', () => {
  const created = [habit('Холодный душ')];
  assert.deepEqual(stripUnusedSeedHabits(created, true), created);
});

test('without the one-shot flag a lone unused seed-named habit is still wiped', () => {
  assert.deepEqual(stripUnusedSeedHabits([habit('Холодный душ')]), []);
});

test('habits with completions are never treated as unused seeds', () => {
  const used = [habit('Холодный душ', { '2026-01-02': true })];
  assert.deepEqual(stripUnusedSeedHabits(used), used);
});

test('first hydrate still strips the five blank auto-seeded trackers', () => {
  assert.deepEqual(stripUnusedDefaultTracks(fiveBlankTemplates), []);
});

test('restored blank templates survive later hydrates once seeds were cleared', () => {
  assert.deepEqual(stripUnusedDefaultTracks(fiveBlankTemplates, true), fiveBlankTemplates);
});

test('a started tracker is kept even on the first seed wipe', () => {
  const mixed = [
    track('thc', { startISO: '2026-01-01T00:00:00.000Z' }),
    track('nofap'),
    track('nicotine'),
    track('alcohol'),
    track('sugar'),
  ];
  assert.deepEqual(stripUnusedDefaultTracks(mixed), mixed);
});
