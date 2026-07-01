/**
 * RegisterPage — public self-serve onboarding for Orbiter School
 * (school.orbiter.am/register). Anonymous; mounted under `RedirectIfAuthenticated`.
 *
 * Collects the owner's details + a NEW organization (name + slug) and submits a
 * single call to the public onboarding endpoint, which server-side creates the
 * org (owned by the registrant) and activates SCHOOL. Timezone is auto-detected.
 * A success screen is shown on completion; server errors surface inline.
 *
 * ⚠️ BACKEND PENDING: the onboarding endpoint (`useRegisterOrganizationMutation`,
 * assumed `POST /v1/auth/register-organization`) does not exist yet — submitting
 * will error until the backend adds it. This page must NEVER call the
 * SUPER_ADMIN org-create / product-activation endpoints directly; the server
 * must create the org owned by the registrant, verify rights and rate-limit.
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from '../navigation';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Building2, Check, Link2, Mail, Phone, User } from 'lucide-react';
import { Button, Input, OrbitGlyph, Spinner } from '#ui';
import { useRegisterOrganizationMutation } from '#data-access';
import {
  validateEmail,
  validatePhone,
  validateText,
} from '#utils';

interface RegisterDraft {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  organizationName: string;
  organizationSlug: string;
}

const EMPTY_DRAFT: RegisterDraft = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  organizationName: '',
  organizationSlug: '',
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Derive a url-safe slug from a name (latin only — non-latin drops, user types it). */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Pattern check layered on top of validateText's required/length checks. */
function slugPatternError(value: string): { key: string } | null {
  const v = value.trim();
  if (v && !SLUG_RE.test(v)) return { key: 'auth.register.slugInvalid' };
  return null;
}

