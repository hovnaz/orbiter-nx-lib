import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from '../navigation';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Check,
  Database,
  Eye,
  EyeOff,
  FolderKanban,
  GraduationCap,
  Lock,
  Mail,
  type LucideIcon,
} from 'lucide-react';
import { Button, Input, OrbitGlyph, Spinner } from '#ui';
import {
  setAuth,
  setUser,
  useAppDispatch,
  useConfirmResetMutation,
  useForgotPasswordMutation,
  useLazyMeQuery,
  useLoginMutation,
  useNewPasswordMutation,
} from '#data-access';
import type { LoginResponse } from '#types';
import { checkPassword, describePasswordIssue } from '../utils/password';

const NEW_PASSWORD_REQUIRED = 'NEW_PASSWORD_REQUIRED';

type Mode = 'signIn' | 'forgot' | 'reset';

export function LoginPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [challengeSession, setChallengeSession] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login, { isLoading: isLoggingIn, error: loginError }] =
    useLoginMutation();
  const [
    submitNewPassword,
    { isLoading: isSettingPassword, error: newPasswordError },
  ] = useNewPasswordMutation();
  const [forgotPassword, { isLoading: isSendingCode, error: forgotError }] =
    useForgotPasswordMutation();
  const [
    confirmReset,
    { isLoading: isConfirmingReset, error: confirmResetError },
  ] = useConfirmResetMutation();
  const [fetchMe, { isFetching: isFetchingMe }] = useLazyMeQuery();

  async function finalizeAuth(tokens: LoginResponse) {
    dispatch(
      setAuth({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        email,
        // Only persist tokens to localStorage if the user opted in. Otherwise
        // they go to sessionStorage and disappear when the tab closes.
        rememberMe,
      }),
    );
    const user = await fetchMe().unwrap();
    dispatch(setUser(user));
    navigate('/choose-organization', { replace: true });
  }

  async function onSubmitLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    try {
      const res = await login({ email, password }).unwrap();
      if (res.challengeName === NEW_PASSWORD_REQUIRED && res.session) {
        setChallengeSession(res.session);
        return;
      }
      await finalizeAuth(res);
    } catch {
      // surfaced via loginError
    }
  }

  async function onSubmitNewPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    if (checkPassword(newPassword) !== null) return;
    if (newPassword !== confirmPassword) return;
    if (!challengeSession) return;
    try {
      const res = await submitNewPassword({
        session: challengeSession,
        email,
        newPassword,
      }).unwrap();
      if (res.challengeName) {
        setLocalError(
          t('auth.newPassword.unexpectedChallenge', {
            name: res.challengeName,
          }),
        );
        return;
      }
      await finalizeAuth(res);
    } catch {
      // surfaced via newPasswordError
    }
  }

  async function onSubmitForgot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    setResetNotice(null);
    if (!email.trim()) return;
    try {
      await forgotPassword({ email: email.trim() }).unwrap();
      setMode('reset');
      setResetNotice(t('auth.forgot.noticeSent'));
    } catch {
      // surfaced via forgotError
    }
  }

  async function onSubmitConfirmReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    setResetNotice(null);
    if (checkPassword(newPassword) !== null) return;
    if (newPassword !== confirmPassword) return;
    if (!resetCode.trim() || !email.trim()) return;
    try {
      await confirmReset({
        email: email.trim(),
        code: resetCode.trim(),
        newPassword,
      }).unwrap();
      setMode('signIn');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setPassword('');
      setResetNotice(t('auth.reset.successNotice'));
    } catch {
      // surfaced via confirmResetError
    }
  }

  const busy =
    isLoggingIn ||
    isSettingPassword ||
    isFetchingMe ||
    isSendingCode ||
    isConfirmingReset;

  function extractServerError(err: unknown): string | null {
    if (err && typeof err === 'object' && 'data' in err) {
      const data = (err as { data?: { message?: string } | null }).data;
      return data?.message ?? null;
    }
    return null;
  }

  function activeServerError(): unknown {
    if (challengeSession) return newPasswordError;
    if (mode === 'forgot') return forgotError;
    if (mode === 'reset') return confirmResetError;
    return loginError;
  }

  const errorMessage =
    localError ??
    extractServerError(activeServerError()) ??
    (loginError && !challengeSession && mode === 'signIn'
      ? t('auth.login.loginFailed')
      : null);

  // ---------- form bodies ----------

  let formContent: ReactNode;
  let eyebrow: string;
  let title: string;
  let subtitle: string;

  if (challengeSession) {
    eyebrow = t('auth.newPassword.eyebrow');
    title = t('auth.newPassword.title');
    subtitle = t('auth.newPassword.subtitle');
    const passwordIssue = newPassword ? checkPassword(newPassword) : null;
    const confirmMismatch =
      confirmPassword.length > 0 && newPassword !== confirmPassword;
    const passwordValid = newPassword.length > 0 && passwordIssue === null;
    const formValid =
      passwordValid && confirmPassword.length > 0 && !confirmMismatch;
    formContent = (
      <form
        onSubmit={onSubmitNewPassword}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {errorMessage && <ServerErrorBanner message={errorMessage} />}
        <Input
          label={t('auth.reset.newPasswordLabel')}
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          iconLeft={<Lock size={16} strokeWidth={2.2} />}
          hint={t('auth.reset.newPasswordHint')}
          error={
            passwordIssue ? describePasswordIssue(passwordIssue, t) : undefined
          }
        />
        <Input
          label={t('auth.reset.confirmPasswordLabel')}
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          iconLeft={<Lock size={16} strokeWidth={2.2} />}
          error={confirmMismatch ? t('auth.reset.mismatch') : undefined}
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
            ? t('auth.newPassword.submitting')
            : t('auth.newPassword.submit')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          fullWidth
          disabled={busy}
          onClick={() => {
            setChallengeSession(null);
            setNewPassword('');
            setConfirmPassword('');
            setLocalError(null);
          }}
        >
          {t('auth.newPassword.back')}
        </Button>
      </form>
    );
  } else if (mode === 'forgot') {
    eyebrow = t('auth.forgot.eyebrow');
    title = t('auth.forgot.title');
    subtitle = t('auth.forgot.subtitle');
    formContent = (
      <form
        onSubmit={onSubmitForgot}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {errorMessage && <ServerErrorBanner message={errorMessage} />}
        {resetNotice && !errorMessage && <NoticeBanner message={resetNotice} />}
        <Input
          label={t('auth.login.emailLabel')}
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          iconLeft={<Mail size={16} strokeWidth={2.2} />}
          placeholder={t('auth.login.emailPlaceholder')}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={busy || !email.trim()}
          iconRight={
            busy ? (
              <Spinner size={16} color="#fff" />
            ) : (
              <ArrowRight size={16} strokeWidth={2.4} />
            )
          }
        >
          {busy ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          fullWidth
          disabled={busy}
          onClick={() => {
            setMode('signIn');
            setLocalError(null);
            setResetNotice(null);
          }}
        >
          {t('auth.forgot.back')}
        </Button>
      </form>
    );
  } else if (mode === 'reset') {
    eyebrow = t('auth.reset.eyebrow');
    title = t('auth.reset.title');
    subtitle = t('auth.reset.subtitle');
    const passwordIssue = newPassword ? checkPassword(newPassword) : null;
    const confirmMismatch =
      confirmPassword.length > 0 && newPassword !== confirmPassword;
    const passwordValid = newPassword.length > 0 && passwordIssue === null;
    const formValid =
      email.trim().length > 0 &&
      resetCode.trim().length > 0 &&
      passwordValid &&
      confirmPassword.length > 0 &&
      !confirmMismatch;
    formContent = (
      <form
        onSubmit={onSubmitConfirmReset}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {errorMessage && <ServerErrorBanner message={errorMessage} />}
        {resetNotice && !errorMessage && <NoticeBanner message={resetNotice} />}
        <Input
          label={t('auth.login.emailLabel')}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          iconLeft={<Mail size={16} strokeWidth={2.2} />}
        />
        <Input
          label={t('auth.reset.codeLabel')}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          autoFocus
          value={resetCode}
          onChange={(e) => setResetCode(e.target.value)}
          hint={t('auth.reset.codeHint')}
        />
        <Input
          label={t('auth.reset.newPasswordLabel')}
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          iconLeft={<Lock size={16} strokeWidth={2.2} />}
          hint={t('auth.reset.newPasswordHint')}
          error={
            passwordIssue ? describePasswordIssue(passwordIssue, t) : undefined
          }
        />
        <Input
          label={t('auth.reset.confirmPasswordLabel')}
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          iconLeft={<Lock size={16} strokeWidth={2.2} />}
          error={confirmMismatch ? t('auth.reset.mismatch') : undefined}
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
          {busy ? t('auth.reset.submitting') : t('auth.reset.submit')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          fullWidth
          disabled={busy || !email.trim()}
          onClick={() => {
            void forgotPassword({ email: email.trim() })
              .unwrap()
              .catch(() => {
                /* surfaced via forgotError */
              });
            setResetNotice(t('auth.reset.resendNotice'));
          }}
        >
          {t('auth.reset.resend')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          fullWidth
          disabled={busy}
          onClick={() => {
            setMode('signIn');
            setResetCode('');
            setLocalError(null);
            setResetNotice(null);
          }}
        >
          {t('auth.reset.back')}
        </Button>
      </form>
    );
  } else {
    eyebrow = t('auth.login.eyebrow');
    title = t('auth.login.title');
    subtitle = t('auth.login.subtitle');
    formContent = (
      <form
        onSubmit={onSubmitLogin}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {errorMessage && <ServerErrorBanner message={errorMessage} />}
        {resetNotice && !errorMessage && <NoticeBanner message={resetNotice} />}
        <Input
          label={t('auth.login.emailLabel')}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          iconLeft={<Mail size={16} strokeWidth={2.2} />}
          placeholder={t('auth.login.emailPlaceholder')}
        />
        <PasswordInput
          label={t('auth.login.passwordLabel')}
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggleShow={() => setShowPassword((s) => !s)}
          showLabel={t('auth.login.showPassword')}
          hideLabel={t('auth.login.hidePassword')}
          error={errorMessage ?? undefined}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: -4,
          }}
        >
          <RememberToggle
            checked={rememberMe}
            onChange={setRememberMe}
            label={t('auth.login.rememberMe')}
          />
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setLocalError(null);
              setResetNotice(null);
            }}
            disabled={busy}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--teal-pressed)',
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? 'default' : 'pointer',
              padding: 0,
            }}
          >
            {t('auth.login.forgotPassword')}
          </button>
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={busy}
          iconRight={
            busy ? (
              <Spinner size={16} color="#fff" />
            ) : (
              <ArrowRight size={16} strokeWidth={2.4} />
            )
          }
        >
          {busy ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
        <div
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--text-secondary)',
          }}
        >
          {t('auth.hero.topRightInvite')}{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            disabled={busy}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              color: 'var(--teal-pressed)',
              fontWeight: 700,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {t('auth.hero.topRightCta')}
          </button>
        </div>
      </form>
    );
  }

  // ---------- shell ----------

  return (
    <div className="orbiter-login__shell">
      <HeroBackdrop />
      <div className="orbiter-login__topbar">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Orbiter"
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
            Orbiter
          </div>
        </button>
        <button
          type="button"
          onClick={() => navigate('/register')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 13,
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {t('auth.hero.topRightInvite')}{' '}
          <span style={{ color: '#FFD56B', fontWeight: 700 }}>
            {t('auth.hero.topRightCta')}
          </span>
        </button>
      </div>

      <div className="orbiter-login__layout">
        <HeroLeft />
        <FormCard eyebrow={eyebrow} title={title} subtitle={subtitle}>
          {formContent}
        </FormCard>
      </div>
    </div>
  );
}

