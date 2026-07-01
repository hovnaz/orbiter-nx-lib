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
      style={{
        maxWidth: width,
        margin: '0 auto',
        padding: `0 ${hPad(bp)}px`,
        width: '100%',
        ...style,
      }}
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
      style={{
        background: background ?? 'transparent',
        padding: `${bp === 'mobile' ? m : d}px 0`,
        position: 'relative',
        ...style,
      }}
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
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
        color: onDark ? 'rgba(143,227,212,0.9)' : 'var(--teal)',
        marginBottom: 14,
        textAlign: align,
      }}
    >
      {children}
    </div>
  );
}

/** Teal→navy gradient text used for accent words in headlines. */
export function GradientText({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        background: 'linear-gradient(120deg, var(--teal) 0%, #6FD3C2 45%, var(--gold) 120%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
      }}
    >
      {children}
    </span>
  );
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
  return (
    <div
      style={{
        textAlign: align,
        maxWidth: maxWidth ?? (align === 'center' ? 640 : undefined),
        margin: align === 'center' ? '0 auto' : undefined,
        marginBottom: bp === 'mobile' ? 28 : 44,
      }}
    >
      {eyebrow && (
        <Eyebrow onDark={onDark} align={align}>
          {eyebrow}
        </Eyebrow>
      )}
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: bp === 'mobile' ? 26 : 38,
          lineHeight: 1.12,
          letterSpacing: '-0.025em',
          color: onDark ? '#fff' : 'var(--text-primary)',
          margin: 0,
          textWrap: 'balance',
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontSize: bp === 'mobile' ? 15 : 17,
            lineHeight: 1.6,
            color: onDark ? 'rgba(255,255,255,0.62)' : 'var(--text-secondary)',
            margin: '14px 0 0',
            maxWidth: align === 'center' ? 620 : 640,
            marginLeft: align === 'center' ? 'auto' : undefined,
            marginRight: align === 'center' ? 'auto' : undefined,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** Pill badge used in heroes (dot + label). */
export function HeroBadge({ children, onDark }: { children: ReactNode; onDark?: boolean }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: onDark ? 'rgba(255,255,255,0.06)' : 'var(--teal-soft)',
        backdropFilter: onDark ? 'blur(8px)' : undefined,
        border: onDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(59,188,167,0.25)',
        color: onDark ? '#8FE3D4' : 'var(--teal-pressed)',
        fontSize: 12.5,
        fontWeight: 600,
        padding: '7px 15px',
        borderRadius: 999,
      }}
    >
      <span
        className="orbiter-pulse"
        style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)' }}
      />
      {children}
    </div>
  );
}
