import { secretGate } from '../src/secret.ts';

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

assert(secretGate(false, false) === 'loading', 'engine still loading must not show create PIN');
assert(secretGate(false, true) === 'loading', 'stale hasPin during load must not unlock');
assert(secretGate(true, false) === 'create', 'first visit after hydrate may create a PIN');
assert(secretGate(true, true) === 'unlock', 'existing PIN after hydrate must unlock');

console.log('OK');
