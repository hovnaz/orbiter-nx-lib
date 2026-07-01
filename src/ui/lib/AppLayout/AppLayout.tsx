import type { ReactNode } from 'react';

export interface AppLayoutProps {
  header?: ReactNode;
  children: ReactNode;
  maxWidth?: number;
  /** Chromeless full-screen mode: no header, no main padding/max-width. Used by
   * focused pages like the material editor (it provides its own top bar). */
  bare?: boolean;
}

export function AppLayout({ header, children, maxWidth = 1280, bare = false }: AppLayoutProps) {
  return (
    // overflow-x: clip contains full-bleed children (e.g. the material editor's
    // 100vw breakout) so the viewport-scrollbar width can't create a stray
    // horizontal scrollbar. `clip` (not `hidden`) keeps overflow-y visible, so it
    // does NOT become a scroll container and sticky headers still pin to the viewport.
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', overflowX: 'clip' }}>
      {!bare && header}
      <main style={bare ? { margin: 0, padding: 0 } : { maxWidth, margin: '0 auto', padding: '32px 24px 80px' }}>
        {children}
      </main>
    </div>
  );
}
