import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { clamp, hsvToRgb, rgbToHex } from './color';

type Props = {
  title: string;
  initialH: number;
  initialS: number;
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

  const planePos = (clientX: number, clientY: number): { s: number; v: number } | null => {
    const el = planeRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      s: Math.round(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100)),
      v: Math.round(clamp((1 - (clientY - rect.top) / rect.height) * 100, 1, 100)),
    };
  };

  const onPlaneDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    planeDrag.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = planePos(e.clientX, e.clientY);
    if (p) applySel({ ...selRef.current, s: p.s, v: p.v });
  };
  const onPlaneMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (planeDrag.current !== e.pointerId) return;
    const p = planePos(e.clientX, e.clientY);
    if (p) applySel({ ...selRef.current, s: p.s, v: p.v });
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
  const hueCss = `hsl(${sel.h}, 100%, 50%)`;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className="w-[620px] max-w-[94%] rounded-2xl border border-rule p-5"
        style={{ background: 'color-mix(in srgb, var(--color-fg) 10%, var(--color-screen))' }}>
        <div className="mb-4 flex items-center justify-between">
          <div className="truncate font-display text-title font-medium tracking-display text-off-white">{title}</div>
          <button
            onClick={onClose}
            aria-label="close color picker"
            className="flex size-10 items-center justify-center rounded-full border border-edge text-xl text-near active:bg-neutral-soft">
            ✕
          </button>
        </div>

        <div
          ref={planeRef}
          onPointerDown={onPlaneDown}
          onPointerMove={onPlaneMove}
          onPointerUp={onPlaneUp}
          onPointerCancel={onPlaneUp}
          style={{
            touchAction: 'none',
            background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, ${hueCss})`,
          }}
          className="relative h-52 w-full cursor-crosshair rounded-lg select-none">
          <div
            aria-hidden
            className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
            style={{ left: `${sel.s}%`, top: `${100 - sel.v}%`, background: `rgb(${r}, ${g}, ${b})` }}
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
            background:
              'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
          }}
          className="relative mt-3 h-9 w-full cursor-crosshair rounded-md select-none">
          <div
            aria-hidden
            className="absolute top-1/2 h-11 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
            style={{ left: `${(sel.h / 360) * 100}%` }}
          />
        </div>

        <div className="mt-4 flex gap-3">
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
      <div className="rounded-lg bg-black/40 px-3 py-2.5 text-center font-mono text-body text-off-white tabular-nums">
        {value}
      </div>
      <div className="mt-1.5 text-center font-mono text-eyebrow tracking-[0.2em] text-dim uppercase">{label}</div>
    </div>
  );
}
