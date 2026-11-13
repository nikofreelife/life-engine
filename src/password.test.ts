import assert from 'node:assert/strict';
import { test } from 'node:test';

import { assertPassword, hashPin } from './lib.ts';

test('local accounts without a stored hash sign in without a password', () => {
  assert.doesNotThrow(() => assertPassword(null));
  assert.doesNotThrow(() => assertPassword(undefined, ''));
});

test('password accounts reject a missing password', () => {
  const stored = hashPin('secret1');
  assert.throws(() => assertPassword(stored), { message: 'Введи пароль' });
  assert.throws(() => assertPassword(stored, ''), { message: 'Введи пароль' });
});

test('password accounts reject the wrong password', () => {
  const stored = hashPin('secret1');
  assert.throws(() => assertPassword(stored, 'secret2'), { message: 'Неверный пароль' });
});

test('password accounts accept the matching password', () => {
  const stored = hashPin('secret1');
  assert.doesNotThrow(() => assertPassword(stored, 'secret1'));
});
