import { useEffect, useState } from 'react';

/**
 * True when the viewport is taller than it is wide (Car Thing portrait is
 * 480x800; landscape is 800x480). Used to switch layouts that assume a
 * landscape viewport, e.g. the dashboard tile grid. Landscape rendering is
 * never affected: every portrait change is gated behind this hook.
 */
export function useIsPortrait(): boolean {
  const [portrait, setPortrait] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(orientation: portrait)');
    const update = () => setPortrait(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return portrait;
}
