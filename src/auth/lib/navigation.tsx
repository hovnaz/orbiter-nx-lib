'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface NavigateOptions {
  replace?: boolean;
}

export type NavigateFn = (to: string, opts?: NavigateOptions) => void;

const NavigationContext = createContext<NavigateFn | null>(null);

/**
 * Framework-agnostic navigation for lib pages. The host app provides the
 * implementation (Next.js `next/navigation`, React Router, …) so the auth
 * pages stay portable across frameworks.
 */
export function NavigationProvider({
  navigate,
  children,
}: {
  navigate: NavigateFn;
  children: ReactNode;
}) {
  return (
    <NavigationContext.Provider value={navigate}>
      {children}
    </NavigationContext.Provider>
  );
}

/** Drop-in shape-compatible with react-router's `useNavigate`. */
export function useNavigate(): NavigateFn {
  const navigate = useContext(NavigationContext);
  if (!navigate) {
    throw new Error(
      'useNavigate (orbiter-nx-lib) must be used within a <NavigationProvider>.',
    );
  }
  return navigate;
}
