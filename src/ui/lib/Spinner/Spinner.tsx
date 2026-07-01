import type { CSSProperties } from 'react';
import s from './Spinner.module.css';

export interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 18, color = 'var(--teal)' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={s.root}
      style={
        {
          '--spinner-size': `${size}px`,
          '--spinner-color': color,
          '--spinner-track': `${color}33`,
        } as CSSProperties
      }
    />
  );
}
