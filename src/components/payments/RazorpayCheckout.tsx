// =============================================================================
// Checkout modal — restructured to match the reference two-panel Razorpay
// layout (dark merchant summary panel + white "Payment Options" panel with a
// method rail, a UPI QR view, and an "All apps" list). All state, validation,
// timers, and the simulated payment flow are unchanged from the original;
// only markup and styling were rewritten. The one addition is a small local
// `search` state for the UPI apps list — purely cosmetic filtering, it does
// not touch payment logic.
//
// Layout:
// - Desktop (sm+): merchant panel fixed on the left (~230px), white panel
//   fills the rest with a vertical method rail + content column.
// - Mobile: merchant panel becomes a compact top bar, method rail becomes a
//   horizontal scroll strip, content stacks full-width below. Dialog is a
//   bottom sheet (rounded top corners, anchored to viewport bottom).
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Check, Loader2, ShieldCheck, ChevronRight, Smartphone,
  CreditCard, Building2, Wallet, Lock, Clock, Search, MoreHorizontal,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

export interface CheckoutDetails {
  amount: number;          // in rupees
  description: string;     // e.g. "October 2026 · Gold 24"
  name: string;            // customer name
  email?: string;
  contact?: string;
}

type Method = 'upi' | 'card' | 'netbanking' | 'wallet';
type Stage = 'select' | 'processing' | 'success' | 'failed';

const METHODS: { id: Method; label: string; icon: React.ElementType; hint: string }[] = [
  { id: 'upi',        label: 'UPI',        icon: Smartphone, hint: 'GPay, PhonePe, Paytm & more' },
  { id: 'card',       label: 'Cards',      icon: CreditCard, hint: 'Credit & debit' },
  { id: 'netbanking', label: 'Netbanking', icon: Building2,  hint: 'All Indian banks' },
  { id: 'wallet',     label: 'Wallets',    icon: Wallet,     hint: 'Paytm, Amazon Pay' },
];

const UPI_APPS = [
  { name: 'GPay', color: 'bg-blue-50 text-blue-600' },
  { name: 'PhonePe', color: 'bg-purple-50 text-purple-600' },
  { name: 'Paytm', color: 'bg-sky-50 text-sky-600' },
  { name: 'BHIM', color: 'bg-emerald-50 text-emerald-600' },
];
const BANKS = ['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Yes Bank'];
const WALLETS = ['Paytm', 'Amazon Pay', 'PhonePe', 'Mobikwik'];

interface Props {
  open: boolean;
  details: CheckoutDetails;
  onClose: () => void;
  onSuccess: () => void; // fired after a simulated successful payment
}

