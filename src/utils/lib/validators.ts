/**
 * Field validators mirroring backend constraints. Each helper returns an
 * i18n KEY (not text) so the call site can pluck it from translations with
 * the right interpolation values. Returning `null` means "no error".
 *
 * Backend constraints come straight from the OpenAPI schemas — keep them
 * here in sync if the backend ever changes them.
 */

export interface ValidationError {
  /** i18n key, e.g. `'validation.required'`. */
  key: string;
  /** Interpolation values for the i18n key, e.g. `{ max: 255 }`. */
  values?: Record<string, string | number>;
}

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*$/;
// RFC 5322-lite — good enough alongside the type="email" browser hint.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// E.164: leading +, 8–15 digits.
const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

export function validateRequired(value: string): ValidationError | null {
  if (value.trim().length === 0) return { key: 'validation.required' };
  return null;
}

export function validateText(
  value: string,
  opts: { required?: boolean; min?: number; max: number },
): ValidationError | null {
  const trimmed = value.trim();
  if (opts.required && trimmed.length === 0) {
    return { key: 'validation.required' };
  }
  if (trimmed.length === 0) return null;
  if (opts.min != null && trimmed.length < opts.min) {
    return { key: 'validation.minLength', values: { min: opts.min } };
  }
  if (trimmed.length > opts.max) {
    return { key: 'validation.maxLength', values: { max: opts.max } };
  }
  return null;
}

export function validateSlug(
  value: string,
  opts: { required?: boolean; min?: number; max: number },
): ValidationError | null {
  const trimmed = value.trim();
  if (opts.required && trimmed.length === 0) {
    return { key: 'validation.required' };
  }
  if (trimmed.length === 0) return null;
  if (opts.min != null && trimmed.length < opts.min) {
    return { key: 'validation.minLength', values: { min: opts.min } };
  }
  if (trimmed.length > opts.max) {
    return { key: 'validation.maxLength', values: { max: opts.max } };
  }
  if (!SLUG_REGEX.test(trimmed)) {
    return { key: 'validation.slugFormat' };
  }
  return null;
}

/** Allow blank → null. When provided, the value must be a positive integer. */
export function validatePositiveInt(
  raw: string,
  opts: { min?: number; max?: number } = {},
): ValidationError | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (!/^\d+$/.test(trimmed)) {
    return { key: 'validation.integer' };
  }
  const n = Number(trimmed);
  const min = opts.min ?? 1;
  if (n < min) return { key: 'validation.min', values: { min } };
  if (opts.max != null && n > opts.max) {
    return { key: 'validation.max', values: { max: opts.max } };
  }
  return null;
}

/** Allow blank → null. When provided, the value must be ≥0. */
export function validateNonNegativeInt(
  raw: string,
  opts: { max?: number } = {},
): ValidationError | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (!/^\d+$/.test(trimmed)) {
    return { key: 'validation.integer' };
  }
  const n = Number(trimmed);
  if (n < 0) return { key: 'validation.min', values: { min: 0 } };
  if (opts.max != null && n > opts.max) {
    return { key: 'validation.max', values: { max: opts.max } };
  }
  return null;
}

export function validateEmail(
  value: string,
  opts: { required?: boolean } = {},
): ValidationError | null {
  const trimmed = value.trim();
  if (opts.required && trimmed.length === 0) {
    return { key: 'validation.required' };
  }
  if (trimmed.length === 0) return null;
  if (!EMAIL_REGEX.test(trimmed)) return { key: 'validation.email' };
  return null;
}

/** Strict E.164: starts with +, then 8–15 digits total. */
export function validatePhone(
  value: string,
  opts: { required?: boolean } = {},
): ValidationError | null {
  const trimmed = value.trim();
  if (opts.required && trimmed.length === 0) {
    return { key: 'validation.required' };
  }
  if (trimmed.length === 0) return null;
  if (!PHONE_REGEX.test(trimmed)) return { key: 'validation.phone' };
  return null;
}

/**
 * Validate a `YYYY-MM-DD` date. Returns `validation.dateFormat` for garbage,
 * `validation.dateInvalid` for "2026-02-31" style nonsense.
 */
export function validateDate(
  value: string,
  opts: { required?: boolean } = {},
): ValidationError | null {
  const trimmed = value.trim();
  if (opts.required && trimmed.length === 0) {
    return { key: 'validation.required' };
  }
  if (trimmed.length === 0) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { key: 'validation.dateFormat' };
  }
  const d = new Date(trimmed + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) {
    return { key: 'validation.dateInvalid' };
  }
  // 2026-02-31 parses to 2026-03-03 — catch that.
  if (d.toISOString().slice(0, 10) !== trimmed) {
    return { key: 'validation.dateInvalid' };
  }
  return null;
}

/** `endDate` must be ≥ `startDate` when both provided. */
export function validateDateRange(
  startDate: string,
  endDate: string,
): ValidationError | null {
  if (!startDate.trim() || !endDate.trim()) return null;
  if (endDate < startDate) {
    return { key: 'validation.endBeforeStart' };
  }
  return null;
}

export function isAnyError(...errors: Array<ValidationError | null>): boolean {
  return errors.some((e) => e !== null);
}
