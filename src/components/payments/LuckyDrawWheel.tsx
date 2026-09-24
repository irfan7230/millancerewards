
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Trophy, Sparkles } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { Prize } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface WheelSegment {
  label: string;
  sublabel?: string;
  value?: number;
  isWin: boolean;
  color: string;      // wedge fill
}

interface Props {
  open: boolean;
  prizes: Prize[];          // real franchise prizes; up to 9 are placed on the wheel
  onClose: () => void;
}

const SEGMENT_COLORS = [
  '#4F46E5', '#7C3AED', '#DB2777', '#E11D48', '#EA580C',
  '#F59E0B', '#16A34A', '#0891B2', '#2563EB', '#334155',
];

// Build 10 segments: up to 9 real prizes + a "Better luck next time" wedge.
function buildSegments(prizes: Prize[]): WheelSegment[] {
  const top = [...prizes].sort((a, b) => b.value - a.value).slice(0, 9);
  const segments: WheelSegment[] = top.map((p, i) => ({
    label: shorten(p.name),
    sublabel: formatCurrency(p.value),
    value: p.value,
    isWin: true,
    color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
  }));
  // Pad to 9 if the franchise has fewer prizes (keeps the wheel balanced).
  while (segments.length < 9) {
    segments.push({ label: 'Bonus Reward', isWin: true, color: SEGMENT_COLORS[segments.length % SEGMENT_COLORS.length] });
  }
  segments.push({ label: 'Better luck', sublabel: 'next time', isWin: false, color: '#475569' });
  return segments;
}

function shorten(name: string): string {
  return name.length > 16 ? `${name.slice(0, 15)}…` : name;
}

// Uniform random winner index.
function pickWinningIndex(count: number): number {
  return Math.floor(Math.random() * count);
}

// ── Spin controller ───────────────────────────────────────────────────────────
// Returns the current rotation (deg) and a start() that eases to a target that
// centers `winningIndex` under the top pointer (12 o'clock).
function useSpin(segmentCount: number) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const spinTo = (winningIndex: number, durationMs: number, onDone: () => void) => {
    const seg = 360 / segmentCount;
    // Center of the winning wedge, measured clockwise from 12 o'clock.
    const segCenter = winningIndex * seg + seg / 2;
    // We rotate the wheel so that segCenter lands at the top (0deg / pointer).
    const spins = 6; // full rotations for drama
    const target = spins * 360 + (360 - segCenter);
    setSpinning(true);
    // Set the CSS transition target on the next frame.
    requestAnimationFrame(() => setRotation(target));
    window.setTimeout(() => { setSpinning(false); onDone(); }, durationMs);
  };

  const reset = () => { setSpinning(false); setRotation(0); };

  return { rotation, spinning, spinTo, reset };
}

