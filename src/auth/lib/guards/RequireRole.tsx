import { Navigate, Outlet } from 'react-router-dom';
import type { RoleKey } from '#types';
import { useAuth } from '../hooks/useAuth';

export interface RequireRoleProps {
  allowed?: RoleKey[];
}

/**
 * Gate a route on the user holding a specific role. `useAuth().currentRole` is
 * the effective role, already validated against `user.roles` from `/me`, so no
 * org-level re-check is needed. Access to the app itself is gated upstream by
 * {@link RequireOrg} (roles OR permissions); use this only for routes that
 * genuinely require a particular role.
 */
export function RequireRole({ allowed }: Readonly<RequireRoleProps>) {
  const { currentRole } = useAuth();

  if (!currentRole) return <Navigate to="/choose-organization" replace />;

  if (allowed && !allowed.includes(currentRole)) {
    return <Navigate to="/choose-organization" replace />;
  }

  return <Outlet />;
}
