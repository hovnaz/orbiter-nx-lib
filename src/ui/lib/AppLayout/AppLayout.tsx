import type { CSSProperties, ReactNode } from 'react';
import s from './AppLayout.module.css';

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
    <div className={s.root}>
      {!bare && header}
      <main
        className={s.main}
        data-bare={bare ? 'true' : undefined}
        style={{ '--app-max-width': `${maxWidth}px` } as CSSProperties}
      >
        {children}
      </main>
    </div>
  );
}
