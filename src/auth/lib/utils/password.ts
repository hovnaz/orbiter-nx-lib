import type { TFunction } from 'i18next';

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
  t: TFunction,
): string {
  const parts: string[] = [];
  if (issue.tooShort) parts.push(t('auth.passwordIssue.tooShort'));
  if (issue.noLower) parts.push(t('auth.passwordIssue.noLower'));
  if (issue.noUpper) parts.push(t('auth.passwordIssue.noUpper'));
  if (issue.noDigit) parts.push(t('auth.passwordIssue.noDigit'));
  return t('auth.passwordIssue.prefix') + ' ' + parts.join(', ');
}
