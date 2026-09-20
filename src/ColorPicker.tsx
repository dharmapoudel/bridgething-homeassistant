import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { clamp, hsvToRgb, rgbToHex } from './color';

type Props = {
  title: string;
  initialH: number;
  initialS: number;
  /** The light's current brightness. Locked for the picker's lifetime: picking a color never changes brightness. */
  initialV: number;
  onPick: (h: number, s: number, v: number) => void;
  onClose: () => void;
};

type Sel = { h: number; s: number; v: number };

export default function ColorPicker({ title, initialH, initialS, initialV, onPick, onClose }: Props) {
  const [sel, setSel] = useState<Sel>({ h: initialH, s: initialS, v: initialV });
  const selRef = useRef<Sel>(sel);
  const planeRef = useRef<HTMLDivElement | null>(null);
  const hueRef = useRef<HTMLDivElement | null>(null);
  const planeDrag = useRef<number | null>(null);
  const hueDrag = useRef<number | null>(null);

  const applySel = (next: Sel) => {
    selRef.current = next;
    setSel(next);
  };

  // Plane is hue (horizontal) x saturation (vertical). Brightness stays locked
  // at initialV: drags change hue and saturation only, never brightness.
  const planePos = (clientX: number, clientY: number): Sel | null => {
    const el = planeRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const h = Math.round(clamp(((clientX - rect.left) / rect.width) * 360, 0, 360));
    const s = Math.round(clamp((1 - (clientY - rect.top) / rect.height) * 100, 0, 100));
    return { ...selRef.current, h, s };
  };

  const onPlaneDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    planeDrag.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    const next = planePos(e.clientX, e.clientY);
    if (next) applySel(next);
  };
  const onPlaneMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (planeDrag.current !== e.pointerId) return;
    const next = planePos(e.clientX, e.clientY);
    if (next) applySel(next);
  };
  const onPlaneUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (planeDrag.current !== e.pointerId) return;
    planeDrag.current = null;
    const s = selRef.current;
    onPick(s.h, s.s, s.v);
  };

  const hueAt = (clientX: number): number | null => {
    const el = hueRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return Math.round(clamp(((clientX - rect.left) / rect.width) * 360, 0, 360));
  };

  const onHueDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    hueDrag.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    const h = hueAt(e.clientX);
    if (h != null) applySel({ ...selRef.current, h });
  };
  const onHueMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (hueDrag.current !== e.pointerId) return;
    const h = hueAt(e.clientX);
    if (h != null) applySel({ ...selRef.current, h });
  };
  const onHueUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (hueDrag.current !== e.pointerId) return;
    hueDrag.current = null;
    const s = selRef.current;
    onPick(s.h, s.s, s.v);
  };

  const [r, g, b] = hsvToRgb(sel.h, sel.s, sel.v);
  const hex = rgbToHex(r, g, b);

  return (
    <div className="absolute inset-0 z-50 bg-bg">
      <div className="flex h-full flex-col px-14 pt-10 pb-12">
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
          onPointerDown={onPlaneDown}
          onPointerMove={onPlaneMove}
          onPointerUp={onPlaneUp}
          onPointerCancel={onPlaneUp}
          style={{
            touchAction: 'none',
            background: `linear-gradient(to bottom, transparent, #fff), linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)`,
          }}
          className="relative w-full flex-1 cursor-crosshair rounded-lg select-none">
          <div
            aria-hidden
            className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
            style={{
              left: `${(sel.h / 360) * 100}%`,
              top: `${100 - sel.s}%`,
              background: `rgb(${r}, ${g}, ${b})`,
            }}
          />
        </div>

        <div
          ref={hueRef}
          onPointerDown={onHueDown}
          onPointerMove={onHueMove}
          onPointerUp={onHueUp}
          onPointerCancel={onHueUp}
          style={{
            touchAction: 'none',
            background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
          }}
          className="relative mt-6 h-9 w-full cursor-crosshair rounded-md select-none">
          <div
            aria-hidden
            className="absolute top-1/2 h-11 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
            style={{ left: `${(sel.h / 360) * 100}%` }}
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
