import type { ProductCode, RoleKey } from '#types';

export const SCHOOL_PRODUCT_CODE: ProductCode = 'SCHOOL';

export const ROLE_PRIORITY: RoleKey[] = ['STUDENT', 'MENTOR', 'HR', 'ADMIN'];

const KNOWN_ROLES: ReadonlySet<string> = new Set(ROLE_PRIORITY);

// ---------- Role helpers (sourced from `/v1/auth/me` → `user.roles`) ----------
//
// The per-org product/ruleKeys model is gone: orgs no longer carry the user's
// roles. The user's school roles for the *selected* org now arrive on the `/me`
// response (`user.roles`), resolved server-side from `X-Organization-Id`. These
// helpers operate on that role array.

/** Roles the app actually understands (drops anything unknown the backend sends). */
export function normalizedRoles(roles: readonly RoleKey[] | undefined): RoleKey[] {
  return (roles ?? []).filter((r): r is RoleKey => KNOWN_ROLES.has(r));
}

/** Highest-priority role the user holds (priority order: {@link ROLE_PRIORITY}). */
export function pickDefaultRole(roles: readonly RoleKey[] | undefined): RoleKey | null {
  const norm = normalizedRoles(roles);
  for (const role of ROLE_PRIORITY) {
    if (norm.includes(role)) return role;
  }
  return null;
}

/**
 * Whether the user actually *holds* a given school role in the selected org,
 * sourced from `/me.roles` (NOT from permissions and NOT from the derived
 * active persona). Use this to gate role-specific UI that must appear even when
 * the user's highest/active role is a different one — e.g. the student
 * classrooms widget for an admin who is also enrolled as a student.
 *
 * NOTE: depends on the backend populating `roles[]` on `/auth/me`
 * (see {@link User.roles}). While that field is absent this returns false.
 */
export function hasSchoolRole(
  roles: readonly RoleKey[] | undefined,
  role: RoleKey,
): boolean {
  return normalizedRoles(roles).includes(role);
}

/** Product namespaces whose permissions belong to the School staff personas. */
const STAFF_PRODUCT_PREFIXES = ['SCHOOL:', 'CRM:', 'ORBITER:'] as const;

/**
 * Whether a permission key grants a *management* (write/admin) capability,
 * as opposed to a read-only `VIEW`. Students are routinely granted view-type
 * permissions (e.g. `SCHOOL:CLASSROOM.VIEW`), so VIEW must NOT be treated as a
 * staff signal — only create/update/delete/manage/settings/invite keys are.
 * The action is the segment after the last `.` (or after `:` when there is no
 * sub-resource, e.g. `CRM:CREATE`).
 */
function isManagementKey(key: string): boolean {
  if (!STAFF_PRODUCT_PREFIXES.some((p) => key.startsWith(p))) return false;
  const action = key.includes('.')
    ? key.slice(key.lastIndexOf('.') + 1)
    : key.slice(key.indexOf(':') + 1);
  return action !== 'VIEW';
}

/**
 * Fallback persona derivation from permission keys, used only while `/me` does
 * not yet carry `roles` (the backend exposes `permissions` first). A *management*
 * permission ⇒ ADMIN persona (the richest management view); a user with only
 * view/consumption permissions (or none) resolves elsewhere to STUDENT. Returns
 * null when nothing can be inferred.
 *
 * NOTE: this cannot distinguish MENTOR/HR — those need real `roles` from the
 * backend (see {@link User.roles}); it only unblocks the common admin-vs-student
 * split until then. Crucially it must NOT misclassify a student as ADMIN just
 * because their role grants a `VIEW` permission, otherwise they'd be locked out
 * of the student dashboard (no role-switch is possible without backend `roles`).
 */
export function inferRoleFromPermissions(
  permissions: ReadonlySet<string> | readonly string[] | undefined,
): RoleKey | null {
  const keys = permissions instanceof Set ? permissions : new Set(permissions ?? []);
  for (const key of keys) {
    if (isManagementKey(key)) return 'ADMIN';
  }
  return null;
}

/**
 * Whether the user can enter a product's app for the selected org. Access is
 * granted when the user holds at least one role (for role-based products like
 * School) or any effective permission whose key starts with one of the
 * product's `permissionPrefixes` (e.g. `'PROJECT:'` for Jira, `'SCHOOL:'` /
 * `'CRM:'` / `'ORBITER:'` for School).
 */
export function hasOrgAccess(
  roles: readonly RoleKey[] | undefined,
  permissions: ReadonlySet<string>,
  opts: { roleBased: boolean; permissionPrefixes: readonly string[] },
): boolean {
  if (opts.roleBased && normalizedRoles(roles).length > 0) return true;
  for (const key of permissions) {
    if (opts.permissionPrefixes.some((p) => key.startsWith(p))) return true;
  }
  return false;
}

// ---------- URL / landing helpers ----------

export function urlToRole(value: string | undefined): RoleKey | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  return (ROLE_PRIORITY as string[]).includes(upper) ? (upper as RoleKey) : null;
}

export function roleToUrl(role: RoleKey): string {
  return role.toLowerCase();
}

export function landingPathForRole(role: RoleKey): string {
  if (role === 'STUDENT' || role === 'ADMIN') return 'dashboard';
  return 'classrooms';
}

export function dashboardPath(org: { slug: string }, role: RoleKey): string {
  return `/o/${org.slug}/${landingPathForRole(role)}`;
}
