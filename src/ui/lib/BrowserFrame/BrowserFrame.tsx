/**
 * BrowserFrame — a stylized browser window that frames a product mockup so it
 * reads as a real screenshot without needing an actual screenshot.
 *
 * MockShell — the inner product chrome (left nav rail + topbar) shared by every
 * mockup so they all look like the same Orbiter School app.
 *
 * Both are purely presentational; mockups are non-interactive previews.
 */

import { useState, type CSSProperties, type ReactNode } from 'react';
import { OrbitGlyph } from '../OrbitGlyph';
import { PortalContainerProvider } from '../PortalContainer';
import {
  Bell,
  CalendarDays,
  LayoutDashboard,
  BookOpen,
  CheckCheck,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react';
import s from './BrowserFrame.module.css';

export interface BrowserFrameProps {
  url?: string;
  children: ReactNode;
  /** Fixed content height in px (content scrolls/clips inside). */
  height?: number;
  /** Subtle floating shadow + lift. */
  elevated?: boolean;
}

// Traffic-light dot colours — no design token maps to these macOS hues, kept literal.
const DOTS = ['#FF5F57', '#FEBC2E', '#28C840'];

export function BrowserFrame({
  url = 'school.orbiter.am',
  children,
  height,
  elevated = true,
}: BrowserFrameProps) {
  // The content area is a CSS containing block (transform) AND the portal target
  // for overlays. So a real component's full-screen drawer (position: fixed,
  // whether inline or portaled via PortalContainerProvider) stays INSIDE the
  // frame instead of covering the whole marketing page.
  const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null);
  return (
    <div className={s.root} data-elevated={elevated ? 'true' : undefined}>
      {/* Title bar */}
      <div className={s.titleBar}>
        <div className={s.dots}>
          {DOTS.map((c) => (
            <span key={c} className={s.dot} style={{ '--dot': c } as CSSProperties} />
          ))}
        </div>
        <div className={s.urlPill}>
          <span className={s.urlDot} />
          <span className={s.urlText}>{url}</span>
        </div>
        <div className={s.titleSpacer} />
      </div>

      {/* Content */}
      <div
        ref={setContentEl}
        className={s.content}
        style={height != null ? ({ '--frame-height': `${height}px` } as CSSProperties) : undefined}
      >
        <PortalContainerProvider container={contentEl}>{children}</PortalContainerProvider>
      </div>
    </div>
  );
}

// ── inner product chrome ───────────────────────────────────────────────────────

const NAV: { icon: LucideIcon; label: string; key: string }[] = [
  { icon: LayoutDashboard, label: 'Дашборд', key: 'dashboard' },
  { icon: BookOpen, label: 'Курсы', key: 'courses' },
  { icon: CheckCheck, label: 'Ревью', key: 'reviews' },
  { icon: CalendarDays, label: 'Календарь', key: 'calendar' },
  { icon: Users, label: 'Люди', key: 'users' },
];

export interface MockShellProps {
  active: string;
  title: string;
  /** Right-aligned topbar accessory (e.g. role badge). */
  accessory?: ReactNode;
  /** Hide the left nav rail — for demos that mount a real full-page component
   *  (the rail would be a non-functional duplicate of the real app chrome). */
  noRail?: boolean;
  children: ReactNode;
}

export function MockShell({ active, title, accessory, noRail = false, children }: MockShellProps) {
  return (
    <div className={s.shell}>
      {/* Rail */}
      {!noRail && (
        <aside className={s.rail}>
          <div className={s.brand}>
            <OrbitGlyph size={26} />
            <span className={s.brandName}>School</span>
          </div>
          {NAV.map((n) => {
            const on = n.key === active;
            const I = n.icon;
            return (
              <div key={n.key} className={s.navItem} data-active={on ? 'true' : undefined}>
                <I size={17} strokeWidth={on ? 2.4 : 2} />
                {n.label}
              </div>
            );
          })}
        </aside>
      )}

      {/* Main */}
      <div className={s.main}>
        {/* Topbar */}
        <div className={s.topbar}>
          <span className={s.topTitle}>{title}</span>
          <div className={s.topSpacer} />
          {accessory}
          <div className={s.iconBtn}>
            <Search size={15} />
          </div>
          <div className={s.iconBtn}>
            <Bell size={15} />
          </div>
        </div>

        {/* Scroll body */}
        <div className={s.body}>{children}</div>
      </div>
    </div>
  );
}
