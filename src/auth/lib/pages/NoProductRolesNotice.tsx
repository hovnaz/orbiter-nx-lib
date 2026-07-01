import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import { Button, Card } from '#ui';
import { useAuth } from '../hooks/useAuth';

export interface NoProductRolesNoticeProps {
  /** Display name of the product (e.g. "School", "Jira"). */
  productName: string;
  /** When provided, shown as a hint about which org has no roles. */
  organizationName?: string;
}

/**
 * Blocking screen shown when the authenticated user has access to a product
 * in an organization but no recognized roles assigned. Asks the user to
 * contact their administrator and offers a sign-out shortcut.
 *
 * Generic across products — pass `productName` to drive the copy.
 */
export function NoProductRolesNotice({
  productName,
  organizationName,
}: Readonly<NoProductRolesNoticeProps>) {
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
            background: 'var(--warning-soft)',
            color: 'var(--warning)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <ShieldAlert size={28} strokeWidth={2.2} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          {t('auth.noRoles.title')}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            marginBottom: 8,
            lineHeight: 1.5,
          }}
        >
          {organizationName
            ? t('auth.noRoles.descriptionFor', {
                product: productName,
                org: organizationName,
              })
            : t('auth.noRoles.description', { product: productName })}
        </p>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {t('auth.noRoles.hint')}
        </p>
        <Button variant="outline" onClick={onSignOut}>
          {t('auth.noRoles.signOut')}
        </Button>
      </Card>
    </div>
  );
}
