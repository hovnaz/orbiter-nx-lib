import { createContext, useContext, type ReactNode } from 'react';

/**
 * DOM node that overlay components (drawers, lightboxes) should `createPortal`
 * into. Defaults to `document.body`. Provide a sub-tree element to scope
 * overlays to it — e.g. a marketing demo "browser frame", so a full-screen
 * `position: fixed` drawer stays inside the frame instead of covering the page.
 *
 * Backward-compatible: with no provider the value is `document.body`, exactly
 * the previous hard-coded behaviour.
 */
const PortalContainerContext = createContext<HTMLElement | null>(null);

export function PortalContainerProvider({
  container,
  children,
}: Readonly<{ container: HTMLElement | null; children: ReactNode }>) {
  return (
    <PortalContainerContext.Provider value={container}>
      {children}
    </PortalContainerContext.Provider>
  );
}

/** The portal target: the provided container, else `document.body` (null in SSR). */
export function usePortalContainer(): HTMLElement | null {
  const ctx = useContext(PortalContainerContext);
  if (ctx) return ctx;
  return typeof document !== 'undefined' ? document.body : null;
}
