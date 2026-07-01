export const API_VERSION =
  (import.meta.env?.VITE_API_VERSION as string | undefined) ?? 'v1';

export function v(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `/${API_VERSION}${clean}`;
}
