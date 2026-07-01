import type { CSSProperties } from 'react';
import s from './OrbitGlyph.module.css';

export interface OrbitGlyphProps {
  size?: number;
}

export function OrbitGlyph({ size = 32 }: OrbitGlyphProps) {
  return (
    <span className={s.root} style={{ '--size': `${size}px` } as CSSProperties}>
      <svg className={s.icon} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,.4)" strokeWidth="1.2" />
        <path d="M12 3.5 L14.2 12 L12 20.5 L9.8 12 Z" fill="white" opacity="0.95" />
        <circle cx="12" cy="12" r="1.5" fill="#072F60" />
      </svg>
      <span className={s.dot} />
    </span>
  );
}