export function RazorpayCheckout({ open, details, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState<Method>('upi');
  const [stage, setStage] = useState<Stage>('select');
  const [vpa, setVpa] = useState('');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [bank, setBank] = useState('');
  const [wallet, setWallet] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(280);
  const [search, setSearch] = useState(''); // cosmetic UPI-app filter only
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open/close the native dialog in sync with `open`.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open) { if (!d.open) d.showModal(); reset(); }
    else if (d.open) d.close();
  }, [open]);

  // Countdown timer (Razorpay shows a session countdown on the QR view).
  useEffect(() => {
    if (!open || stage !== 'select') return;
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [open, stage]);

  const reset = () => {
    setMethod('upi'); setStage('select'); setVpa('');
    setCard({ number: '', expiry: '', cvv: '', name: '' });
    setBank(''); setWallet(''); setSecondsLeft(280); setSearch('');
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const canPay =
    (method === 'upi' && /^[\w.\-]{2,}@[\w]{2,}$/.test(vpa)) ||
    (method === 'card' && card.number.replace(/\s/g, '').length >= 12 && card.expiry.length >= 4 && card.cvv.length >= 3) ||
    (method === 'netbanking' && !!bank) ||
    (method === 'wallet' && !!wallet);

  const pay = () => {
    setStage('processing');
    // Simulate gateway roundtrip → success.
    window.setTimeout(() => {
      setStage('success');
      window.setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    }, 2200);
  };

  const contactLine = details.contact ?? details.email ?? details.name;

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => { e.preventDefault(); if (stage !== 'processing') onClose(); }}
      onClick={(e) => { if (e.target === dialogRef.current && stage !== 'processing') onClose(); }}
      className={cn(
        'fixed inset-x-0 bottom-0 top-auto m-0 sm:static sm:inset-auto sm:m-auto',
        'w-full sm:w-full sm:max-w-[720px]',
        'rounded-t-3xl sm:rounded-2xl',
        'max-h-[92vh] sm:max-h-[600px]',
        'p-0 bg-white shadow-2xl overflow-hidden',
        'backdrop:bg-neutral-950/55 backdrop:backdrop-blur-[2px]',
        '[&:not([open])]:hidden',
      )}
    >
      {stage === 'success' ? (
        <SuccessView amount={details.amount} />
      ) : stage === 'processing' ? (
        <ProcessingView method={method} />
      ) : (
        <div className="flex flex-col sm:flex-row h-full sm:h-[600px] max-h-[92vh] sm:max-h-[600px]">
          {/* ── Merchant panel ─────────────────────────────────────────────
              Left column on desktop; compact top bar on mobile. */}
          <aside className="shrink-0 sm:w-[230px] bg-[#0B0C10] text-white flex sm:flex-col">
            <div className="flex sm:flex-col w-full p-4 sm:p-5 sm:gap-6 items-center sm:items-stretch gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-none">
                <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-[15px] shrink-0">M</div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold truncate">Millance</p>
                  <p className="text-[11px] text-white/45 truncate">{details.description}</p>
                </div>
              </div>

              {/* Price summary — collapses to just the number on mobile */}
              <div className="shrink-0 sm:shrink sm:mt-1">
                <p className="hidden sm:block text-[11px] text-white/45 mb-1.5">Price summary</p>
                <div className="sm:bg-white/[0.06] sm:rounded-xl sm:p-3.5">
                  <p className="text-[17px] sm:text-[22px] font-semibold font-mono tabular-nums leading-none">
                    {formatCurrency(details.amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact + trust badge — desktop only, pinned to bottom */}
            <div className="hidden sm:flex sm:flex-col sm:mt-auto sm:gap-4 p-5 pt-0">
              <button
                type="button"
                className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.06] px-3.5 py-3 text-left hover:bg-white/[0.1] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-[10px] text-white/40">Using as</p>
                  <p className="text-[12px] font-medium text-white/85 truncate">{contactLine}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-white/40 shrink-0" />
              </button>
              <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Secured simulation — no real charge
              </div>
            </div>
          </aside>

          {/* ── Payment options panel ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col bg-white min-h-0">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-neutral-100 shrink-0">
              <p className="text-[14px] font-semibold text-neutral-900">Payment options</p>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-md text-neutral-400 hover:bg-neutral-100" aria-label="More options">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  aria-label="Close checkout"
                  className="p-1.5 rounded-md text-neutral-400 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-1 min-h-0">
              {/* Method chips — mobile only */}
              <nav aria-label="Payment method" className="flex sm:hidden gap-2 overflow-x-auto px-4 py-3 border-b border-neutral-100 shrink-0">
                {METHODS.map((m) => {
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[13px] font-medium whitespace-nowrap transition-colors',
                        active ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-neutral-200 text-neutral-600',
                      )}
                    >
                      <m.icon className="h-3.5 w-3.5" />
                      {m.label}
                    </button>
                  );
                })}
              </nav>

              {/* Method rail — sm and up */}
              <nav aria-label="Payment method" className="hidden sm:flex sm:flex-col w-[200px] border-r border-neutral-100 py-2 px-2 overflow-y-auto shrink-0">
                {METHODS.map((m) => {
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-left transition-colors',
                        active ? 'bg-brand-50' : 'hover:bg-neutral-50',
                      )}
                    >
                      <span className={cn('flex h-8 w-8 flex-none items-center justify-center rounded-lg', active ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-500')}>
                        <m.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className={cn('block text-[13px] font-semibold', active ? 'text-brand-700' : 'text-neutral-800')}>{m.label}</span>
                        <span className="block text-[10.5px] text-neutral-400 leading-snug">{m.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Content column */}
              <div className="flex-1 min-w-0 flex flex-col min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
                  {method === 'upi' && (
                    <UpiPanel vpa={vpa} setVpa={setVpa} search={search} setSearch={setSearch} mins={mins} secs={secs} />
                  )}
                  {method === 'card' && <CardForm card={card} setCard={setCard} />}
                  {method === 'netbanking' && <ListPicker items={BANKS} selected={bank} onSelect={setBank} label="Popular banks" icon={Building2} />}
                  {method === 'wallet' && <ListPicker items={WALLETS} selected={wallet} onSelect={setWallet} label="Wallets" icon={Wallet} />}
                </div>

                <div className="shrink-0 p-4 sm:p-5 pt-0 sm:pt-0">
                  <button
                    disabled={!canPay}
                    onClick={pay}
                    className={cn(
                      'w-full h-12 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors',
                      canPay ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
                    )}
                  >
                    <Lock className="h-4 w-4" />
                    Pay {formatCurrency(details.amount)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

// ── UPI: QR view + all-apps list + manual VPA fallback ───────────────────────
function UpiPanel({
  vpa, setVpa, search, setSearch, mins, secs,
}: {
  vpa: string; setVpa: (v: string) => void;
  search: string; setSearch: (v: string) => void;
  mins: string; secs: string;
}) {
  const filteredApps = useMemo(
    () => UPI_APPS.filter(a => a.name.toLowerCase().includes(search.trim().toLowerCase())),
    [search],
  );

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search UPI apps"
          className="w-full h-11 pl-9 pr-3.5 rounded-xl border border-neutral-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
        />
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-semibold text-neutral-800">Scan QR code</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-neutral-400">
            <Clock className="h-3 w-3" /> {mins}:{secs}
          </span>
        </div>
        <div className="flex justify-center">
          <FauxQr size={148} />
        </div>
        <p className="mt-3 text-center text-[11.5px] text-neutral-400">Scan using any UPI app</p>
      </div>

      <div>
        <p className="text-[12px] font-medium text-neutral-500 mb-2">All apps</p>
        <div className="space-y-1.5">
          {filteredApps.map((a) => (
            <button
              key={a.name}
              onClick={() => setVpa(`user@${a.name.toLowerCase()}`)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-[13.5px] font-medium transition-colors',
                vpa === `user@${a.name.toLowerCase()}` ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300',
              )}
            >
              <span className={cn('flex h-8 w-8 flex-none items-center justify-center rounded-lg', a.color)}>
                <Smartphone className="h-4 w-4" />
              </span>
              <span className="flex-1 min-w-0 text-left truncate">{a.name}</span>
              <ChevronRight className="h-4 w-4 text-neutral-300 flex-none" />
            </button>
          ))}
          {filteredApps.length === 0 && (
            <p className="text-[12px] text-neutral-400 py-2">No apps match "{search}".</p>
          )}
        </div>
      </div>

      <div>
        <label className="text-[12px] font-medium text-neutral-500" htmlFor="upi-vpa">Or enter UPI ID</label>
        <input
          id="upi-vpa"
          value={vpa}
          onChange={(e) => setVpa(e.target.value)}
          placeholder="yourname@bank"
          className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-neutral-200 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
        />
        <p className="mt-2 text-[11.5px] text-neutral-400 leading-relaxed">A collect request will be sent to your UPI app.</p>
      </div>
    </div>
  );
}

// Deterministic faux-QR pattern (visual only — not a real scannable code).
function FauxQr({ size }: { size: number }) {
  const cells = 21;
  const cell = size / cells;
  const pattern = useMemo(() => {
    let seed = 42;
    const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed / 0x7fffffff); };
    const grid: boolean[][] = Array.from({ length: cells }, () => Array.from({ length: cells }, () => rand() > 0.55));
    const finder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
        const on = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        grid[r0 + r][c0 + c] = on;
      }
    };
    finder(0, 0); finder(0, cells - 7); finder(cells - 7, 0);
    return grid;
  }, []);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-2.5" style={{ width: size + 20, height: size + 20 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="UPI QR code placeholder">
        <rect width={size} height={size} fill="#fff" />
        {pattern.map((row, r) => row.map((on, c) => on && (
          <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#151A2E" />
        )))}
      </svg>
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
function CardForm({ card, setCard }: {
  card: { number: string; expiry: string; cvv: string; name: string };
  setCard: (c: { number: string; expiry: string; cvv: string; name: string }) => void;
}) {
  const fmtNumber = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };
  return (
    <div className="space-y-3.5">
      <p className="text-[13px] font-semibold text-neutral-800">Card details</p>
      <div>
        <label className="text-[12px] font-medium text-neutral-500" htmlFor="card-number">Card number</label>
        <input
          id="card-number"
          value={card.number}
          onChange={(e) => setCard({ ...card, number: fmtNumber(e.target.value) })}
          placeholder="1234 5678 9012 3456"
          inputMode="numeric"
          className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-neutral-200 text-[13.5px] font-mono tabular-nums tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[12px] font-medium text-neutral-500" htmlFor="card-expiry">Expiry</label>
          <input
            id="card-expiry"
            value={card.expiry}
            onChange={(e) => setCard({ ...card, expiry: fmtExpiry(e.target.value) })}
            placeholder="MM/YY"
            inputMode="numeric"
            className="mt-1.5 h-11 w-full px-3.5 rounded-xl border border-neutral-200 text-[13.5px] font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-neutral-500" htmlFor="card-cvv">CVV</label>
          <input
            id="card-cvv"
            value={card.cvv}
            onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
            placeholder="•••"
            inputMode="numeric"
            type="password"
            className="mt-1.5 h-11 w-full px-3.5 rounded-xl border border-neutral-200 text-[13.5px] font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="text-[12px] font-medium text-neutral-500" htmlFor="card-name">Name on card</label>
        <input
          id="card-name"
          value={card.name}
          onChange={(e) => setCard({ ...card, name: e.target.value })}
          placeholder="As printed on the card"
          className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-neutral-200 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
        />
      </div>
    </div>
  );
}

