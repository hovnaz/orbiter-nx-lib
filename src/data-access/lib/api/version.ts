export const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION ?? 'v1';

export function v(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `/${API_VERSION}${clean}`;
}
