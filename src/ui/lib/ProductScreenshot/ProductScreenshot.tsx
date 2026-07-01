/**
 * ProductScreenshot — frames a REAL raster screenshot (PNG/WebP) so it reads
 * like a polished product shot (the "skillspace.ru" effect): browser chrome
 * (via BrowserFrame) + soft layered shadow + optional gradient glow + optional
 * perspective tilt + scroll fade-in.
 *
 * Purely presentational: props in, callbacks out. The image is referenced by a
 * URL string (e.g. `/screenshots/dashboard.webp`) so a missing file degrades to
 * a friendly fallback panel instead of a broken image — the page never breaks
 * even before screenshots are captured.
 */

import { useState, type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';
import { ImageOff } from 'lucide-react';
import { BrowserFrame } from '../BrowserFrame';
import { Reveal, useReducedMotion } from '../marketing/Motion';
import s from './ProductScreenshot.module.css';

export interface ProductScreenshotProps {
  /** Image URL (served from the app `public/` dir, e.g. `/screenshots/dashboard.webp`). */
  src: string;
  /** Optional retina source → emitted as `srcSet "<src> 1x, <src2x> 2x"`. */
  src2x?: string;
  /** Alt text (required for accessibility). */
  alt: string;
  /** Address-bar label shown in the browser chrome. */
  url?: string;
  /** Max width of the framed shot in px. */
  width?: number;
  /** Fix the image box ratio (e.g. `'16 / 10'`) to avoid layout shift + keep a grid tidy. */
  aspectRatio?: string;
  /** Subtle 3D perspective tilt. `true` = default angle, or a rotateY degree number. */
  tilt?: boolean | number;
  /** Box-shadow override for the frame. */
  shadow?: string;
  /** Soft radial glow behind the frame. `true` = teal default, or a CSS color. */
  glow?: boolean | string;
  /** Wrap in a scroll fade-in (default true). Set false when already inside a <Reveal>. */
  reveal?: boolean;
  /** Eager-load + high priority (use for above-the-fold hero shots). */
  priority?: boolean;
  /** Caption under the frame. */
  caption?: ReactNode;
  /** Custom fallback when the image is missing/fails to load. */
  fallback?: ReactNode;
  style?: CSSProperties;
  className?: string;
  onError?: () => void;
  onLoad?: () => void;
}

const DEFAULT_SHADOW =
  '0 8px 24px rgba(33,45,62,0.10), 0 30px 60px rgba(15,30,60,0.14)';

function tiltTransform(tilt: boolean | number | undefined, reduced: boolean): string | undefined {
  if (!tilt || reduced) return undefined;
  if (typeof tilt === 'number') return `perspective(1400px) rotateY(${tilt}deg)`;
  return 'perspective(1400px) rotateX(4deg) rotateY(-7deg)';
}

export function ProductScreenshot({
  src,
  src2x,
  alt,
  url = 'school.orbiter.am',
  width = 940,
  aspectRatio,
  tilt = false,
  shadow = DEFAULT_SHADOW,
  glow = false,
  reveal = true,
  priority = false,
  caption,
  fallback,
  style,
  className,
  onError,
  onLoad,
}: ProductScreenshotProps) {
  const reduced = useReducedMotion();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  const glowColor = glow === true ? 'rgba(59,188,167,0.22)' : typeof glow === 'string' ? glow : null;
  const transform = tiltTransform(tilt, reduced);

  const fallbackPanel = fallback ?? (
    <div
      className={s.fallback}
      style={
        aspectRatio ? ({ '--ps-ratio': aspectRatio } as CSSProperties) : undefined
      }
    >
      <ImageOff size={28} strokeWidth={1.6} />
      <span className={s.fallbackLabel}>Скриншот скоро будет</span>
      <span className={s.fallbackSrc}>{src}</span>
    </div>
  );

  const figureStyle = {
    '--ps-width': typeof width === 'number' ? `${width}px` : width,
    ...style,
  } as CSSProperties;

  const frameStyle = {
    '--ps-shadow': shadow,
    ...(transform ? { '--ps-tilt': transform } : {}),
  } as CSSProperties;

  const frame = (
    <figure className={clsx(s.root, className)} style={figureStyle}>
      {glowColor && (
        <div
          aria-hidden
          className={s.glow}
          style={{ '--ps-glow': glowColor } as CSSProperties}
        />
      )}
      <div className={s.frame} data-tilt={transform ? '' : undefined} style={frameStyle}>
        <BrowserFrame url={url} elevated={false}>
          {status === 'error' ? (
            fallbackPanel
          ) : (
            <img
              src={src}
              srcSet={src2x ? `${src} 1x, ${src2x} 2x` : undefined}
              alt={alt}
              loading={priority ? 'eager' : 'lazy'}
              decoding={priority ? 'sync' : 'async'}
              onLoad={() => {
                setStatus('ok');
                onLoad?.();
              }}
              onError={() => {
                setStatus('error');
                onError?.();
              }}
              className={s.image}
              data-ratio={aspectRatio ? '' : undefined}
              style={
                aspectRatio ? ({ '--ps-ratio': aspectRatio } as CSSProperties) : undefined
              }
            />
          )}
        </BrowserFrame>
      </div>
      {caption && <figcaption className={s.caption}>{caption}</figcaption>}
    </figure>
  );

  return reveal && !reduced ? <Reveal>{frame}</Reveal> : frame;
}
