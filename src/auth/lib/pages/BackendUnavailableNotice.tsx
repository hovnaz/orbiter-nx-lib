import { useTranslation } from 'react-i18next';
import { ServerCrash } from 'lucide-react';
import { Button, Card } from '#ui';

export interface BackendUnavailableNoticeProps {
  /** HTTP status code returned by the failed request (e.g. 502, 503). */
  statusCode?: number;
  /** Retry handler — usually wired to RTK Query's `refetch`. */
  onRetry?: () => void;
  /** Disables the retry button while a retry is already in flight. */
  retrying?: boolean;
}

/**
 * Blocking "service temporarily unavailable" screen shown when an API call
 * fails because the backend is down or returns a 5xx (typical 502/503/504
 * during deploys). Offers a single "Try again" action.
 */
export function BackendUnavailableNotice({
  statusCode,
  onRetry,
  retrying = false,
}: Readonly<BackendUnavailableNoticeProps> = {}) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg-section)',
        padding: 24,
      }}
    >
      <Card
        variant="elevated"
        padding="lg"
        style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'var(--warning-soft)',
            color: 'var(--warning)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <ServerCrash size={28} strokeWidth={2.2} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          {t('auth.backendUnavailable.title')}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            marginBottom: 8,
            lineHeight: 1.5,
          }}
        >
          {statusCode
            ? t('auth.backendUnavailable.descriptionWithStatus', { status: statusCode })
            : t('auth.backendUnavailable.description')}
        </p>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {t('auth.backendUnavailable.hint')}
        </p>
        {onRetry && (
          <Button variant="primary" onClick={onRetry} disabled={retrying}>
            {retrying
              ? t('auth.backendUnavailable.retrying')
              : t('auth.backendUnavailable.retry')}
          </Button>
        )}
      </Card>
    </div>
  );
}
