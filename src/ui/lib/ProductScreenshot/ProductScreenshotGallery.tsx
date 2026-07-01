/**
 * ProductScreenshotGallery — a responsive grid of framed product screenshots.
 * Presentational: the caller passes the items (URLs + captions); the gallery
 * only lays them out and applies a staggered scroll reveal.
 */

import { type CSSProperties } from 'react';
import { useViewport, type ViewportBreakpoint } from '../marketing/useViewport';
import { RevealStagger } from '../marketing/Motion';
import { ProductScreenshot, type ProductScreenshotProps } from './ProductScreenshot';
import s from './ProductScreenshotGallery.module.css';

export type ProductScreenshotGalleryItem = Pick<
  ProductScreenshotProps,
  'src' | 'src2x' | 'alt' | 'url' | 'caption' | 'tilt'
>;

export interface ProductScreenshotGalleryProps {
  items: ProductScreenshotGalleryItem[];
  /** Columns on desktop (mobile is always 1). Default 2. */
  columns?: 1 | 2 | 3;
  /** Pass an external breakpoint, else the component reads its own. */
  bp?: ViewportBreakpoint;
  /** Grid gap in px. Default 24. */
  gap?: number;
  /** Fixed image ratio so the grid stays tidy. Default `'16 / 10'`. */
  aspectRatio?: string;
  /** Stagger the reveal of each shot (default true). */
  stagger?: boolean;
  style?: CSSProperties;
}

export function ProductScreenshotGallery({
  items,
  columns = 2,
  bp,
  gap = 24,
  aspectRatio = '16 / 10',
  stagger = true,
  style,
}: ProductScreenshotGalleryProps) {
  const ownBp = useViewport();
  const isMobile = (bp ?? ownBp) === 'mobile';

  const gridStyle = {
    '--psg-gap': typeof gap === 'number' ? `${gap}px` : gap,
    '--psg-cols': isMobile ? '1fr' : `repeat(${columns}, 1fr)`,
    ...style,
  } as CSSProperties;

  const shots = items.map((it, i) => (
    <ProductScreenshot
      key={it.src || i}
      src={it.src}
      src2x={it.src2x}
      alt={it.alt}
      url={it.url}
      caption={it.caption}
      tilt={it.tilt}
      aspectRatio={aspectRatio}
      width={9999}
      reveal={false}
    />
  ));

  if (stagger) {
    return (
      <RevealStagger gap={80} className={s.root} style={gridStyle}>
        {shots}
      </RevealStagger>
    );
  }
  return (
    <div className={s.root} style={gridStyle}>
      {shots}
    </div>
  );
}
