import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { Spinner } from '#ui';
import {
  selectCurrentOrg,
  setCurrentOrg,
  setUser,
  useAppDispatch,
  useAppSelector,
  useMeQuery,
  useOrganizationsQuery,
} from '#data-access';
import { hasOrgAccess } from '../utils/roles';
import { useProductContext } from '../context/ProductContext';
import { NoProductRolesNotice } from '../pages/NoProductRolesNotice';

/**
 * Authorizes a route segment scoped to a specific organization (`/o/:orgSlug/…`).
 *
 * Behaviour, in order:
 *   1. Wait for the org list to load.
 *   2. Resolve the org by slug; redirect to /choose-organization on mismatch.
 *   3. Fire `/me` with the resolved orgId and wait for it — children rely on
 *      `state.auth.user.permissions` and `state.auth.user.roles`.
 *   4. Gate product access on the `/me` payload (roles + permission prefixes
 *      from ProductContext), since the slim org list no longer carries
 *      products/roles. Show the "no access" notice when the user is a member
 *      but has neither a role nor a matching permission for this product.
 */
export function RequireOrg() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const dispatch = useAppDispatch();
  const { data, isLoading, isError } = useOrganizationsQuery();
  const currentOrg = useAppSelector(selectCurrentOrg);
  const { productName, roleBased, permissionPrefixes } = useProductContext();

  const org = data?.find((o) => o.slug === orgSlug);

  // Sync the resolved org into Redux. Done in an EFFECT (not during render) to avoid
  // "Cannot update a component while rendering". useMeQuery receives orgId explicitly
  // below, so it doesn't need the store set during this render; and children only
  // mount after /me resolves, by which point currentOrg is already committed.
  const prevOrgIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (org && org.id !== prevOrgIdRef.current) {
      prevOrgIdRef.current = org.id;
      dispatch(setCurrentOrg(org));
    }
  }, [org, dispatch]);

  // Pass orgId explicitly so the header is included regardless of Redux timing
  const orgId = org?.id ?? currentOrg?.id;
  const meQuery = useMeQuery(orgId ? { orgId } : undefined, { skip: !orgId });

  useEffect(() => {
    if (meQuery.data) dispatch(setUser(meQuery.data));
  }, [meQuery.data, dispatch]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (isError || !org) {
    return <Navigate to="/choose-organization" replace />;
  }

  // Wait for /me so children have permissions + roles for this org
  if (meQuery.isLoading || !meQuery.data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spinner size={32} />
      </div>
    );
  }

  const permissions = new Set(meQuery.data.permissions ?? []);
  if (
    !hasOrgAccess(meQuery.data.roles, permissions, {
      roleBased,
      permissionPrefixes,
    })
  ) {
    return (
      <NoProductRolesNotice
        productName={productName}
        organizationName={org.name}
      />
    );
  }

  return <Outlet />;
}
