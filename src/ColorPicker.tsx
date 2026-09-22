import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { clamp, hsvToRgb, rgbToHex } from './color';
import { useIsPortrait } from './usePortrait';

type Props = {
  title: string;
  initialH: number;
  initialS: number;
  /**
   * The light's current brightness, locked for the picker's lifetime. The
   * plane is hue (horizontal) x saturation (vertical); the brightness sent
   * on pick is always initialV, so picking a color can never change the
   * light's brightness.
   */
  initialV: number;
  onPick: (h: number, s: number, v: number) => void;
  onClose: () => void;
};

export default function ColorPicker({ title, initialH, initialS, initialV, onPick, onClose }: Props) {
  const portrait = useIsPortrait();
  const vLock = Math.round(clamp(initialV, 0, 100));
  const startH = Math.round(clamp(initialH, 0, 360));
  const startS = Math.round(clamp(initialS, 0, 100));
  const [h, setH] = useState<number>(startH);
  const [s, setS] = useState<number>(startS);
  const hsRef = useRef({ h: startH, s: startS });
  const planeRef = useRef<HTMLDivElement | null>(null);
  const dragId = useRef<number | null>(null);

  // 2D plane: horizontal drags pick hue, vertical drags pick saturation
  // (vivid at the top, white at the bottom). Brightness is never touched
  // here; it stays locked at vLock.
  const applyAt = (clientX: number, clientY: number) => {
    const el = planeRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nh = Math.round(clamp(((clientX - rect.left) / rect.width) * 360, 0, 360));
    const ns = Math.round(clamp((1 - (clientY - rect.top) / rect.height) * 100, 0, 100));
    hsRef.current = { h: nh, s: ns };
    setH(nh);
    setS(ns);
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    applyAt(e.clientX, e.clientY);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragId.current !== e.pointerId) return;
    applyAt(e.clientX, e.clientY);
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragId.current !== e.pointerId) return;
    dragId.current = null;
    // Brightness is always the locked initialV: picking a color can never
    // change the light's brightness.
    onPick(hsRef.current.h, hsRef.current.s, vLock);
  };

  // Plane background: vivid hue ramp (horizontal) at full saturation and full
  // brightness for picking, fading vertically to the locked-brightness gray
  // (s = 0). The fade starts from transparent gray -- never the `transparent`
  // keyword, which interpolates through black and washes the plane out.
  const stops: string[] = [];
  for (let hh = 0; hh <= 360; hh += 30) {
    const [sr, sg, sb] = hsvToRgb(hh, 100, 100);
    stops.push(`rgb(${sr}, ${sg}, ${sb}) ${(hh / 360) * 100}%`);
  }
  const gv = Math.round((vLock / 100) * 255);

  const [r, g, b] = hsvToRgb(h, s, vLock);
  const hex = rgbToHex(r, g, b);

  return (
    <div className="absolute inset-0 z-50 bg-bg">
      <div className={portrait ? 'flex h-full flex-col px-6 pt-8 pb-10' : 'flex h-full flex-col pl-14 pr-20 pt-10 pb-12'}>
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="back"
            className="flex size-9 items-center justify-center border border-rule text-near transition active:bg-neutral-soft">
            <BackIcon />
          </button>
          <div className="truncate font-mono text-eyebrow tracking-[0.25em] text-dim uppercase">{title}</div>
        </div>

        <div
          ref={planeRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{
            touchAction: 'none',
            background: `linear-gradient(to bottom, rgba(${gv}, ${gv}, ${gv}, 0), rgb(${gv}, ${gv}, ${gv})), linear-gradient(to right, ${stops.join(', ')})`,
          }}
          className="relative w-full flex-1 cursor-crosshair rounded-lg select-none">
          <div
            aria-hidden
            className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
            style={{
              left: `${(h / 360) * 100}%`,
              top: `${(1 - s / 100) * 100}%`,
              background: `rgb(${r}, ${g}, ${b})`,
            }}
          />
        </div>

        <div className="mt-6 flex gap-4">
          <Readout label="HEX" value={hex} wide />
          <Readout label="R" value={String(r)} />
          <Readout label="G" value={String(g)} />
          <Readout label="B" value={String(b)} />
        </div>
      </div>
    </div>
  );
}

function Readout({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'flex-1' : 'w-20'}>
      <div className="rounded-lg bg-black/40 px-3 py-2 text-center font-mono text-body text-off-white tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-center font-mono text-eyebrow tracking-[0.2em] text-dim uppercase">{label}</div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
