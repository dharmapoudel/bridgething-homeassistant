import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { clamp, hsvToRgb, rgbToHex } from './color';

type Props = {
  title: string;
  initialH: number;
  initialS: number;
  /**
   * The light's current saturation and brightness. Both are locked for the
   * picker's lifetime: dragging changes hue only, so picking a color can never
   * change the light's intensity. (A white light reports saturation 0, which
   * would leave no color to pick, so we fall back to full saturation there.)
   */
  initialV: number;
  onPick: (h: number, s: number, v: number) => void;
  onClose: () => void;
};

export default function ColorPicker({ title, initialH, initialS, initialV, onPick, onClose }: Props) {
  const sLock = initialS >= 20 ? Math.round(initialS) : 100;
  const [h, setH] = useState<number>(Math.round(initialH));
  const hRef = useRef(h);
  const planeRef = useRef<HTMLDivElement | null>(null);
  const dragId = useRef<number | null>(null);

  const applyH = (nh: number) => {
    hRef.current = nh;
    setH(nh);
  };

  // The plane is hue only (horizontal). Vertical drags are intentionally
  // ignored: saturation and brightness stay locked, so the light's intensity
  // can never change from dragging.
  const hueAt = (clientX: number): number | null => {
    const el = planeRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return Math.round(clamp(((clientX - rect.left) / rect.width) * 360, 0, 360));
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    const nh = hueAt(e.clientX);
    if (nh != null) applyH(nh);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragId.current !== e.pointerId) return;
    const nh = hueAt(e.clientX);
    if (nh != null) applyH(nh);
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragId.current !== e.pointerId) return;
    dragId.current = null;
    onPick(hRef.current, sLock, initialV);
  };

  // Hue ramp rendered at the locked saturation, so the plane shows exactly the
  // colors the dot can pick. Darkens toward the bottom as brightness context;
  // the dot sits at the height of the light's current brightness.
  const stops: string[] = [];
  for (let hh = 0; hh <= 360; hh += 30) {
    const [sr, sg, sb] = hsvToRgb(hh, sLock, 100);
    stops.push(`rgb(${sr}, ${sg}, ${sb}) ${(hh / 360) * 100}%`);
  }

  const [r, g, b] = hsvToRgb(h, sLock, initialV);
  const hex = rgbToHex(r, g, b);

  return (
    <div className="absolute inset-0 z-50 bg-bg">
      <div className="flex h-full flex-col pl-14 pr-20 pt-10 pb-12">
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
            background: `linear-gradient(to bottom, transparent, rgba(0,0,0,0.85)), linear-gradient(to right, ${stops.join(', ')})`,
          }}
          className="relative w-full flex-1 cursor-crosshair rounded-lg select-none">
          <div
            aria-hidden
            className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
            style={{
              left: `${(h / 360) * 100}%`,
              top: `${100 - initialV}%`,
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
