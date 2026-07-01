import type { CSSProperties } from 'react';
import s from './StatusDot.module.css';

export type StatusTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatusDotProps {
  tone?: StatusTone;
  size?: number;
  pulse?: boolean;
}

export function StatusDot({ tone = 'brand', size = 8, pulse = false }: StatusDotProps) {
  return (
    <span
      className={s.root}
      data-tone={tone}
      data-pulse={pulse ? 'true' : undefined}
      style={{ '--dot-size': `${size}px` } as CSSProperties}
    />
  );
}