// ---------------- Hero backdrop (SVG orbit + fade overlay) ----------------

function HeroBackdrop() {
  return (
    <>
      <div className="orbiter-login__orbit-bg" aria-hidden>
        <OrbitConstellation />
      </div>
      <div className="orbiter-login__hero-fade" aria-hidden />
    </>
  );
}

/**
 * Decorative SVG orbit constellation. Pure vector so it stays crisp on
 * any viewport, including 4K/Retina. Two satellites animate via the
 * `orbitSpin`/`orbitSpinRev` keyframes defined in `global.scss`.
 */
function OrbitConstellation() {
  return (
    <svg
      viewBox="0 0 520 520"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="loginGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3BBCA7" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#3BBCA7" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#3BBCA7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="loginOrbitFade" x1="0" x2="1">
          <stop offset="0%" stopColor="#3BBCA7" stopOpacity="0.0" />
          <stop offset="50%" stopColor="#3BBCA7" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFB606" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      <circle cx="260" cy="260" r="240" fill="url(#loginGlow)" />

      {Array.from({ length: 48 }).map((_, i) => {
        const x = (i * 97) % 520;
        const y = (i * 211 + 17) % 520;
        const r = i % 5 === 0 ? 1.8 : 1;
        const o = 0.25 + (i % 7) * 0.07;
        return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={o} />;
      })}

      <circle
        cx="260"
        cy="260"
        r="80"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
      />
      <circle
        cx="260"
        cy="260"
        r="135"
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      <circle
        cx="260"
        cy="260"
        r="200"
        fill="none"
        stroke="url(#loginOrbitFade)"
        strokeWidth="1.2"
      />

      <circle cx="340" cy="260" r="5" fill="#3BBCA7" />
      <circle cx="260" cy="180" r="3.5" fill="#FFB606" />
      <circle cx="155" cy="195" r="4" fill="#fff" opacity="0.8" />
      <circle cx="395" cy="335" r="3" fill="#3BBCA7" opacity="0.7" />
      <circle cx="100" cy="370" r="4" fill="#FFB606" opacity="0.8" />

      <g
        style={{
          transformOrigin: '260px 260px',
          animation: 'orbitSpin 24s linear infinite',
        }}
      >
        <circle cx="460" cy="260" r="6" fill="#3BBCA7" />
        <circle
          cx="460"
          cy="260"
          r="14"
          fill="none"
          stroke="#3BBCA7"
          strokeOpacity="0.35"
        />
      </g>
      <g
        style={{
          transformOrigin: '260px 260px',
          animation: 'orbitSpinRev 36s linear infinite',
        }}
      >
        <circle cx="260" cy="125" r="4" fill="#FFB606" />
      </g>

      <circle
        cx="260"
        cy="260"
        r="34"
        fill="#072F60"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.2"
      />
      <path
        d="M260 232 L268 260 L260 288 L252 260 Z"
        fill="#fff"
        opacity="0.95"
      />
      <circle cx="260" cy="260" r="3" fill="#FFB606" />
    </svg>
  );
}

// ---------------- Hero left column (pill + headline + role chips) ----

/**
 * Decorative product chip data. Highlights which Orbiter products are
 * available behind sign-in — picking a chip is purely cosmetic, it does NOT
 * change the auth flow. The actual landing page after login depends on the
 * user's permissions, not on which chip was hovered.
 */
type ProductHint = 'school' | 'jira' | 'crm';

const PRODUCT_OPTIONS: ReadonlyArray<{
  value: ProductHint;
  Icon: LucideIcon;
  labelKey: string;
  hintKey: string;
}> = [
  {
    value: 'school',
    Icon: GraduationCap,
    labelKey: 'auth.hero.products.school',
    hintKey: 'auth.hero.products.schoolHint',
  },
  {
    value: 'jira',
    Icon: FolderKanban,
    labelKey: 'auth.hero.products.jira',
    hintKey: 'auth.hero.products.jiraHint',
  },
  {
    value: 'crm',
    Icon: Database,
    labelKey: 'auth.hero.products.crm',
    hintKey: 'auth.hero.products.crmHint',
  },
];

function HeroLeft() {
  const { t } = useTranslation();
  // Local-only — purely cosmetic highlight on the marketing chips.
  const [productHint, setProductHint] = useState<ProductHint>('school');
  return (
    <div className="orbiter-login__hero-copy">
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 12px 5px 7px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#9EE6D8',
          marginBottom: 20,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#3BBCA7',
          }}
        />
        {t('auth.hero.release')}
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 4.5vw, 56px)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.0,
          marginBottom: 18,
          color: '#fff',
        }}
      >
        {t('auth.hero.titleLine1')}
        <br />
        <span style={{ color: '#3BBCA7' }}>{t('auth.hero.titleAccent')}</span>
        {t('auth.hero.titleLine2Suffix')}
      </h1>
      <p
        style={{
          fontSize: 15.5,
          lineHeight: 1.55,
          opacity: 0.78,
          maxWidth: 460,
          marginBottom: 32,
          color: '#fff',
        }}
      >
        {t('auth.hero.subtitle')}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          maxWidth: 540,
        }}
      >
        {PRODUCT_OPTIONS.map((r) => {
          const active = productHint === r.value;
          const Icon = r.Icon;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => setProductHint(r.value)}
              style={{
                display: 'grid',
                gridTemplateColumns: '34px 1fr',
                gap: 12,
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: 'var(--r-md)',
                background: active
                  ? 'rgba(59,188,167,0.18)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${
                  active ? 'rgba(59,188,167,0.6)' : 'rgba(255,255,255,0.10)'
                }`,
                color: '#fff',
                textAlign: 'left',
                transition: 'all 140ms var(--ease-out)',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--r-sm)',
                  background: active ? '#3BBCA7' : 'rgba(255,255,255,0.08)',
                  color: active ? '#072F60' : '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={17} strokeWidth={2.2} />
              </span>
              <span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '-0.005em',
                  }}
                >
                  {t(r.labelKey)}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 11.5,
                    opacity: 0.72,
                    marginTop: 1,
                  }}
                >
                  {t(r.hintKey)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Form card (right, floating white) ----------------

interface FormCardProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

function FormCard({
  eyebrow,
  title,
  subtitle,
  children,
}: Readonly<FormCardProps>) {
  return (
    <div className="orbiter-login__card">
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
        {eyebrow}
      </div>
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
        {title}
      </h2>
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          marginBottom: 24,
        }}
      >
        {subtitle}
      </p>

      {children}
    </div>
  );
}

// ---------------- Small parts ----------------

function ServerErrorBanner({ message }: { message: string }) {
  return (
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
      {message}
    </div>
  );
}

function NoticeBanner({ message }: { message: string }) {
  return (
    <div
      role="status"
      style={{
        background: 'var(--success-soft)',
        border: '1px solid var(--success)',
        color: 'var(--success-pressed)',
        padding: '8px 12px',
        borderRadius: 'var(--r-md)',
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  show: boolean;
  onToggleShow: () => void;
  /** Localized a11y label for the "show password" state. */
  showLabel: string;
  /** Localized a11y label for the "hide password" state. */
  hideLabel: string;
  error?: string;
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  showLabel,
  hideLabel,
  error,
}: Readonly<PasswordInputProps>) {
  // The shared `Input` doesn't expose a trailing slot, so we fall back to
  // its `iconLeft` + a separately-rendered toggle button absolutely
  // positioned over the right edge of the field.
  return (
    <div style={{ position: 'relative' }}>
      <Input
        label={label}
        type={show ? 'text' : 'password'}
        autoComplete="current-password"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        iconLeft={<Lock size={16} strokeWidth={2.2} />}
        error={error}
      />
      <button
        type="button"
        onClick={onToggleShow}
        aria-label={show ? hideLabel : showLabel}
        style={{
          position: 'absolute',
          right: 12,
          // Sits at the same vertical center as the input itself; the input
          // adds ~22px of label height above it.
          top: 'calc(50% + 9px)',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 4,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {show ? (
          <EyeOff size={16} strokeWidth={2.2} />
        ) : (
          <Eye size={16} strokeWidth={2.2} />
        )}
      </button>
    </div>
  );
}

function RememberToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        fontSize: 13,
        color: 'var(--text-secondary)',
        fontWeight: 500,
        userSelect: 'none',
      }}
    >
      {/* Real checkbox is visually hidden but keeps the click/keyboard
          semantics — the label flips it natively when its text is clicked. */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 0,
          height: 0,
        }}
      />
      <span
        aria-hidden
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: '1.5px solid',
          borderColor: checked ? 'var(--teal)' : 'var(--border)',
          background: checked ? 'var(--teal)' : 'var(--bg-elevated)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition:
            'background 120ms var(--ease-out), border-color 120ms var(--ease-out)',
        }}
      >
        {checked && <Check size={12} strokeWidth={3} color="#fff" />}
      </span>
      {label}
    </label>
  );
}

