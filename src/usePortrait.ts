import { useEffect, useState } from 'react';

/**
 * True when the device is in portrait. The daemon pins the viewport at
 * 800x480 in every rotation and rotates the page root with a CSS transform
 * (rotation.js), so window dimensions and the CSS orientation query never
 * report portrait on-device. screen.orientation does (portraitSecondary at
 * 270 degrees), so it is checked first; the other signals cover desktop
 * browsers and older webviews.
 */
function detectPortrait(): boolean {
  try {
    if (screen.orientation?.type.startsWith('portrait')) return true;
  } catch {
    /* older webview */
  }
  try {
    if (window.matchMedia('(orientation: portrait)').matches) return true;
  } catch {
    /* no matchMedia */
  }
  return window.innerHeight > window.innerWidth;
}

export function useIsPortrait(): boolean {
  const [portrait, setPortrait] = useState<boolean>(detectPortrait);

  useEffect(() => {
    const update = () => setPortrait(detectPortrait());
    let orientation: ScreenOrientation | null = null;
    let mq: MediaQueryList | null = null;
    try {
      orientation = screen.orientation;
      orientation.addEventListener('change', update);
      mq = window.matchMedia('(orientation: portrait)');
      mq.addEventListener('change', update);
    } catch {
      /* listeners unavailable */
    }
    // Cold start in portrait: screen.orientation may not be settled on
    // first render; re-check once the page finishes loading.
    window.addEventListener('load', update);
    return () => {
      try {
        orientation?.removeEventListener('change', update);
        mq?.removeEventListener('change', update);
      } catch {
        /* ignore */
      }
      window.removeEventListener('load', update);
    };
  }, []);

  return portrait;
}
