/**
 * ProductContext — per-app product identity for the shared auth flow.
 *
 * Both `apps/school` and `apps/jira` reuse the same Login / ChooseOrganization
 * / RequireOrg / NoAccess pages, but each app belongs to a different Orbiter
 * product (SCHOOL vs JIRA, with CRM as a future addition). The shared pages
 * read the product code, display name and "where to land after picking an
 * org" function from this context.
 *
 * Wrap your app once at the root:
 *
 *   <ProductProvider value={{ productCode: 'SCHOOL', productName: 'School',
 *     landingPath: schoolLanding, roleBased: true }}>
 *     <RouterProvider router={router} />
 *   </ProductProvider>
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { Organization, ProductCode } from '#types';

export interface ProductContextValue {
  /** Backend product code (e.g. `'SCHOOL'`, `'JIRA'`). */
  productCode: ProductCode;
  /** Human display name used in "no access" notices. */
  productName: string;
  /**
   * Where to navigate after the user picks an org. The role-specific landing
   * is resolved later (once `/me` loads the user's roles for the org) by the
   * app's index redirect — so this returns a stable entry path, not a
   * role-dependent one.
   */
  landingPath: (org: Organization) => string;
  /**
   * `true` for products that use the org-roles concept (School: STUDENT /
   * MENTOR / HR / ADMIN). `false` for products that gate access by product
   * permissions only without per-product roles (Jira at this stage).
   */
  roleBased: boolean;
  /**
   * Effective-permission key prefixes that grant access to this product's app
   * for an org (checked against `user.permissions` from `/me`). E.g.
   * `['SCHOOL:', 'CRM:', 'ORBITER:']` for School, `['PROJECT:']` for Jira.
   */
  permissionPrefixes: readonly string[];
}

const ProductContext = createContext<ProductContextValue | null>(null);

export interface ProductProviderProps {
  value: ProductContextValue;
  children: ReactNode;
}

export function ProductProvider({ value, children }: ProductProviderProps) {
  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProductContext(): ProductContextValue {
  const ctx = useContext(ProductContext);
  if (!ctx) {
    throw new Error(
      'useProductContext: missing <ProductProvider> at the app root.',
    );
  }
  return ctx;
}
