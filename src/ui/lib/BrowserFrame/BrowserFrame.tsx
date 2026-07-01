/**
 * BrowserFrame — a stylized browser window that frames a product mockup so it
 * reads as a real screenshot without needing an actual screenshot.
 *
 * MockShell — the inner product chrome (left nav rail + topbar) shared by every
 * mockup so they all look like the same Orbiter School app.
 *
 * Both are purely presentational; mockups are non-interactive previews.
 */

import { useState, type ReactNode } from 'react';
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

export interface BrowserFrameProps {
  url?: string;
  children: ReactNode;
  /** Fixed content height in px (content scrolls/clips inside). */
  height?: number;
  /** Subtle floating shadow + lift. */
  elevated?: boolean;
}

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
    <div
      style={{
        borderRadius: 'var(--r-lg, 14px)',
        border: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
        boxShadow: elevated ? 'var(--sh-xl)' : 'var(--sh-md)',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: 40,
          padding: '0 14px',
          background: 'var(--bg-section)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', gap: 7 }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <span key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.9 }} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            maxWidth: 520,
            margin: '0 auto',
            height: 24,
            padding: '0 14px',
            borderRadius: 999,
            background: 'var(--bg-page)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: 11.5,
            fontFamily: 'var(--font-mono)',
            overflow: 'hidden',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</span>
        </div>
        <div style={{ width: 52 }} />
      </div>

      {/* Content */}
      <div
        ref={setContentEl}
        style={{
          position: 'relative',
          height,
          maxHeight: height,
          overflow: 'hidden',
          background: 'var(--bg-page)',
          transform: 'translateZ(0)',
        }}
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
    <div style={{ display: 'flex', height: '100%', fontFamily: 'var(--font-body)' }}>
      {/* Rail */}
      {!noRail && (
        <aside
          style={{
            width: 168,
            flexShrink: 0,
            background: 'var(--bg-elevated)',
            borderRight: '1px solid var(--border)',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 16px' }}>
            <OrbitGlyph size={26} />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 14.5,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              School
            </span>
          </div>
          {NAV.map((n) => {
            const on = n.key === active;
            const I = n.icon;
            return (
              <div
                key={n.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 'var(--r-md)',
                  fontSize: 13,
                  fontWeight: on ? 600 : 500,
                  color: on ? 'var(--teal-pressed)' : 'var(--text-secondary)',
                  background: on ? 'var(--teal-soft)' : 'transparent',
                }}
              >
                <I size={17} strokeWidth={on ? 2.4 : 2} />
                {n.label}
              </div>
            );
          })}
        </aside>
      )}

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div
          style={{
            height: 52,
            flexShrink: 0,
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 18px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </span>
          <div style={{ flex: 1 }} />
          {accessory}
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Search size={15} />
          </div>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Bell size={15} />
          </div>
        </div>

        {/* Scroll body */}
        <div style={{ flex: 1, overflow: 'hidden', padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
