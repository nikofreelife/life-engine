import assert from 'node:assert/strict';
import test from 'node:test';

import { canPersistUserBlob, normalizeHabitList } from './lib.ts';

test('canPersistUserBlob is false after a failed hydrate (loadedId unset)', () => {
  const userId = 'usr-1';
  const loadedId = null;
  assert.equal(canPersistUserBlob(true, userId, loadedId), false);
});

test('canPersistUserBlob is true only after a successful load for that user', () => {
  assert.equal(canPersistUserBlob(true, 'usr-1', 'usr-1'), true);
  assert.equal(canPersistUserBlob(false, 'usr-1', 'usr-1'), false);
  assert.equal(canPersistUserBlob(true, 'usr-1', 'usr-2'), false);
  assert.equal(canPersistUserBlob(true, null, 'usr-1'), false);
});

test('normalizeHabitList does not throw on a non-array habits field', () => {
  assert.deepEqual(normalizeHabitList(undefined), []);
  assert.deepEqual(normalizeHabitList(null), []);
  assert.deepEqual(normalizeHabitList({}), []);
  const habits = normalizeHabitList([
    { id: 'habit-1', name: 'Журнал', completions: { '2026-11-24': true } },
  ]);
  assert.equal(habits.length, 1);
  assert.equal(habits[0].name, 'Журнал');
});
