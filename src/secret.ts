export type SecretGate = 'loading' | 'create' | 'unlock';

/**
 * The vault PIN lives on engine state. Until that hydrate finishes,
 * hasPin is false because EngineProvider still holds emptyState().
 * Treating that as "no PIN yet" would show the create flow and let
 * anyone open the existing vault with a dummy PIN.
 */
export function secretGate(ready: boolean, hasPin: boolean): SecretGate {
  if (!ready) return 'loading';
  return hasPin ? 'unlock' : 'create';
}