// ── Netbanking / wallet list ──────────────────────────────────────────────────
function ListPicker({ items, selected, onSelect, label, icon: Icon }: {
  items: string[]; selected: string; onSelect: (v: string) => void; label: string; icon: React.ElementType;
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-neutral-800 mb-3">{label}</p>
      <div className="space-y-1.5">
        {items.map((item) => {
          const active = selected === item;
          return (
            <button
              key={item}
              onClick={() => onSelect(item)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-[13.5px] font-medium transition-colors',
                active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300',
              )}
            >
              <span className={cn('flex h-8 w-8 flex-none items-center justify-center rounded-lg', active ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-400')}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1 min-w-0 text-left truncate">{item}</span>
              <ChevronRight className={cn('h-4 w-4 flex-none', active ? 'text-brand-500' : 'text-neutral-300')} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Processing ─────────────────────────────────────────────────────────────────
function ProcessingView({ method }: { method: Method }) {
  return (
    <div className="px-6 py-16 flex flex-col items-center text-center">
      <Loader2 className="h-9 w-9 text-brand-600 animate-spin" strokeWidth={2.25} />
      <p className="mt-6 text-[15px] font-semibold text-neutral-900">
        {method === 'upi' ? 'Awaiting UPI approval' : 'Processing payment'}
      </p>
      <p className="mt-1.5 text-[13px] text-neutral-500 max-w-[260px] leading-relaxed">
        {method === 'upi'
          ? 'Approve the collect request in your UPI app. Do not close this window.'
          : 'Please wait while we securely process your payment.'}
      </p>
      <div className="mt-7 flex items-center gap-1.5 text-[11px] text-neutral-400">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Do not press back or refresh
      </div>
    </div>
  );
}

// ── Success ─────────────────────────────────────────────────────────────────────
function SuccessView({ amount }: { amount: number }) {
  return (
    <div className="px-6 py-14 flex flex-col items-center text-center">
      <div className="h-16 w-16 rounded-full bg-emerald-50 ring-8 ring-emerald-50/60 flex items-center justify-center">
        <div className="h-11 w-11 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check className="h-6 w-6 text-white" strokeWidth={3} />
        </div>
      </div>
      <p className="mt-6 text-[16px] font-semibold text-neutral-900">Payment successful</p>
      <p className="mt-1 text-[13px] text-neutral-500">{formatCurrency(amount)} paid to Millance</p>
      <p className="mt-5 text-[11px] font-mono tabular-nums text-neutral-400">
        Ref: pay_{Math.random().toString(36).slice(2, 12).toUpperCase()}
      </p>
    </div>
  );
} 