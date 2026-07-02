import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { RefreshResponse } from '#types';
import { API_VERSION } from './version';

export const ACCESS_TOKEN_KEY = 'orbiter:accessToken';
export const REFRESH_TOKEN_KEY = 'orbiter:refreshToken';
export const EMAIL_KEY = 'orbiter:email';

/**
 * Environment default for the API host: the local backend on dev/test stands,
 * the Orbiter production API on prod. Overridable per-service via the
 * NEXT_PUBLIC_* env vars below (e.g. if Carizma and Orbiter split hosts).
 */
const DEFAULT_API_BASE_URL: string =
  process.env.NODE_ENV === 'production'
    ? 'https://api.orbiter.am/api'
    : 'http://localhost:8080/api';

export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? DEFAULT_API_BASE_URL;

/**
 * Base URL for endpoints that live on the Orbiter backend (auth/token, user
 * preferences like language, organizations). Auth (login / register / change
 * password) and language changes are routed here via ORBITER_PATTERNS below.
 * Defaults to the same env-based host (localhost:8080 on dev, api.orbiter.am on
 * prod); override with NEXT_PUBLIC_ORBITER_API_BASE_URL when the hosts differ.
 */
export const ORBITER_API_BASE_URL: string =
  process.env.NEXT_PUBLIC_ORBITER_API_BASE_URL?.replace(/\/$/, '') ??
  DEFAULT_API_BASE_URL;

/**
 * Paths that must be routed to the Orbiter backend (ORBITER_API_BASE_URL).
 * Auth/token, organizations and user-self preferences (theme, language) are
 * owned by Orbiter; everything else goes to the default (Carizma) backend.
 */
const ORBITER_PATTERNS: RegExp[] = [
  /\/auth\//,
  /\/organizations\b/,
  /\/users\/[^/]+\/theme\b/,
  /\/users\/[^/]+\/language\b/,
];

function baseUrlFor(url: string | undefined): string {
  return url && ORBITER_PATTERNS.some((re) => re.test(url))
    ? ORBITER_API_BASE_URL
    : API_BASE_URL;
}

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/new-password',
  '/auth/register',
  '/auth/confirm-registration',
  // Federated sign-in (both the authorize-URL build and the code exchange):
  // unauthenticated, and a 401 here means bad state/code — never trigger a
  // token refresh or attach a stale Bearer.
  '/auth/oauth/',
];

/**
 * Endpoints that require an authenticated user but are NOT scoped to an
 * organization (no X-Organization-Id header). Anything not listed here and
 * not in PUBLIC_PATHS is treated as org-scoped.
 */
const ORG_AGNOSTIC_PATTERNS: RegExp[] = [
  /\/auth\/forgot-password\b/,
  /\/auth\/confirm-reset\b/,
  // Self-service product access (e.g. /auth/access/carizma) is per-user.
  /\/auth\/access\//,
  /\/organizations\b/,
  // user-self preference endpoints — backend checks userId == authenticated user
  /\/users\/[^/]+\/language\b/,
  /\/users\/[^/]+\/theme\b/,
  // Google Calendar integration is per-user, not org-scoped.
  /\/integrations\/google\b/,
  // Calendar module: regular user-owned calendars don't carry the org header.
  // Bookable (mentor) calendars and their bookings/lock-material endpoints
  // ARE org-scoped, so they must NOT match this list.
  /\/calendars(?!\/bookable\b|\/bookings\b|\/slots\/[^/]+\/(bookings|lock-material)\b)/,
  /\/calendar-colors\b/,
  // Carizma is a consumer-facing marketplace — never org-scoped.
  /\/carizma\//,
];

function isPublicUrl(url: string | undefined): boolean {
  if (!url) return false;
  return PUBLIC_PATHS.some((p) => url.includes(p));
}

function isOrgAgnostic(url: string | undefined): boolean {
  if (!url) return false;
  return ORG_AGNOSTIC_PATTERNS.some((re) => re.test(url));
}

function needsOrgHeader(url: string | undefined): boolean {
  if (!url) return false;
  if (isPublicUrl(url)) return false;
  if (isOrgAgnostic(url)) return false;
  return true;
}

export type TokenProvider = () => string | null;
export type RefreshTokenProvider = () => string | null;
export type EmailProvider = () => string | null;
export type OrgIdProvider = () => string | null;
export type RefreshSuccessHandler = (data: RefreshResponse) => void;
export type UnauthorizedHandler = () => void;

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

export interface ApiClientHandlers {
  getToken: TokenProvider;
  getRefreshToken: RefreshTokenProvider;
  getEmail: EmailProvider;
  getOrgId: OrgIdProvider;
  onRefreshSuccess: RefreshSuccessHandler;
  onUnauthorized: UnauthorizedHandler;
}

export function createApiClient(handlers: ApiClientHandlers): AxiosInstance {
  const {
    getToken,
    getRefreshToken,
    getEmail,
    getOrgId,
    onRefreshSuccess,
    onUnauthorized,
  } = handlers;
  const instance = axios.create({ baseURL: API_BASE_URL });
  let refreshInflight: Promise<RefreshResponse | null> | null = null;

  instance.interceptors.request.use((config) => {
    config.baseURL = baseUrlFor(config.url);
    if (isPublicUrl(config.url)) return config;

    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (needsOrgHeader(config.url)) {
      const orgId = getOrgId();
      if (orgId) config.headers['X-Organization-Id'] = orgId;
    }

    return config;
  });

  async function performRefresh(): Promise<RefreshResponse | null> {
    const refreshToken = getRefreshToken();
    const email = getEmail();
    if (!refreshToken || !email) return null;
    try {
      const res = await axios.post<RefreshResponse>(
        `${ORBITER_API_BASE_URL}/${API_VERSION}/auth/refresh`,
        { email, refreshToken },
      );
      onRefreshSuccess(res.data);
      return res.data;
    } catch {
      return null;
    }
  }

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error?.config as RetryableConfig | undefined;
      const status = error?.response?.status;

      if (status !== 401 || !original || isPublicUrl(original.url) || original._retried) {
        throw error;
      }

      original._retried = true;
      refreshInflight ??= performRefresh().finally(() => {
        refreshInflight = null;
      });

      const refreshed = await refreshInflight;
      if (!refreshed?.accessToken) {
        onUnauthorized();
        throw error;
      }

      original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
      return instance.request(original);
    },
  );

  return instance;
}
