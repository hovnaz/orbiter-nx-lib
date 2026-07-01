/**
 * Marketing motion — lightweight scroll-motion primitives shared across
 * marketing surfaces (orbiter.am site + the School public landing).
 *
 * - useReducedMotion — honours the OS "reduce motion" setting
 * - <Reveal>         — IntersectionObserver fade-up on first enter (class
 *                      `orbiter-reveal` / `is-visible`, keyframes live in
 *                      #styles global.scss)
 * - <RevealStagger>  — wraps each child in <Reveal> with a progressive delay
 * - useCountUp       — counts 0 → target once scrolled into view
 */

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export interface RevealProps {
  children: ReactNode;
  /** Animation delay in ms — handy for stagger. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

export function Reveal({ children, delay = 0, className, style }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={'orbiter-reveal' + (className ? ' ' + className : '')}
      style={{ '--reveal-delay': delay + 'ms', ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}

export interface RevealStaggerProps {
  children: ReactNode;
  /** Per-child delay step in ms (default 70). */
  gap?: number;
  baseDelay?: number;
  style?: CSSProperties;
  className?: string;
}

export function RevealStagger({
  children,
  gap = 70,
  baseDelay = 0,
  style,
  className,
}: RevealStaggerProps) {
  const arr = Children.toArray(children);
  return (
    <div style={style} className={className}>
      {arr.map((c, i) => {
        const key = isValidElement(c) ? (c as ReactElement).key ?? i : i;
        return (
          <Reveal key={key} delay={baseDelay + i * gap}>
            {c}
          </Reveal>
        );
      })}
    </div>
  );
}

/**
 * Counts a number 0 → `target` over `duration` ms once the host element scrolls
 * into view. Returns `[formatted, ref]` — attach `ref` to the trigger element.
 */
export function useCountUp(
  target: number,
  options: { duration?: number; decimals?: number } = {},
): [string, React.RefObject<HTMLDivElement | null>] {
  const { duration = 1400, decimals = 0 } = options;
  const [n, setN] = useState(0);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduced) {
      setN(target);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        const t0 = performance.now();
        const step = (t: number) => {
          const u = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - u, 3);
          setN(target * eased);
          if (u < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        obs.disconnect();
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [target, duration, reduced]);

  const formatted = decimals ? n.toFixed(decimals) : Math.round(n).toString();
  return [formatted, ref];
}
