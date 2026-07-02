import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ru from './locales/ru.json';
import hy from './locales/hy.json';

/**
 * localStorage key used to persist the user's last-applied UI language across
 * reloads. Without this, every page load resets the shared i18next instance
 * to English even when the server has the user's preference saved on
 * `me.language` — which led to a noticeable "Russian → English on refresh"
 * bug in the marketplace.
 *
 * Persist only the resolved language code (`en` / `ru` / `hy`), never the
 * preference enum (`EN` / `RU`).
 *
 * Armenian (`hy`) is a client-only UI language: it lives entirely in i18next
 * and localStorage. The backend account preference enum is `EN` / `RU` only,
 * so the profile language picker never persists `hy` to the server.
 */
const LANG_STORAGE_KEY = 'orbiter:lang';

const SUPPORTED = ['en', 'ru', 'hy'] as const;
type Supported = (typeof SUPPORTED)[number];

function isSupported(value: string): value is Supported {
  return (SUPPORTED as readonly string[]).includes(value);
}

/** Browser UI language, narrowed to a supported code; null if none match. */
function detectBrowserLang(): Supported | null {
  if (typeof navigator === 'undefined') return null;
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of candidates) {
    const code = (raw ?? '').slice(0, 2).toLowerCase();
    if (isSupported(code)) return code;
  }
  return null;
}

/**
 * Client-side UI language resolution order:
 *   1. the user's explicit cached choice (localStorage),
 *   2. the browser/computer language (if we support it),
 *   3. the caller-provided fallback (Carizma passes `hy`).
 *
 * IMPORTANT: this reads localStorage/navigator, which only exist on the client.
 * It must NOT be used for the synchronous `initI18n` language (that would make
 * the server render one language and the client another → hydration mismatch).
 * Instead, apply it from a post-mount effect via `i18n.changeLanguage(...)`.
 */
export function resolveClientLang(fallback: Supported): Supported {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(LANG_STORAGE_KEY);
      if (raw && isSupported(raw)) return raw;
    } catch {
      /* storage may be unavailable (private mode, sandboxed iframe, etc.) */
    }
  }
  return detectBrowserLang() ?? fallback;
}

function writeCachedLang(lang: string): void {
  if (typeof localStorage === 'undefined') return;
  const normalized = lang.toLowerCase();
  if (!isSupported(normalized)) return;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, normalized);
  } catch {
    /* ignore quota / private-mode failures */
  }
}

let initialized = false;

/**
 * Initialize the shared i18next instance. Safe to call multiple times — only
 * the first call wires up the resources, the React bridge, and the
 * localStorage cache listener.
 *
 * `defaultLang` is the language used for the initial (SSR + first client) render.
 * It must be deterministic — the same on server and client — so we do NOT read
 * localStorage/navigator here. The remembered/browser language is applied later
 * from a client effect via `resolveClientLang` + `i18n.changeLanguage`.
 * Defaults to `en`; Carizma passes `hy` so the marketplace renders Armenian first.
 */
export function initI18n(defaultLang: Supported = 'en'): typeof i18n {
  if (initialized) return i18n;
  initialized = true;
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      hy: { translation: hy },
    },
    lng: defaultLang,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED as unknown as string[],
    interpolation: { escapeValue: false },
  });
  // Any subsequent `i18n.changeLanguage(...)` call (e.g. from the profile
  // language picker) writes back to localStorage so the next reload picks
  // it up.
  i18n.on('languageChanged', (lng: string) => writeCachedLang(lng));
  return i18n;
}

export { i18n };
