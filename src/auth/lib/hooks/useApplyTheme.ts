import { useEffect } from 'react';
import { selectUser, useAppSelector } from '#data-access';
import type { ThemePreference } from '#types';

const SYSTEM_QUERY = '(prefers-color-scheme: dark)';
const THEME_CACHE_KEY = 'orbiter:theme';

type EffectiveTheme = 'light' | 'dark' | 'dark-blue';

function applyDataTheme(effective: EffectiveTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = effective;
  try {
    localStorage.setItem(THEME_CACHE_KEY, effective);
  } catch {
    /* storage may be unavailable (private mode, etc.) */
  }
}

/**
 * Last *resolved* theme persisted to localStorage by the bootstrap inline
 * script in `index.html` and by `applyDataTheme` above. Used as the source
 * of truth between page loads and during the gap when `me` hasn't loaded
 * yet — without this fallback we'd reset to SYSTEM (which flips to dark on
 * many machines) every time `meQuery.data` is undefined.
 */
function readCachedEffective(): EffectiveTheme | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(THEME_CACHE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'dark-blue') return raw;
  } catch {
    /* ignore */
  }
  return null;
}

function systemEffective(): EffectiveTheme {
  if (typeof globalThis.matchMedia === 'undefined') return 'light';
  return globalThis.matchMedia(SYSTEM_QUERY).matches ? 'dark' : 'light';
}

function effectiveOf(pref: ThemePreference): EffectiveTheme {
  if (pref === 'LIGHT') return 'light';
  if (pref === 'DARK') return 'dark';
  if (pref === 'DARK_BLUE') return 'dark-blue';
  return systemEffective();
}

/**
 * Reads the user's theme preference from `GET /v1/auth/me` and writes
 * `data-theme="light|dark|dark-blue"` on `<html>`. For SYSTEM, also subscribes
 * to `prefers-color-scheme` changes so the UI follows the OS in real time.
 *
 * Fallback chain (top wins) — designed so the theme never flips on login,
 * backend errors, or the brief window before /me resolves:
 *   1. `me.theme` from the server (when authenticated and loaded)
 *   2. last resolved theme cached in `localStorage['orbiter:theme']`
 *   3. system `prefers-color-scheme`
 */
export function useApplyTheme(): void {
  // Read the authenticated user's theme from the store (populated once by
  // RequireOrg's `/me`). No own `/me` request — avoids a duplicate fetch and
  // a spurious pre-login call. Falls back to the cached/system theme while no
  // user is loaded (login screen, before /me resolves).
  const serverPref = useAppSelector(selectUser)?.theme;
  // The hook re-runs on every render; we *do* need an effect because we
  // also subscribe to system theme changes. Encode the resolved value as
  // a primitive so the effect deps are stable.
  const resolved: EffectiveTheme = serverPref
    ? effectiveOf(serverPref)
    : (readCachedEffective() ?? systemEffective());
  // We follow OS preference only when the user explicitly opted in
  // (server pref === 'SYSTEM'). Cached fallback is a sticky resolved value.
  const followSystem = serverPref === 'SYSTEM';

  useEffect(() => {
    applyDataTheme(resolved);
    if (!followSystem) return undefined;
    if (typeof globalThis.matchMedia === 'undefined') return undefined;
    const mq = globalThis.matchMedia(SYSTEM_QUERY);
    const handler = (e: MediaQueryListEvent) =>
      applyDataTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [resolved, followSystem]);
}
