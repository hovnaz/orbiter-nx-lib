/**
 * SpotlightTour — a generic spotlight guided-tour overlay (no redux / no router).
 * Dims the screen, spotlights the `[data-tour=target]` element and shows a
 * popover with title/desc/step + Back/Next/Finish. Keyboard: ← → / Esc.
 *
 * The parent owns step state and renders the screen containing the target before
 * changing `target`; this component polls for the element (it may not exist until
 * the screen renders) and positions the spotlight + popover around it. If the
 * target is never found, the popover is centered (graceful fallback).
 *
 * Used by the orbiter marketing /preview and the School public /demo.
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import s from './SpotlightTour.module.css';

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOT_PAD = 8;
const POPOVER_WIDTH = 360;
const POPOVER_EST_HEIGHT = 210;

export interface SpotlightTourProps {
  target: string;
  title: string;
  desc: string;
  index: number;
  total: number;
  labels: { back: string; next: string; finish: string; exit: string };
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  /** Extra control rendered in the popover (e.g. an "open editor" button). */
  extra?: ReactNode;
}

export function SpotlightTour({
  target,
  title,
  desc,
  index,
  total,
  labels,
  onPrev,
  onNext,
  onClose,
  extra,
}: SpotlightTourProps) {
  const [rect, setRect] = useState<Box | null>(null);
  const isFirst = index === 0;
  const isLast = index === total - 1;

  // Poll for the target element (the screen may still be switching in).
  useEffect(() => {
    setRect(null);
    let cancelled = false;
    let tries = 0;
    let timer = window.setTimeout(function tick() {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
      if (el) {
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
          return;
        }
      }
      tries += 1;
      if (tries < 45) timer = window.setTimeout(tick, 120);
      else setRect(null);
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [target]);

  // Keep the spotlight glued to the element on scroll/resize.
  useEffect(() => {
    const update = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [target]);

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext, onPrev, onClose]);

  const spot: Box | null = rect
    ? {
        top: Math.max(rect.top - SPOT_PAD, 0),
        left: Math.max(rect.left - SPOT_PAD, 0),
        width: rect.width + SPOT_PAD * 2,
        height: rect.height + SPOT_PAD * 2,
      }
    : null;

  const pop = popoverPosition(spot);

  return (
    <div className={s.root}>
      {spot ? (
        <div
          className={s.spotlight}
          style={
            {
              '--spot-top': `${spot.top}px`,
              '--spot-left': `${spot.left}px`,
              '--spot-width': `${spot.width}px`,
              '--spot-height': `${spot.height}px`,
            } as CSSProperties
          }
        />
      ) : (
        <div className={s.fullDim} />
      )}

      <div
        className={s.popover}
        data-centered={pop ? undefined : 'true'}
        style={
          pop
            ? ({ '--pop-top': `${pop.top}px`, '--pop-left': `${pop.left}px` } as CSSProperties)
            : undefined
        }
      >
        <div className={s.popHeader}>
          <strong className={s.title}>{title}</strong>
          <button type="button" onClick={onClose} aria-label={labels.exit} title={labels.exit} className={s.close}>
            ×
          </button>
        </div>
        <p className={s.desc}>{desc}</p>
        {extra}
        <div className={s.footer}>
          <span className={s.counter}>
            {index + 1} / {total}
          </span>
          <div className={s.actions}>
            {!isFirst && (
              <button type="button" onClick={onPrev} className={s.btn} data-variant="secondary">
                {labels.back}
              </button>
            )}
            <button type="button" onClick={onNext} className={s.btn} data-variant="primary">
              {isLast ? labels.finish : labels.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compute the popover anchor (top/left in px). Returns null when there is no
 * spotlight rect — the popover then renders centered via CSS. The geometry
 * depends on window size + spot, so it cannot be expressed as a static class.
 */
function popoverPosition(spot: Box | null): { top: number; left: number } | null {
  if (!spot) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const below = spot.top + spot.height + 12;
  const placeBelow = below + POPOVER_EST_HEIGHT < vh;
  const top = placeBelow ? below : Math.max(spot.top - POPOVER_EST_HEIGHT - 12, 12);
  let left = spot.left;
  if (left + POPOVER_WIDTH + 16 > vw) left = Math.max(vw - POPOVER_WIDTH - 16, 16);
  return { top, left };
}
