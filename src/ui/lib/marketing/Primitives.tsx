/**
 * Marketing primitives — presentational layout helpers shared across marketing
 * surfaces (orbiter.am site + the School public landing). Pure: props in, markup
 * out. No data, no navigation.
 *
 * Also exports `iconMap` — the single place that maps the string icon keys used
 * in marketing content modules to lucide-react components, so content modules
 * stay JSX-free.
 */

import type { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';
import {
  Building2,
  Calendar,
  CheckCheck,
  Edit3,
  GraduationCap,
  Languages,
  Palette,
  Route,
  Settings,
  Shield,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ViewportBreakpoint } from './useViewport';
import s from './Primitives.module.css';

// ── icon registry ────────────────────────────────────────────────────────────

export const iconMap: Record<string, LucideIcon> = {
  shield: Shield,
  building: Building2,
  palette: Palette,
  languages: Languages,
  route: Route,
  edit: Edit3,
  'check-check': CheckCheck,
  calendar: Calendar,
  'graduation-cap': GraduationCap,
  'user-check': UserCheck,
  users: Users,
  settings: Settings,
};

export function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  color,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const Cmp = iconMap[name] ?? Route;
  return <Cmp size={size} strokeWidth={strokeWidth} color={color} />;
}

// ── layout ───────────────────────────────────────────────────────────────────

export function hPad(bp: ViewportBreakpoint): number {
  return bp === 'mobile' ? 18 : bp === 'tablet' ? 28 : 32;
}

export function Container({
  bp,
  width = 1180,
  children,
  style,
}: {
  bp: ViewportBreakpoint;
  width?: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className={s.container}
      data-bp={bp}
      style={{ '--mk-width': `${width}px`, ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** Section wrapper with consistent vertical rhythm + optional background. */
export function Section({
  bp,
  children,
  background,
  id,
  pad,
  style,
}: {
  bp: ViewportBreakpoint;
  children: ReactNode;
  background?: string;
  id?: string;
  /** vertical padding override [mobile, desktop] */
  pad?: [number, number];
  style?: CSSProperties;
}) {
  const [m, d] = pad ?? [56, 96];
  return (
    <section
      id={id}
      className={s.section}
      style={
        {
          '--mk-bg': background ?? 'transparent',
          '--mk-pad': `${bp === 'mobile' ? m : d}px`,
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </section>
  );
}

// ── typographic atoms ──────────────────────────────────────────────────────────

export function Eyebrow({
  children,
  onDark,
  align = 'left',
}: {
  children: ReactNode;
  onDark?: boolean;
  align?: 'left' | 'center';
}) {
  return (
    <div className={s.eyebrow} data-align={align} data-on-dark={onDark ? 'true' : undefined}>
      {children}
    </div>
  );
}

/** Teal→navy gradient text used for accent words in headlines. */
export function GradientText({ children }: { children: ReactNode }) {
  return <span className={s.gradientText}>{children}</span>;
}

export function SectionHeading({
  bp,
  eyebrow,
  title,
  subtitle,
  onDark,
  align = 'left',
  maxWidth,
}: {
  bp: ViewportBreakpoint;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  onDark?: boolean;
  align?: 'left' | 'center';
  maxWidth?: number;
}) {
  const headingMax = maxWidth ?? (align === 'center' ? 640 : undefined);
  return (
    <div
      className={s.heading}
      data-bp={bp}
      data-align={align}
      data-on-dark={onDark ? 'true' : undefined}
      style={
        headingMax != null ? ({ '--mk-heading-max': `${headingMax}px` } as CSSProperties) : undefined
      }
    >
      {eyebrow && (
        <Eyebrow onDark={onDark} align={align}>
          {eyebrow}
        </Eyebrow>
      )}
      <h2 className={s.headingTitle}>{title}</h2>
      {subtitle && <p className={s.headingSubtitle}>{subtitle}</p>}
    </div>
  );
}

/** Pill badge used in heroes (dot + label). */
export function HeroBadge({ children, onDark }: { children: ReactNode; onDark?: boolean }) {
  return (
    <div className={s.heroBadge} data-on-dark={onDark ? 'true' : undefined}>
      <span className={clsx('orbiter-pulse', s.heroBadgeDot)} />
      {children}
    </div>
  );
}
