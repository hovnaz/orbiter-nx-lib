import type { CSSProperties } from 'react';
import s from './ProgressBar.module.css';

export type ProgressTone = 'brand' | 'success' | 'info' | 'warning';

export interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: ProgressTone;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  tone = 'brand',
  height = 6,
  showLabel = false,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={s.root}>
      <div className={s.track} style={{ '--h': `${height}px` } as CSSProperties}>
        <div
          className={s.fill}
          data-tone={tone}
          style={{ '--w': `${pct}%` } as CSSProperties}
        />
      </div>
      {showLabel && (
        <div className={s.label}>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
    </div>
  );
}
