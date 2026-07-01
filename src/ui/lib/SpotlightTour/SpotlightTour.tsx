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

  return (
    <div style={containerStyle}>
      {spot ? (
        <div style={{ ...spotlightStyle, top: spot.top, left: spot.left, width: spot.width, height: spot.height }} />
      ) : (
        <div style={fullDimStyle} />
      )}

      <div style={popoverStyle(spot)}>
        <div style={popHeaderStyle}>
          <strong style={{ fontSize: 15 }}>{title}</strong>
          <button type="button" onClick={onClose} aria-label={labels.exit} title={labels.exit} style={closeStyle}>
            ×
          </button>
        </div>
        <p style={descStyle}>{desc}</p>
        {extra}
        <div style={footerStyle}>
          <span style={counterStyle}>
            {index + 1} / {total}
          </span>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {!isFirst && (
              <button type="button" onClick={onPrev} style={secondaryBtnStyle}>
                {labels.back}
              </button>
            )}
            <button type="button" onClick={onNext} style={primaryBtnStyle}>
              {isLast ? labels.finish : labels.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const containerStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 2147483646,
  pointerEvents: 'auto',
};

const spotlightStyle: CSSProperties = {
  position: 'fixed',
  borderRadius: 12,
  boxShadow: '0 0 0 9999px rgba(6, 18, 39, 0.66)',
  pointerEvents: 'none',
  transition: 'top 220ms var(--ease-out), left 220ms var(--ease-out), width 220ms var(--ease-out), height 220ms var(--ease-out)',
};

const fullDimStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(6, 18, 39, 0.66)',
  pointerEvents: 'none',
};

function popoverStyle(spot: Box | null): CSSProperties {
  const base: CSSProperties = {
    position: 'fixed',
    width: POPOVER_WIDTH,
    maxWidth: 'calc(100vw - 32px)',
    zIndex: 2147483647,
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    boxShadow: 'var(--sh-xl)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  };
  if (!spot) return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const below = spot.top + spot.height + 12;
  const placeBelow = below + POPOVER_EST_HEIGHT < vh;
  const top = placeBelow ? below : Math.max(spot.top - POPOVER_EST_HEIGHT - 12, 12);
  let left = spot.left;
  if (left + POPOVER_WIDTH + 16 > vw) left = Math.max(vw - POPOVER_WIDTH - 16, 16);
  return { ...base, top, left };
}

const descStyle: CSSProperties = { margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' };
const footerStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 4 };
const counterStyle: CSSProperties = { fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'var(--font-mono)' };
const popHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 };
const closeStyle: CSSProperties = {
  flexShrink: 0,
  width: 28,
  height: 28,
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-muted)',
  fontSize: 18,
  lineHeight: 1,
  cursor: 'pointer',
};
const primaryBtnStyle: CSSProperties = {
  padding: '7px 16px',
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  background: 'var(--teal)',
  color: '#fff',
};
const secondaryBtnStyle: CSSProperties = {
  padding: '7px 14px',
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 8,
  cursor: 'pointer',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-primary)',
};
