// =============================================================================
// User Dashboard — app-style member home (Paytm/PhonePe inspired).
// Layout: balance header → banner carousel → quick actions → plan progress
//         → next payment + recent draws. Fully responsive (mobile → desktop).
// All data comes from existing services (vault, payments, draws, plan, products).
// =============================================================================
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Trophy, CreditCard, ChevronRight, FileText, QrCode,
  Receipt, ArrowUpRight, Sparkles, Plus,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PaymentStatusBadge } from '@/components/ui/Badge';
import { SkeletonUserHome } from '@/components/ui/Skeleton';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { paymentService } from '@/services/payment.service';
import { drawService } from '@/services/draw.service';
import { vaultService } from '@/services/vault.service';
import { planService } from '@/services/plan.service';
import { useAuthStore } from '@/stores/authStore';
import { useDemoClockStore } from '@/stores/demoClockStore';
import { useToast } from '@/stores/uiStore';
import { useCheckout } from '@/components/payments/CheckoutProvider';
import { cn } from '@/lib/utils';
import type { Payment, Draw, Vault, Plan } from '@/types';
import { formatCurrency } from '@/lib/utils';

// ── Promo banners (uses existing project imagery + real offer copy) ──────────
const BANNERS = [
  {
    image: '/images/stitch/hero_slide1.png',
    title: '10 Winners Every Month',
    subtitle: 'Stay paid up to enter this month’s lucky draw.',
    to: '/user/draws',
    tint: 'from-brand-600/90 to-brand-500/70',
  },
  {
    image: '/images/stitch/hero_slide3.png',
    title: 'Your Vault, Your Money',
    subtitle: '100% of contributions are yours to redeem.',
    to: '/user/vault',
    tint: 'from-slate-900/90 to-slate-700/60',
  },
  {
    image: '/images/stitch/hero_slide4.png',
    title: 'Redeem at Any Millance Store',
    subtitle: 'Generate a QR voucher and spend your vault balance in store.',
    to: '/user/redeem',
    tint: 'from-accent-600/90 to-accent-500/60',
  },
];

// ── Quick actions (app-grid) ─────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { to: '/user/payments', label: 'Pay Now',   icon: CreditCard,  color: 'text-brand-600',   bg: 'bg-brand-50' },
  { to: '/user/vault',    label: 'My Vault',  icon: Wallet,      color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { to: '/user/draws',    label: 'Lucky Draw',icon: Trophy,      color: 'text-accent-600',  bg: 'bg-accent-50' },
  { to: '/user/redeem',   label: 'Redeem',    icon: QrCode,      color: 'text-purple-600',  bg: 'bg-purple-50' },
  { to: '/user/plan',     label: 'My Plan',   icon: FileText,    color: 'text-cyan-600',    bg: 'bg-cyan-50' },
  { to: '/user/payments', label: 'Payments',  icon: Receipt,     color: 'text-amber-600',   bg: 'bg-amber-50' },
];

