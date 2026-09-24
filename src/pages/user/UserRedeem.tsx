// =============================================================================
// User Redeem — generate a premium digital in-store voucher (QR).
// Millance has no online checkout: members redeem vault balance at a physical
// Millance store by presenting this ticket-style voucher to the cashier.
// The QR is rendered locally as an SVG matrix (no external dependency).
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import {
  QrCode, Wallet, Store, ShieldCheck, Copy, Check, RefreshCw, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { vaultService } from '@/services/vault.service';
import { voucherService } from '@/services/voucher.service';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';
import type { Vault } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

export default function UserRedeem() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const toast = useToast();

  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState<number>(0);
  const [voucher, setVoucher] = useState<{ code: string; amount: number; issuedAt: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    if (!userId) return;
    setLoading(true); setError(null);
    try { setVault(await vaultService.getVault(userId)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [userId]);

  const balance = vault?.balance ?? 0;
  const canGenerate = amount > 0 && amount <= balance;

  const generate = async () => {
    if (!canGenerate) return;
    const code = makeVoucherCode();
    // Persist the voucher so a franchise store can validate & redeem it.
    try {
      await voucherService.issue({ code, userId, franchiseId: user?.franchiseId ?? '', value: amount });
      setVoucher({ code, amount, issuedAt: Date.now() });
      toast.success('Voucher ready', 'Show the QR at any Millance store to redeem.');
    } catch (e) {
      toast.error('Could not create voucher', e instanceof Error ? e.message : 'Unknown');
    }
  };

  const copyCode = async () => {
    if (!voucher) return;
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { toast.error('Copy failed', 'Please copy the code manually.'); }
  };

  if (loading) return <div className="space-y-4 max-w-6xl">{[1, 2].map(i => <SkeletonCard key={i} />)}</div>;
  if (error || !vault) return <ErrorState description={error ?? 'Vault not found'} onRetry={load} />;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <header>
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight">Redeem at Store</h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-xl">
          Turn your vault balance into a secure digital voucher and spend it at any physical Millance store — no online checkout.
        </p>
      </header>

      {balance <= 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white">
          <EmptyState
            title="No balance to redeem yet"
            icon={<Wallet className="h-6 w-6" />}
            description="Keep contributing each month — your vault balance becomes redeemable in store once you have a balance."
            className="py-16"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-6 lg:gap-8 items-start">
          {/* ── Left: amount selection ─────────────────────────────────────── */}
          <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-7">
            {/* Balance */}
            <div className="rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-700 text-white p-5">
              <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Available Vault Balance</p>
              <p className="text-3xl font-black font-mono mt-1">{formatCurrency(balance)}</p>
            </div>

            {/* Amount input */}
            <div>
              <label htmlFor="redeem-amount" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                Enter Amount
              </label>
              <div className="flex items-center rounded-2xl border-2 border-neutral-200 bg-white focus-within:border-brand-500 transition-colors">
                <span className="pl-5 text-2xl font-mono text-neutral-400">₹</span>
                <input
                  id="redeem-amount"
                  type="number"
                  min={0}
                  max={balance}
                  value={amount || ''}
                  onChange={(e) => { setAmount(Math.min(balance, Math.max(0, Number(e.target.value)))); setVoucher(null); }}
                  placeholder="0"
                  className="w-full bg-transparent px-3 py-4 text-2xl font-mono font-bold text-neutral-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => { setAmount(balance); setVoucher(null); }}
                  className="mr-3 shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors"
                >
                  MAX
                </button>
              </div>
              {amount > balance && (
                <p className="text-xs font-semibold text-danger-500 mt-2">Amount exceeds your vault balance.</p>
              )}

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-3">
                {QUICK_AMOUNTS.map(a => {
                  const disabled = a > balance;
                  return (
                    <button
                      key={a}
                      type="button"
                      disabled={disabled}
                      onClick={() => { setAmount(a); setVoucher(null); }}
                      className={cn(
                        'px-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all text-center tabular-nums whitespace-nowrap',
                        disabled
                          ? 'border-neutral-100 text-neutral-300 cursor-not-allowed'
                          : amount === a
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-brand-300',
                      )}
                    >
                      ₹{a.toLocaleString('en-IN')}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!canGenerate}
              onClick={generate}
              leftIcon={<QrCode className="h-4 w-4" />}
            >
              Generate Voucher
            </Button>

            {/* How it works */}
            <div className="pt-5 border-t border-neutral-100">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">How it works</p>
              <ol className="space-y-4">
                {[
                  { icon: <QrCode className="h-4 w-4" />, title: 'Generate a voucher', text: 'Choose an amount and create a secure QR voucher.' },
                  { icon: <Store className="h-4 w-4" />, title: 'Visit a Millance store', text: 'Show the QR at the billing counter.' },
                  { icon: <ShieldCheck className="h-4 w-4" />, title: 'Settled from your vault', text: 'The amount is deducted from your balance — no online payment.' },
                ].map((s, i) => (
                  <li key={i} className="flex gap-3.5">
                    <span className="relative shrink-0 h-9 w-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                      {s.icon}
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{s.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* ── Right: voucher ticket ──────────────────────────────────────── */}
          <div className="lg:sticky lg:top-24">
            {voucher ? (
              <VoucherTicket
                code={voucher.code}
                amount={voucher.amount}
                issuedAt={voucher.issuedAt}
                userName={user?.name ?? 'Member'}
                onCopy={copyCode}
                copied={copied}
                onRegenerate={generate}
              />
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50/60 flex flex-col items-center justify-center text-center px-6 py-20">
                <div className="h-16 w-16 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center mb-4 shadow-sm">
                  <QrCode className="h-8 w-8 text-brand-500" />
                </div>
                <h3 className="font-bold text-neutral-900">Your voucher will appear here</h3>
                <p className="text-sm text-neutral-500 mt-1 max-w-xs">
                  Pick an amount on the left and generate a QR voucher to redeem in store.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Premium ticket-style voucher ──────────────────────────────────────────────
function VoucherTicket({
  code, amount, issuedAt, userName, onCopy, copied, onRegenerate,
}: {
  code: string; amount: number; issuedAt: number; userName: string;
  onCopy: () => void; copied: boolean; onRegenerate: () => void;
}) {
  const issued = new Date(issuedAt);
  const expires = new Date(issuedAt + 24 * 60 * 60 * 1000);
  const fmtDate = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4">
      {/*
        Ticket shape adapts to the viewport for a proper voucher look:
        - Mobile: PORTRAIT ticket (body on top, horizontal tear, QR stub below).
        - Desktop (sm+): LANDSCAPE ticket (body left, vertical tear, QR right).
      */}
      <div className="flex flex-col sm:flex-row rounded-3xl overflow-hidden shadow-xl shadow-neutral-900/10 bg-white ring-1 ring-neutral-200/70">
        {/* Main body */}
        <div className="relative flex-1 min-w-0 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white p-6 sm:p-7">
          {/* Soft decorative glow */}
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="font-bold tracking-tight truncate">Millance</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 border border-white/25 rounded-full px-2.5 py-1 shrink-0">
                Gift Voucher
              </span>
            </div>

            <div className="mt-6 sm:mt-10">
              <p className="text-xs font-medium uppercase tracking-wider text-white/60">Redeemable Value</p>
              <p className="text-4xl sm:text-5xl font-black font-mono tracking-tight mt-1">{formatCurrency(amount)}</p>
            </div>

            <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-4 text-sm">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Member</p>
                <p className="font-semibold text-white truncate">{userName}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Valid Until</p>
                <p className="font-semibold text-white">{fmtDate(expires)}</p>
                <p className="text-xs text-white/70">{fmtTime(expires)}</p>
              </div>
            </div>

            {/* Voucher code */}
            <div className="mt-6 pt-5 border-t border-white/15">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">Voucher Code</p>
              <button onClick={onCopy} className="group inline-flex items-center gap-2 font-mono font-bold text-lg sm:text-xl tracking-wider hover:text-white/90 transition-colors">
                {code}
                {copied
                  ? <Check className="h-4 w-4 text-emerald-300" />
                  : <Copy className="h-4 w-4 text-white/60 group-hover:text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Perforation — horizontal on mobile, vertical on desktop */}
        <div className="relative shrink-0 bg-white sm:w-px">
          {/* Mobile: horizontal dashed line + side notches */}
          <div className="sm:hidden relative h-5">
            <div className="absolute inset-x-4 top-1/2 border-t-2 border-dashed border-neutral-200" />
            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-neutral-50 ring-1 ring-neutral-200" />
            <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-neutral-50 ring-1 ring-neutral-200" />
          </div>
          {/* Desktop: vertical dashed line + top/bottom notches */}
          <div className="hidden sm:block absolute inset-y-4 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-neutral-200" />
          <div className="hidden sm:block absolute -top-2.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-neutral-50 ring-1 ring-neutral-200" />
          <div className="hidden sm:block absolute -bottom-2.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-neutral-50 ring-1 ring-neutral-200" />
        </div>

        {/* QR stub */}
        <div className="w-full sm:w-[42%] shrink-0 bg-white px-6 py-6 sm:p-7 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Scan at counter</p>
          <div className="rounded-2xl border border-neutral-200 p-3 bg-white shadow-sm">
            <QrMatrix value={code} className="h-36 w-36 sm:h-40 sm:w-40" />
          </div>
          {/* Barcode-style strip for extra ticket realism */}
          <Barcode value={code} className="mt-4 h-8 w-full max-w-[12rem]" />
          <p className="mt-2 text-[10px] text-neutral-400">Issued {fmtDate(issued)} · {fmtTime(issued)}</p>
        </div>
      </div>

      {/* Actions + fine print */}
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-xs text-neutral-400">One-time use · Present this voucher at any Millance store.</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRegenerate}
          className="shrink-0"
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Regenerate
        </Button>
      </div>
    </div>
  );
}

// ── Deterministic QR-style matrix (visual only, no dependency) ────────────────
function QrMatrix({ value, className }: { value: string; className?: string }) {
  const SIZE = 21;
  const cells = useMemo(() => hashToGrid(value, SIZE), [value]);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={className} shapeRendering="crispEdges" role="img" aria-label={`QR voucher ${value}`}>
      <rect width={SIZE} height={SIZE} fill="#fff" />
      {cells.map((row, y) =>
        row.map((on, x) => (on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#0f172a" /> : null)),
      )}
      {finderPattern(0, 0)}
      {finderPattern(SIZE - 7, 0)}
      {finderPattern(0, SIZE - 7)}
    </svg>
  );
}

function finderPattern(ox: number, oy: number) {
  return (
    <g key={`f-${ox}-${oy}`}>
      <rect x={ox} y={oy} width={7} height={7} fill="#0f172a" />
      <rect x={ox + 1} y={oy + 1} width={5} height={5} fill="#fff" />
      <rect x={ox + 2} y={oy + 2} width={3} height={3} fill="#0f172a" />
    </g>
  );
}

function hashToGrid(value: string, size: number): boolean[][] {
  let seed = 0;
  for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) >>> 0;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);

  const grid: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) row.push(inFinder(x, y) ? false : rand() > 0.5);
    grid.push(row);
  }
  return grid;
}

// Simple deterministic barcode-style strip (presentational).
function Barcode({ value, className }: { value: string; className?: string }) {
  let seed = 0;
  for (let i = 0; i < value.length; i++) seed = (seed * 37 + value.charCodeAt(i)) >>> 0;
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  while (x < 100) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const w = 1 + (seed % 3);
    const gap = 1 + ((seed >> 3) % 2);
    bars.push({ x, w });
    x += w + gap;
  }
  return (
    <svg viewBox="0 0 100 24" className={className} preserveAspectRatio="none" aria-hidden="true">
      {bars.map((b, i) => <rect key={i} x={b.x} y={0} width={b.w} height={24} fill="#0f172a" />)}
    </svg>
  );
}

function makeVoucherCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () => Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `MLN-${block()}-${block()}`;
}
