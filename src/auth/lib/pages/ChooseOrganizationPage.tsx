import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Organization } from '#types';
import { Avatar, Card, Spinner } from '#ui';
import {
  setCurrentOrg,
  useAppDispatch,
  useOrganizationsQuery,
} from '#data-access';
import { useProductContext } from '../context/ProductContext';
import { NoOrganizationNotice } from './NoOrganizationNotice';
import { BackendUnavailableNotice } from './BackendUnavailableNotice';

/**
 * Shared org picker shown right after login (and when the user lands on a
 * `/o/:slug` route without one set). The org list is now the slim
 * `MyOrganizationResponse[]` (every org the user is a member of) — it no longer
 * carries products/roles, so we cannot pre-filter by product access here.
 * Whether the user can actually enter the product for a given org is decided by
 * {@link RequireOrg} once `/me` resolves the org's roles + permissions.
 *
 * Flow:
 *   • 0 orgs              → NoOrganizationNotice
 *   • 1 org (auto-select) → navigate(landingPath, replace)
 *   • else                → render picker cards
 */
export function ChooseOrganizationPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data, isLoading, isError, isFetching, error, refetch } =
    useOrganizationsQuery();
  const { productName, landingPath } = useProductContext();

  const orgs = data ?? [];

  function selectOrg(org: Organization) {
    dispatch(setCurrentOrg(org));
    navigate(landingPath(org), { replace: true });
  }

  useEffect(() => {
    if (orgs.length === 1) selectOrg(orgs[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isError) {
    const statusCode = (error as { status?: number } | undefined)?.status;
    return (
      <BackendUnavailableNotice
        statusCode={statusCode}
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    );
  }

  // No confirmed response yet (initial load or retry in flight) — never fall
  // through to the empty-state notice below without real data from the backend.
  if (isLoading || !data) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (orgs.length === 1) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (orgs.length === 0) {
    return <NoOrganizationNotice productName={productName} />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-section)',
        padding: '64px 24px',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
          Choose your organization
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'var(--text-secondary)',
            marginBottom: 32,
          }}
        >
          Pick the workspace you want to enter.
        </p>
        <div style={{ display: 'grid', gap: 16 }}>
          {orgs.map((org) => (
            <Card
              key={org.id}
              variant="default"
              padding="lg"
              interactive
              onClick={() => selectOrg(org)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Avatar name={org.name} src={org.logoUrl} size="lg" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{org.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {org.slug}
                  </div>
                </div>
                <span style={{ color: 'var(--teal-pressed)', fontWeight: 600 }}>
                  Open →
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
