'use client';

import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/**
 * `true` only after the client has hydrated; `false` during SSR and the first
 * client render.
 *
 * `useSyncExternalStore` renders the server snapshot (`false`) on the server AND
 * during hydration, then the client snapshot (`true`) — React special-cases this
 * so switching between the two does NOT trip a hydration mismatch. Gate any UI
 * that depends on browser-only state (localStorage auth token, saved language,
 * `window` size) on this flag: render the server-equal output first, then the
 * real state after mount. See the hydration-mismatch guidance in React's docs.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