// ── Component ───────────────────────────────────────────────────────────────
export function LuckyDrawWheel({ open, prizes, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const segments = useMemo(() => buildSegments(prizes), [prizes]);
  const { rotation, spinning, spinTo, reset } = useSpin(segments.length);

  const [phase, setPhase] = useState<'idle' | 'spinning' | 'revealed'>('idle');
  const [winIndex, setWinIndex] = useState<number | null>(null);

  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const SPIN_MS = reducedMotion ? 800 : 6000;

  // Open/close the native dialog + auto-start the spin.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open) {
      if (!d.open) d.showModal();
      // reset then kick off the spin shortly after the popup animates in
      reset();
      setPhase('idle');
      setWinIndex(null);
      const idx = pickWinningIndex(segments.length);
      const t = window.setTimeout(() => {
        setPhase('spinning');
        setWinIndex(idx);
        spinTo(idx, SPIN_MS, () => setPhase('revealed'));
      }, 650);
      return () => window.clearTimeout(t);
    } else if (d.open) {
      d.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const won = winIndex !== null ? segments[winIndex] : null;
  const canClose = phase === 'revealed';

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => { if (!canClose) e.preventDefault(); else onClose(); }}
      onClick={(e) => { if (e.target === dialogRef.current && canClose) onClose(); }}
      className={cn(
        // The dialog fills the viewport; ::backdrop provides the blurred layer.
        // Uses fixed inset-0 + dvh (via .lucky-dialog CSS) so there's no bottom
        // gap from mobile browser chrome (100vh quirk).
        'lucky-dialog bg-transparent p-0',
        '[&:not([open])]:hidden',
      )}
    >
      {/* Blurred, dimmed stage — fills the dialog (which is fixed inset-0) */}
      <div className="relative w-full h-full flex flex-col items-center justify-center px-4 py-8 overflow-y-auto overflow-x-hidden">
        {/* animated gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-brand-950/95 to-slate-900 animate-ld-fade" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] max-w-[90vw] max-h-[90vw] rounded-full bg-brand-500/20 blur-[120px] pointer-events-none" />

        {/* Confetti on reveal */}
        {phase === 'revealed' && won?.isWin && <Confetti />}

        {/* Close (only after reveal) */}
        {canClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 z-30 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Heading */}
        <div className="relative z-20 text-center mb-6 animate-ld-rise">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-widest text-amber-300">
            <Sparkles className="h-3.5 w-3.5" /> Payment Reward Draw
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-black text-white tracking-tight">
            {phase === 'revealed' ? (won?.isWin ? '🎉 You Won!' : 'Better Luck Next Time') : 'Spinning the wheel…'}
          </h2>
          <p className="mt-1 text-sm text-white/60">
            {phase === 'revealed'
              ? (won?.isWin ? 'A little thank-you for staying active.' : 'Keep paying monthly for more chances to win.')
              : 'Every on-time payment gets a spin.'}
          </p>
        </div>

        {/* Wheel */}
        <div
          className="relative z-20"
          style={{ width: 'min(78vw, 22rem)', height: 'min(78vw, 22rem)' }}
        >
          {/* Fixed pointer at 12 o'clock */}
          <div className="absolute left-1/2 -top-1 -translate-x-1/2 z-30">
            <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[22px] border-l-transparent border-r-transparent border-t-amber-400 drop-shadow-lg" />
          </div>

          {/* Rotating wheel */}
          <div
            className="absolute inset-0"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.9, 0.2, 1)` : 'none',
            }}
          >
            <WheelSvg segments={segments} winIndex={phase === 'revealed' ? winIndex : null} />
          </div>

          {/* Center hub */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 h-[22%] w-[22%] rounded-full bg-white shadow-xl flex items-center justify-center">
            <div className="h-[62%] w-[62%] rounded-full bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center">
              <Trophy className="h-1/2 w-1/2 text-white" />
            </div>
          </div>
        </div>

        {/* Reveal card */}
        {phase === 'revealed' && won && (
          <div className="relative z-20 mt-8 w-full max-w-sm animate-ld-pop">
            <div className={cn(
              'rounded-2xl border p-5 text-center backdrop-blur-md',
              won.isWin ? 'bg-white/10 border-amber-400/40' : 'bg-white/5 border-white/15',
            )}>
              {won.isWin ? (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">Your Prize</p>
                  <p className="text-xl font-black text-white mt-1">{won.label}</p>
                  {won.sublabel && <p className="text-sm font-mono text-emerald-300 mt-0.5">{won.sublabel}</p>}
                  <p className="text-xs text-white/50 mt-2">Our team will reach out about your reward.</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-white">No prize this time</p>
                  <p className="text-sm text-white/60 mt-1">You’re still entered in this month’s main lucky draw.</p>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full h-11 rounded-xl bg-white text-brand-700 font-bold hover:bg-white/90 transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}

// ── SVG wheel ─────────────────────────────────────────────────────────────────
// Pure SVG pie chart: each segment is an arc path; labels sit along each wedge.
function WheelSvg({ segments, winIndex }: { segments: WheelSegment[]; winIndex: number | null }) {
  const R = 100;
  const C = 100;
  const seg = 360 / segments.length;
  const toXY = (angleDeg: number, r: number) => {
    const a = (angleDeg - 90) * (Math.PI / 180);
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
      {/* Outer rim */}
      <circle cx={C} cy={C} r={R} fill="#0b1020" />
      <circle cx={C} cy={C} r={R - 3} fill="#111827" />

      {segments.map((s, i) => {
        const start = i * seg;
        const end = start + seg;
        const [x1, y1] = toXY(start, R - 6);
        const [x2, y2] = toXY(end, R - 6);
        const largeArc = seg > 180 ? 1 : 0;
        const path = `M ${C} ${C} L ${x1} ${y1} A ${R - 6} ${R - 6} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        const isWinner = winIndex === i;

        // Label placement — along the middle of the wedge.
        const [lx, ly] = toXY(start + seg / 2, R * 0.62);
        const labelRotation = start + seg / 2;

        return (
          <g key={i}>
            <path
              d={path}
              fill={s.color}
              stroke="#0b1020"
              strokeWidth={1}
              opacity={winIndex === null || isWinner ? 1 : 0.35}
              style={{ transition: 'opacity 0.4s ease' }}
            />
            {isWinner && (
              <path d={path} fill="none" stroke="#FBBF24" strokeWidth={3} className="ld-winner-glow" />
            )}
            <g transform={`rotate(${labelRotation} ${lx} ${ly})`}>
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize="6.5"
                fontWeight="700"
                style={{ pointerEvents: 'none' }}
              >
                {s.label}
              </text>
              {s.sublabel && (
                <text
                  x={lx}
                  y={ly + 8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(255,255,255,0.7)"
                  fontSize="4.8"
                  fontWeight="600"
                  style={{ pointerEvents: 'none' }}
                >
                  {s.sublabel}
                </text>
              )}
            </g>
          </g>
        );
      })}

      {/* rim studs for a premium arcade look */}
      {Array.from({ length: segments.length }).map((_, i) => {
        const [sx, sy] = toXY(i * seg, R - 3);
        return <circle key={i} cx={sx} cy={sy} r={2} fill="#FBBF24" />;
      })}
      <circle cx={C} cy={C} r={R} fill="none" stroke="#FBBF24" strokeWidth={2} opacity={0.5} />
    </svg>
  );
}

// ── Confetti (dependency-free DOM particles) ──────────────────────────────────
function Confetti() {
  const colors = ['#FBBF24', '#4F46E5', '#DB2777', '#16A34A', '#0891B2', '#E11D48', '#7C3AED'];
  const pieces = useMemo(
    () => Array.from({ length: 90 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2.2 + Math.random() * 1.6,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
      drift: (Math.random() - 0.5) * 40,
    })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="ld-confetti absolute top-0"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.5}px`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            // custom props consumed by the keyframes
            ['--ld-drift' as string]: `${p.drift}vw`,
            ['--ld-rot' as string]: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}