export default function UserDashboard() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const { clock } = useDemoClockStore();
  const toast = useToast();
  const checkout = useCheckout();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  const load = async () => {
    if (!userId) return;
    setLoading(true); setError(null);
    try {
      const [p, d, v, pl] = await Promise.all([
        paymentService.getUserPayments(userId),
        drawService.getFranchiseDraws(user!.franchiseId!),
        vaultService.getVault(userId),
        user?.planId ? planService.getPlan(user.planId) : Promise.resolve(null),
      ]);
      setPayments(p);
      setDraws(d.filter(dr => dr.status === 'completed'));
      setVault(v);
      setPlan(pl);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [userId]);

  // Launch the Razorpay-style checkout; commit the payment only on success.
  const payViaCheckout = (payment: Payment) => {
    checkout.open({
      amount: payment.amount,
      description: `${payment.periodLabel} · ${user?.groupName ?? 'Millance'} plan`,
      name: user?.name ?? 'Member',
      email: user?.email,
      onSuccess: async () => {
        setPaying(payment.id);
        try {
          const updated = await paymentService.simulatePayment(payment.id, 'Paid');
          setPayments(prev => prev.map(p => p.id === payment.id ? updated : p));
          toast.success('Payment successful', `${formatCurrency(payment.amount)} paid for ${payment.periodLabel}`);
        } catch (e) { toast.error('Payment failed', e instanceof Error ? e.message : 'Unknown'); }
        finally { setPaying(null); }
      },
    });
  };

  if (loading) return <SkeletonUserHome />;
  if (error) return <ErrorState description={error} onRetry={load} />;

  const nextPayment = payments.find(p => p.status === 'Pending');
  const winCount = draws.flatMap(d => d.winners).filter(w => w.userId === userId).length;
  const recentDraws = [...draws].sort((a, b) => b.executedAt!.localeCompare(a.executedAt!)).slice(0, 4);
  const totalContributed = vault?.totalContributed ?? 0;
  const paidCount = payments.filter(p => p.status === 'Paid').length;
  const planPct = plan ? Math.min(100, Math.round((plan.currentMonth / plan.durationMonths) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Balance header — the "wallet" hero, like a payments app ────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white p-5 sm:p-7 shadow-lg shadow-brand-600/20">
        {/* Decorative rings */}
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-20 -right-24 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-white/70">{clock.currentPeriodLabel} · {user?.groupName} Group</p>
            <p className="text-sm text-white/80 mt-3">Available Vault Balance</p>
            <p className="text-4xl sm:text-5xl font-black font-mono tracking-tight mt-1">{formatCurrency(vault?.balance ?? 0)}</p>
            <p className="text-xs text-white/60 mt-2">Lifetime contributed: <span className="font-semibold text-white/90 font-mono">{formatCurrency(totalContributed)}</span></p>
          </div>

          {/* Actions — equal height (h-11) and equal width when stacked on desktop */}
          <div className="flex sm:flex-col gap-3 sm:items-stretch sm:w-44 shrink-0">
            <Link
              to="/user/redeem"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white !text-black text-sm font-bold shadow-sm hover:bg-white/90 transition-colors"
            >
              <QrCode className="h-4 w-4" /> Redeem
            </Link>
            {nextPayment && (
              <button
                type="button"
                disabled={paying === nextPayment.id}
                onClick={() => payViaCheckout(nextPayment)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white/15 text-white text-sm font-bold border border-white/25 hover:bg-white/25 disabled:opacity-60 transition-colors whitespace-nowrap"
              >
                 Pay {formatCurrency(nextPayment.amount)}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Banner carousel ─────────────────────────────────────────────────── */}
      <BannerCarousel />

      {/* ── Quick actions grid ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-bold text-neutral-800 mb-3 px-0.5">Quick actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {QUICK_ACTIONS.map(({ to, label, icon: Icon, color, bg }) => (
            <Link
              key={label}
              to={to}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-white border border-neutral-200 p-3 sm:p-4 hover:border-neutral-300 hover:shadow-md transition-all"
            >
              <span className={cn('h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105', bg)}>
                <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', color)} aria-hidden="true" />
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-neutral-700 text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Winner banner (conditional) ─────────────────────────────────────── */}
      {user?.hasWon && (
        <div className="p-4 sm:p-5 rounded-2xl border border-accent-200 bg-gradient-to-r from-accent-50 to-white flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-accent-100 flex items-center justify-center shrink-0">
            <Trophy className="h-6 w-6 text-accent-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-accent-900">You're a winner! 🎉</h3>
            <p className="text-sm text-accent-700">Congratulations! View your prize history in the Draws tab.</p>
          </div>
          <Link to="/user/draws" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-accent-700 hover:underline shrink-0">
            View <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* ── Stats ───────────────────────────────────────────────────────────
          Mobile: one unified summary bar with 3 dividered segments.
          Desktop (sm+): three separate cards. */}
      <div className="grid grid-cols-3 divide-x divide-neutral-100 rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:gap-4 sm:border-0 sm:bg-transparent sm:shadow-none sm:divide-x-0">
        <StatSegment icon={<Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-accent-600" />} bg="bg-accent-50" label="Wins" value={String(winCount)} />
        <StatSegment icon={<CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-success-600" />} bg="bg-success-50" label="Payments" value={String(paidCount)} />
        <StatSegment icon={<Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-brand-600" />} bg="bg-brand-50" label="Plan Month" value={plan ? `${plan.currentMonth}/${plan.durationMonths}` : '—'} />
      </div>

      {/* ── Plan progress ───────────────────────────────────────────────────── */}
      {plan && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-500" />
              <CardTitle className="text-base">{plan.name}</CardTitle>
            </div>
            <Link to="/user/plan" className="text-xs font-medium text-brand-600 hover:underline">Details</Link>
          </div>
          <div className="flex items-end justify-between mb-2">
            <p className="text-sm text-neutral-500">Month {plan.currentMonth} of {plan.durationMonths}</p>
            <p className="text-sm font-bold text-brand-600">{planPct}%</p>
          </div>
          <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
            <div className="h-full rounded-full bg-brand-500 transition-all duration-700" style={{ width: `${planPct}%` }} />
          </div>
        </Card>
      )}

      {/* ── Next payment + recent draws ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <Card>
          <CardHeader className="pb-3 border-b border-neutral-100 mb-3">
            <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Next Payment</CardTitle>
          </CardHeader>
          {nextPayment ? (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-neutral-500">{nextPayment.periodLabel}</p>
                  <p className="text-3xl font-bold font-mono text-neutral-900">{formatCurrency(nextPayment.amount)}</p>
                </div>
                <PaymentStatusBadge status={nextPayment.status} />
              </div>
              <Button variant="primary" className="w-full" loading={paying === nextPayment.id} onClick={() => payViaCheckout(nextPayment)}>
                Pay Now
              </Button>
            </div>
          ) : (
            <EmptyState title="All caught up" icon={<CheckCircle2 className="h-6 w-6 text-success-500" />} description="You have no pending payments." className="py-6" />
          )}
        </Card>

        <Card padding="none" className="flex flex-col">
          <CardHeader className="p-4 border-b border-neutral-100 flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4" /> Recent Draws</CardTitle>
            <Link to="/user/draws" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>
          </CardHeader>
          <div className="divide-y divide-neutral-100 flex-1">
            {recentDraws.length > 0 ? recentDraws.map(d => {
              const myWin = d.winners.find(w => w.userId === userId);
              return (
                <Link key={d.id} to="/user/draws" className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{d.periodLabel}</p>
                    <p className="text-xs text-neutral-500">{d.winners.length} winners announced</p>
                  </div>
                  {myWin ? <span className="text-xs font-semibold text-accent-600">You won! 🏆</span> : <ChevronRight className="h-4 w-4 text-neutral-400" />}
                </Link>
              );
            }) : (
              <EmptyState title="No draws yet" description="Draw results will appear here." className="py-10" />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

import { CheckCircle2 } from 'lucide-react';

// ── Auto-playing rounded banner carousel ─────────────────────────────────────
function BannerCarousel() {
  const [index, setIndex] = useState(0);
  const count = BANNERS.length;

  const next = useCallback(() => setIndex(i => (i + 1) % count), [count]);

  useEffect(() => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [next]);

  return (
    <section aria-label="Offers" className="relative">
      <div className="overflow-hidden rounded-3xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {BANNERS.map((b) => (
            <Link
              key={b.title}
              to={b.to}
              className="relative shrink-0 w-full h-40 sm:h-56 lg:h-64 block"
            >
              <img src={b.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className={cn('absolute inset-0 bg-gradient-to-r', b.tint)} />
              <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 max-w-lg">
                <h3 className="text-xl sm:text-3xl font-black text-white leading-tight">{b.title}</h3>
                <p className="text-xs sm:text-sm text-white/85 mt-1.5">{b.subtitle}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-white w-fit border-b border-white/40 pb-0.5">
                  Explore <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-6 sm:left-10 flex items-center gap-1.5 z-20">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80',
            )}
          />
        ))}
      </div>
    </section>
  );
}

// ── Compact stat chip ────────────────────────────────────────────────────────
function StatSegment({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: string }) {
  return (
    <div className={cn(
      // Mobile: centered segment inside the shared bar.
      'flex flex-col items-center text-center gap-1 px-2 py-3.5',
      // sm+: standalone card, left-aligned with icon on top.
      'sm:items-start sm:text-left sm:gap-0 sm:rounded-2xl sm:border sm:border-neutral-200 sm:bg-white sm:p-4 sm:shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
    )}>
      <span className={cn('h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center sm:mb-3', bg)}>{icon}</span>
      <p className="text-lg sm:text-2xl font-bold text-neutral-900 leading-tight sm:mt-0">{value}</p>
      <p className="text-[11px] sm:text-xs font-medium text-neutral-500 leading-tight">{label}</p>
    </div>
  );
}


