import type { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';
import s from './Badge.module.css';

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

export function Badge({
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  iconLeft,
  children,
  style,
}: BadgeProps) {
  return (
    <span
      className={clsx(s.root)}
      data-tone={tone}
      data-variant={variant}
      data-size={size}
      style={style}
    >
      {iconLeft}
      {children}
    </span>
  );
}
