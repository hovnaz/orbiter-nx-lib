import type { CSSProperties, ReactNode } from 'react';

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'gold'
  | 'coral';

export type BadgeVariant = 'soft' | 'solid' | 'outline';
export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: BadgeSize;
  iconLeft?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
}

type Triplet = [bg: string, color: string, border?: string];

const TONES: Record<BadgeTone, Record<BadgeVariant, Triplet>> = {
  neutral: {
    soft: ['var(--neutral-soft)', 'var(--text-secondary)'],
    solid: ['var(--text-primary)', 'var(--bg-elevated)'],
    outline: ['transparent', 'var(--text-secondary)', 'var(--border)'],
  },
  brand: {
    soft: ['var(--teal-soft)', 'var(--teal-pressed)'],
    solid: ['var(--teal)', '#fff'],
    outline: ['transparent', 'var(--teal-pressed)', 'var(--teal)'],
  },
  success: {
    soft: ['var(--success-soft)', '#15803D'],
    solid: ['var(--success)', '#fff'],
    outline: ['transparent', '#15803D', 'var(--success)'],
  },
  warning: {
    soft: ['var(--warning-soft)', '#92400E'],
    solid: ['var(--warning)', '#fff'],
    outline: ['transparent', '#92400E', 'var(--warning)'],
  },
  danger: {
    soft: ['var(--danger-soft)', '#B91C1C'],
    solid: ['var(--danger)', '#fff'],
    outline: ['transparent', '#B91C1C', 'var(--danger)'],
  },
  info: {
    soft: ['var(--info-soft)', '#1D4ED8'],
    solid: ['var(--info)', '#fff'],
    outline: ['transparent', '#1D4ED8', 'var(--info)'],
  },
  gold: {
    soft: ['var(--gold-soft)', '#92570B'],
    solid: ['var(--gold)', '#1E2845'],
    outline: ['transparent', '#92570B', 'var(--gold)'],
  },
  coral: {
    soft: ['var(--coral-soft)', 'var(--coral-pressed)'],
    solid: ['var(--coral)', '#fff'],
    outline: ['transparent', 'var(--coral-pressed)', 'var(--coral)'],
  },
};

const SIZES: Record<
  BadgeSize,
  { fontSize: number; padding: string; gap: number }
> = {
  xs: { fontSize: 10, padding: '2px 6px', gap: 3 },
  sm: { fontSize: 11, padding: '3px 8px', gap: 4 },
  md: { fontSize: 12, padding: '4px 10px', gap: 5 },
};

export function Badge({
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  iconLeft,
  children,
  style,
}: BadgeProps) {
  const [bg, color, border] = TONES[tone][variant];
  const s = SIZES[size];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        background: bg,
        color,
        borderRadius: 'var(--r-pill)',
        fontSize: s.fontSize,
        fontWeight: 600,
        padding: s.padding,
        border: border ? `1px solid ${border}` : 'none',
        letterSpacing: '0.02em',
        ...style,
      }}
    >
      {iconLeft}
      {children}
    </span>
  );
}
