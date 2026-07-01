import { useNavigate } from '../navigation';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { Button, Card } from '#ui';
import { useAuth } from '../hooks/useAuth';

export interface NoOrganizationNoticeProps {
  /** Optional product display name — used to clarify which product the user
   * lacks org access for ("…with access to **Jira**"). */
  productName?: string;
}

/**
 * Blocking screen shown when the authenticated user is not attached to any
 * organization that has the active product. Asks the user to contact their
 * administrator and offers a sign-out shortcut.
 */
export function NoOrganizationNotice({ productName }: Readonly<NoOrganizationNoticeProps> = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  function onSignOut() {
    signOut();
    navigate('/login', { replace: true });
  }

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
            background: 'var(--info-soft)',
            color: 'var(--info)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Building2 size={28} strokeWidth={2.2} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          {t('auth.noOrganization.title')}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            marginBottom: 8,
            lineHeight: 1.5,
          }}
        >
          {productName
            ? t('auth.noOrganization.descriptionFor', { product: productName })
            : t('auth.noOrganization.description')}
        </p>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {t('auth.noOrganization.hint')}
        </p>
        <Button variant="outline" onClick={onSignOut}>
          {t('auth.noOrganization.signOut')}
        </Button>
      </Card>
    </div>
  );
}
