import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export interface RedirectIfAuthenticatedProps {
  to?: string;
}

export function RedirectIfAuthenticated({
  to = '/choose-organization',
}: Readonly<RedirectIfAuthenticatedProps>) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to={to} replace />;
  return <Outlet />;
}