/** Auto-detected IANA timezone (e.g. "Asia/Yerevan"); 'UTC' if unavailable. */
function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function extractMessage(err: unknown): string | null {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { message?: string } | null }).data;
    return data?.message ?? null;
  }
  return null;
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [registerOrganization, { isLoading: isSubmitting }] =
    useRegisterOrganizationMutation();

  const [draft, setDraft] = useState<RegisterDraft>(EMPTY_DRAFT);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const busy = isSubmitting;

  const update = <K extends keyof RegisterDraft>(
    key: K,
    value: RegisterDraft[K],
  ) => setDraft((prev) => ({ ...prev, [key]: value }));

  // Typing the org name auto-fills the slug until the user edits it manually.
  const onOrgNameChange = (value: string) =>
    setDraft((prev) => ({
      ...prev,
      organizationName: value,
      organizationSlug: slugTouched ? prev.organizationSlug : slugify(value),
    }));

  const onSlugChange = (value: string) => {
    setSlugTouched(true);
    update('organizationSlug', value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const errors = {
    firstName: validateText(draft.firstName, { required: true, max: 100 }),
    lastName: validateText(draft.lastName, { required: true, max: 100 }),
    email: validateEmail(draft.email, { required: true }),
    phoneNumber: validatePhone(draft.phoneNumber, { required: true }),
    organizationName: validateText(draft.organizationName, {
      required: true,
      max: 100,
    }),
    organizationSlug:
      validateText(draft.organizationSlug, { required: true, max: 60 }) ??
      slugPatternError(draft.organizationSlug),
  };
  const formValid = Object.values(errors).every((e) => e === null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!formValid || busy) return;

    try {
      await registerOrganization({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        email: draft.email.trim(),
        phoneNumber: draft.phoneNumber.trim(),
        organizationName: draft.organizationName.trim(),
        organizationSlug: draft.organizationSlug.trim(),
        timezone: detectTimezone(),
      }).unwrap();
      setDone(true);
    } catch (err) {
      setError(extractMessage(err) ?? t('auth.register.failed'));
    }
  }

  const err = (e: { key: string; values?: Record<string, string | number> } | null) =>
    e ? t(e.key, e.values) : undefined;

  return (
    <div className="orbiter-login__shell">
      <div className="orbiter-login__topbar">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Orbiter School"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <OrbitGlyph size={34} />
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 19,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: '#fff',
            }}
          >
            Orbiter School
          </div>
        </button>
        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('auth.register.haveAccount')}{' '}
          <span style={{ color: '#FFD56B' }}>{t('auth.register.signIn')}</span>
        </button>
      </div>

      <div
        className="orbiter-login__layout"
        style={{ justifyContent: 'center' }}
      >
        <div className="orbiter-login__card">
          {done ? (
            <SuccessBody email={draft.email.trim()} onLogin={() => navigate('/login')} />
          ) : (
            <>
              <CardEyebrow text={t('auth.register.eyebrow')} />
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  marginBottom: 6,
                  color: 'var(--text-primary)',
                }}
              >
                {t('auth.register.title')}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  marginBottom: 24,
                }}
              >
                {t('auth.register.subtitle')}
              </p>

              <form
                onSubmit={onSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {error && (
                  <div
                    role="alert"
                    style={{
                      background: 'var(--danger-soft)',
                      border: '1px solid var(--danger)',
                      color: 'var(--danger-pressed)',
                      padding: '8px 12px',
                      borderRadius: 'var(--r-md)',
                      fontSize: 13,
                    }}
                  >
                    {error}
                  </div>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                >
                  <Input
                    label={t('auth.register.firstName')}
                    value={draft.firstName}
                    onChange={(e) => update('firstName', e.target.value)}
                    placeholder="Anna"
                    autoComplete="given-name"
                    required
                    autoFocus
                    iconLeft={<User size={16} strokeWidth={2.2} />}
                    error={err(errors.firstName)}
                  />
                  <Input
                    label={t('auth.register.lastName')}
                    value={draft.lastName}
                    onChange={(e) => update('lastName', e.target.value)}
                    placeholder="Petrosyan"
                    autoComplete="family-name"
                    required
                    iconLeft={<User size={16} strokeWidth={2.2} />}
                    error={err(errors.lastName)}
                  />
                </div>
                <Input
                  label={t('auth.register.email')}
                  type="email"
                  value={draft.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="anna@company.com"
                  autoComplete="email"
                  required
                  iconLeft={<Mail size={16} strokeWidth={2.2} />}
                  error={err(errors.email)}
                />
                <Input
                  label={t('auth.register.phoneNumber')}
                  value={draft.phoneNumber}
                  onChange={(e) => update('phoneNumber', e.target.value)}
                  placeholder="+37495123456"
                  autoComplete="tel"
                  required
                  iconLeft={<Phone size={16} strokeWidth={2.2} />}
                  error={err(errors.phoneNumber)}
                />
                <Input
                  label={t('auth.register.organizationName')}
                  value={draft.organizationName}
                  onChange={(e) => onOrgNameChange(e.target.value)}
                  placeholder={t('auth.register.organizationNamePlaceholder')}
                  required
                  iconLeft={<Building2 size={16} strokeWidth={2.2} />}
                  error={err(errors.organizationName)}
                />
                <Input
                  label={t('auth.register.organizationSlug')}
                  value={draft.organizationSlug}
                  onChange={(e) => onSlugChange(e.target.value)}
                  placeholder="my-school"
                  required
                  iconLeft={<Link2 size={16} strokeWidth={2.2} />}
                  hint={t('auth.register.organizationSlugHint', {
                    slug: draft.organizationSlug || 'my-school',
                  })}
                  error={err(errors.organizationSlug)}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={busy || !formValid}
                  iconRight={
                    busy ? (
                      <Spinner size={16} color="#fff" />
                    ) : (
                      <ArrowRight size={16} strokeWidth={2.4} />
                    )
                  }
                >
                  {busy
                    ? t('auth.register.submitting')
                    : t('auth.register.submit')}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CardEyebrow({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--teal-pressed)',
        marginBottom: 10,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--teal)',
        }}
      />
      {text}
    </div>
  );
}

function SuccessBody({
  email,
  onLogin,
}: {
  email: string;
  onLogin: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--success-soft)',
          color: 'var(--success-pressed)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
        }}
      >
        <Check size={28} strokeWidth={2.6} />
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          marginBottom: 8,
          color: 'var(--text-primary)',
        }}
      >
        {t('auth.register.successTitle')}
      </h2>
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          marginBottom: 24,
          lineHeight: 1.55,
        }}
      >
        {t('auth.register.successDesc', { email })}
      </p>
      <Button variant="primary" size="lg" fullWidth onClick={onLogin}>
        {t('auth.register.goToLogin')}
      </Button>
    </div>
  );
}
