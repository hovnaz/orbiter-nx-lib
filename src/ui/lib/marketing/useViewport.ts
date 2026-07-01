import { useEffect, useState } from 'react';

export type ViewportBreakpoint = 'mobile' | 'tablet' | 'desktop';

function read(): ViewportBreakpoint {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Reactive viewport breakpoint. Marketing sections branch on this to pick
 * mobile vs desktop layouts; tablet usually falls through to a 2-col variant.
 */
export function useViewport(): ViewportBreakpoint {
  const [bp, setBp] = useState<ViewportBreakpoint>(read);
  useEffect(() => {
    const onResize = () => setBp(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return bp;
}

export function useIsMobile(): boolean {
  return useViewport() === 'mobile';
}
