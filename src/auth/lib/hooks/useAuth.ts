import type { RoleKey } from '#types';
import {
  logout,
  selectCurrentOrg,
  selectCurrentRole,
  selectIsAuthenticated,
  selectUser,
  setCurrentRole,
  useAppDispatch,
  useAppSelector,
} from '#data-access';
import {
  inferRoleFromPermissions,
  normalizedRoles,
  pickDefaultRole,
} from '../utils/roles';

export function useAuth() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const currentOrg = useAppSelector(selectCurrentOrg);
  const storedRole = useAppSelector(selectCurrentRole);

  // The user's roles for the selected org come from `/me` (`user.roles`). The
  // persisted `storedRole` is honoured only while it remains one of those
  // roles (an explicit switch); otherwise we fall back to the default role.
  // This keeps every `useAuth().currentRole` consumer correct without each
  // having to re-derive the role from `user.roles`.
  //
  // Fallback chain (top wins): explicit switch → role from `/me.roles` →
  // persona inferred from permissions (bridge for when the backend exposes
  // `permissions` but not yet `roles`) → STUDENT once a user is loaded.
  const orgRoles = normalizedRoles(user?.roles);
  const currentRole: RoleKey | null =
    storedRole && orgRoles.includes(storedRole)
      ? storedRole
      : pickDefaultRole(user?.roles) ??
        inferRoleFromPermissions(user?.permissions) ??
        (user ? 'STUDENT' : null);

  return {
    isAuthenticated,
    user,
    currentOrg,
    currentRole,
    switchRole: (role: RoleKey) => dispatch(setCurrentRole(role)),
    signOut: () => dispatch(logout()),
  };
}
