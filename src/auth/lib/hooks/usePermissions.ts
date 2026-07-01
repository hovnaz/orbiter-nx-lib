import { selectPermissionSet, useAppSelector } from '#data-access';

export function usePermissions() {
  const permSet = useAppSelector(selectPermissionSet);

  return {
    permissions: permSet,
    hasPermission: (key: string) => permSet.has(key),
    hasAnyPermission: (...keys: string[]) => keys.some((k) => permSet.has(k)),
  };
}
