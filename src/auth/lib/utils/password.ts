/**
 * Minimal translate function. Intentionally NOT i18next's `TFunction` — typing
 * the public helper against `TFunction` would bind every caller to one i18next
 * copy's exact type identity, which breaks across local-linked repos that resolve
 * their own i18next (e.g. orbiter-nx-carizma). The helper only does key→string
 * lookups, so a structural `(key: string) => string` is sufficient and any
 * i18next `t` satisfies it.
 */
export type TranslateFn = (key: string) => string;

/** Cognito policy: ≥8 chars, ≥1 lowercase, ≥1 uppercase, ≥1 digit. */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export interface PasswordIssue {
  tooShort: boolean;
  noLower: boolean;
  noUpper: boolean;
  noDigit: boolean;
}

export function checkPassword(value: string): PasswordIssue | null {
  if (PASSWORD_REGEX.test(value)) return null;
  return {
    tooShort: value.length < 8,
    noLower: !/[a-z]/.test(value),
    noUpper: !/[A-Z]/.test(value),
    noDigit: !/\d/.test(value),
  };
}

export function describePasswordIssue(
  issue: PasswordIssue,
  t: TranslateFn,
): string {
  const parts: string[] = [];
  if (issue.tooShort) parts.push(t('auth.passwordIssue.tooShort'));
  if (issue.noLower) parts.push(t('auth.passwordIssue.noLower'));
  if (issue.noUpper) parts.push(t('auth.passwordIssue.noUpper'));
  if (issue.noDigit) parts.push(t('auth.passwordIssue.noDigit'));
  return t('auth.passwordIssue.prefix') + ' ' + parts.join(', ');
}
