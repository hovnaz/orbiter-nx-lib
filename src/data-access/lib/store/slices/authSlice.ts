import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Organization, RoleKey, User } from '#types';
import {
  ACCESS_TOKEN_KEY,
  EMAIL_KEY,
  REFRESH_TOKEN_KEY,
} from '../../api/client';

export const CURRENT_ROLE_KEY = 'orbiter:currentRole';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  email: string | null;
  user: User | null;
  currentOrg: Organization | null;
  currentRole: RoleKey | null;
}

/**
 * Read a value from either storage (localStorage wins). Lets us survive a
 * page reload regardless of which storage was used at login time.
 */
function read(key: string): string | null {
  if (globalThis.window === undefined) return null;
  return (
    globalThis.localStorage.getItem(key) ??
    globalThis.sessionStorage.getItem(key)
  );
}

/**
 * Write a value into one storage *and* remove it from the other, so we
 * never end up with stale tokens in both places after the user toggles
 * Remember me between sessions.
 */
function writeTo(
  storage: Storage | null,
  key: string,
  value: string | null,
): void {
  if (globalThis.window === undefined) return;
  const target = storage ?? globalThis.localStorage;
  const other =
    target === globalThis.localStorage
      ? globalThis.sessionStorage
      : globalThis.localStorage;
  other.removeItem(key);
  if (value === null) {
    target.removeItem(key);
  } else {
    target.setItem(key, value);
  }
}

/** Update value in whichever storage already holds it; default to localStorage. */
function writeWhereExists(key: string, value: string | null): void {
  if (globalThis.window === undefined) return;
  const storage = globalThis.localStorage.getItem(key) !== null
    ? globalThis.localStorage
    : globalThis.sessionStorage.getItem(key) !== null
    ? globalThis.sessionStorage
    : globalThis.localStorage;
  writeTo(storage, key, value);
}

function clearEverywhere(key: string): void {
  if (globalThis.window === undefined) return;
  globalThis.localStorage.removeItem(key);
  globalThis.sessionStorage.removeItem(key);
}

const initialState: AuthState = {
  accessToken: read(ACCESS_TOKEN_KEY),
  refreshToken: read(REFRESH_TOKEN_KEY),
  email: read(EMAIL_KEY),
  user: null,
  currentOrg: null,
  currentRole: read(CURRENT_ROLE_KEY) as RoleKey | null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        email: string;
        /**
         * When true, persist tokens to `localStorage` so the user stays
         * signed in across browser restarts. When false (default), use
         * `sessionStorage` — tokens evaporate the moment the tab closes,
         * and the refresh token never lands in long-term storage.
         */
         rememberMe?: boolean;
      }>,
    ) {
      const remember = action.payload.rememberMe ?? false;
      const storage =
        globalThis.window === undefined
          ? null
          : remember
          ? globalThis.localStorage
          : globalThis.sessionStorage;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.email = action.payload.email;
      writeTo(storage, ACCESS_TOKEN_KEY, action.payload.accessToken);
      writeTo(storage, REFRESH_TOKEN_KEY, action.payload.refreshToken);
      writeTo(storage, EMAIL_KEY, action.payload.email);
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.email = action.payload.email;
      writeWhereExists(EMAIL_KEY, action.payload.email);
    },
    /**
     * Shallow-merge a partial update into the current user. Used for optimistic
     * self-service preference changes (theme/language) so every component that
     * reads `selectUser` reflects the change immediately — the store is the
     * single source of truth for the authenticated user (the `/me` query is
     * fetched once by RequireOrg and pushed here via `setUser`).
     */
    patchUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setTokens(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken?: string }>,
    ) {
      state.accessToken = action.payload.accessToken;
      writeWhereExists(ACCESS_TOKEN_KEY, action.payload.accessToken);
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        writeWhereExists(REFRESH_TOKEN_KEY, action.payload.refreshToken);
      }
    },
    setCurrentOrg(state, action: PayloadAction<Organization | null>) {
      state.currentOrg = action.payload;
    },
    setCurrentRole(state, action: PayloadAction<RoleKey | null>) {
      state.currentRole = action.payload;
      if (globalThis.window !== undefined) {
        if (action.payload) {
          globalThis.localStorage.setItem(CURRENT_ROLE_KEY, action.payload);
        } else {
          globalThis.localStorage.removeItem(CURRENT_ROLE_KEY);
        }
      }
    },
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.email = null;
      state.user = null;
      state.currentOrg = null;
      state.currentRole = null;
      clearEverywhere(ACCESS_TOKEN_KEY);
      clearEverywhere(REFRESH_TOKEN_KEY);
      clearEverywhere(EMAIL_KEY);
      clearEverywhere(CURRENT_ROLE_KEY);
    },
  },
});

export const {
  setAuth,
  setUser,
  patchUser,
  setTokens,
  setCurrentOrg,
  setCurrentRole,
  logout,
} = authSlice.actions;

export const selectAccessToken = (state: { auth: AuthState }) =>
  state.auth.accessToken;
export const selectRefreshToken = (state: { auth: AuthState }) =>
  state.auth.refreshToken;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectUserEmail = (state: { auth: AuthState }) => state.auth.email;
export const selectCurrentOrg = (state: { auth: AuthState }) =>
  state.auth.currentOrg;
export const selectCurrentRole = (state: { auth: AuthState }) =>
  state.auth.currentRole;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  Boolean(state.auth.accessToken);

// Stable empty-array reference so the input selector returns the SAME value
// when the user has no permissions. Returning a fresh `[]` each call broke
// `createSelector` memoisation — it recomputed a new `Set` on every render
// (Redux's "input selector returned a different result" warning), which
// churned re-renders in every `usePermissions` consumer (and contributed to
// the editor scroll-jump).
const EMPTY_PERMISSIONS: readonly string[] = Object.freeze([]);

export const selectPermissions = (state: { auth: AuthState }) =>
  state.auth.user?.permissions ?? EMPTY_PERMISSIONS;

export const selectPermissionSet = createSelector(
  selectPermissions,
  (perms): ReadonlySet<string> => new Set(perms),
);
