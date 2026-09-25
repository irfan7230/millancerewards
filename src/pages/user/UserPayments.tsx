// =============================================================================
// User Payments — payment history, pending dues, and coupon/offer application.
// Users can apply admin-created coupon codes before initiating checkout.
// =============================================================================
import { useState, useRef } from 'react';
import { CreditCard, CheckCircle2, Tag, X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PaymentStatusBadge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { paymentService } from '@/services/payment.service';
import { couponService } from '@/services/coupon.service';
import type { CouponApplyResult } from '@/services/coupon.service';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';
import { useCheckout } from '@/components/payments/CheckoutProvider';
import type { Payment, PaymentStatus } from '@/types';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Coupon input widget ──────────────────────────────────────────────────────

function CouponInput({
  amount,
  onApplied,
  onRemoved,
  appliedResult,
}: {
  amount: number;
  onApplied: (result: CouponApplyResult) => void;
  onRemoved: () => void;
  appliedResult: CouponApplyResult | null;
}) {
  const { user } = useAuthStore();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const apply = async () => {
    if (!code.trim()) return;
    setChecking(true); setError(null);
    try {
      const result = await couponService.validate({
        code: code.trim(),
        userId: user?.id ?? '',
        amount,
        franchiseId: user?.franchiseId,
        groupId: user?.groupId,
        planId: user?.planId,
      });
      if (result.valid) {
        onApplied(result);
        setCode('');
        setOpen(false);
      } else {
        setError(result.reason);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to validate coupon');
    } finally { setChecking(false); }
  };

  if (appliedResult) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
          <Tag className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-emerald-700 font-mono">{appliedResult.coupon.code}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">{appliedResult.coupon.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-emerald-700">-{formatCurrency(appliedResult.discount)}</p>
          <button onClick={onRemoved} className="text-[10px] text-emerald-500 hover:text-emerald-700 flex items-center gap-0.5 ml-auto mt-0.5">
            <X className="h-3 w-3" />Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <button
        onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 100); }}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
      >
        <Tag className="h-4 w-4 text-brand-500" />
        <span className="flex-1 text-left">Have a coupon or offer code?</span>
        {open ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-neutral-100">
          <div className="flex gap-2 mt-3">
            <input
              ref={inputRef}
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(null); }}
              onKeyDown={e => e.key === 'Enter' && void apply()}
              placeholder="Enter coupon code"
              className="flex-1 h-10 px-3 rounded-lg border border-neutral-200 text-sm font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 uppercase"
            />
            <Button
              variant="primary"
              size="sm"
              loading={checking}
              onClick={apply}
              disabled={!code.trim()}
            >
              Apply
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}
        </div>
      )}
    </div>
  );
}

// ── Payment action card (next due) ───────────────────────────────────────────

function NextPaymentCard({
  payment,
  processPaymentMutation,
  redeemCouponMutation,
}: {
  payment: Payment;
  processPaymentMutation: ReturnType<typeof useMutation>;
  redeemCouponMutation: ReturnType<typeof useMutation>;
}) {
  const { user } = useAuthStore();
  const toast = useToast();
  const checkout = useCheckout();
  const [appliedCoupon, setAppliedCoupon] = useState<CouponApplyResult | null>(null);
  const [paying, setPaying] = useState(false);

  const finalAmount = appliedCoupon ? appliedCoupon.finalAmount : payment.amount;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;

  const pay = () => {
    checkout.open({
      amount: finalAmount,
      description: `${payment.periodLabel} · ${user?.groupName ?? 'Millance'}${appliedCoupon ? ` · Coupon ${appliedCoupon.coupon.code}` : ''}`,
      name: user?.name ?? 'Member',
      email: user?.email,
      onSuccess: async () => {
        setPaying(true);
        try {
          await processPaymentMutation.mutateAsync({ paymentId: payment.id, status: 'Paid' });
          if (appliedCoupon) {
            await redeemCouponMutation.mutateAsync({ couponId: appliedCoupon.coupon.id, userId: user?.id ?? '' });
          }
          toast.success(
            'Payment successful',
            appliedCoupon
              ? `${formatCurrency(payment.amount)} paid — you saved ${formatCurrency(discount)}!`
              : `${formatCurrency(payment.amount)} paid for ${payment.periodLabel}`,
          );
        } catch (e) {
          toast.error('Payment failed', e instanceof Error ? e.message : 'Unknown error');
        } finally { setPaying(false); }
      },
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-neutral-100 mb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Next Payment Due
        </CardTitle>
      </CardHeader>

      <div className="space-y-4">
        {/* Amount display */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm text-neutral-500">{payment.periodLabel}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className={cn(
                'text-3xl font-bold font-mono',
                appliedCoupon ? 'line-through text-neutral-400 text-xl' : 'text-neutral-900',
              )}>
                {formatCurrency(payment.amount)}
              </p>
              {appliedCoupon && (
                <p className="text-3xl font-bold font-mono text-emerald-600">
                  {formatCurrency(finalAmount)}
                </p>
              )}
            </div>
            {appliedCoupon && (
              <p className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                You save {formatCurrency(discount)} with {appliedCoupon.coupon.code}
              </p>
            )}
          </div>
          <PaymentStatusBadge status={payment.status} />
        </div>

        {/* Coupon input */}
        <CouponInput
          amount={payment.amount}
          appliedResult={appliedCoupon}
          onApplied={setAppliedCoupon}
          onRemoved={() => setAppliedCoupon(null)}
        />

        {/* Pay button */}
        <Button
          variant="primary"
          className="w-full"
          loading={paying}
          leftIcon={<CheckCircle2 className="h-4 w-4" />}
          onClick={pay}
        >
          Pay {formatCurrency(finalAmount)}
          {appliedCoupon && <span className="ml-1.5 text-emerald-200 text-xs">(was {formatCurrency(payment.amount)})</span>}
        </Button>
      </div>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function UserPayments() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading: loading, error } = useQuery({
    queryKey: ['user', 'payments', userId],
    queryFn: () => paymentService.getUserPayments(userId),
    staleTime: 15_000,
    retry: 2,
    enabled: !!userId,
  });

  const processPaymentMutation = useMutation({
    mutationFn: ({ paymentId, status }: { paymentId: string; status: PaymentStatus }) =>
      paymentService.processPayment(paymentId, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(['user', 'payments', userId], (prev: Payment[] | undefined) =>
        prev?.map((p) => (p.id === updated.id ? updated : p)) ?? [updated],
      );
      queryClient.invalidateQueries({ queryKey: ['user', 'vault', userId] });
    },
  });

  const redeemCouponMutation = useMutation({
    mutationFn: ({ couponId, userId: uid }: { couponId: string; userId: string }) =>
      couponService.redeem(couponId, uid),
  });

  const sorted = [...payments].sort((a, b) => b.month - a.month);
  const nextPayment = sorted.find(p => p.status === 'Pending');
  const pending = payments.filter(p => p.status === 'Pending').length;
  const { page, setPage, pageItems, pageCount, total, range } = usePagination(sorted, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">Payments</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {pending > 0 ? (
            <span className="text-warning-600 font-medium">You have {pending} pending payment{pending > 1 ? 's' : ''}</span>
          ) : (
            <span className="text-success-600 font-medium">All payments are up to date!</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: next payment + coupon */}
        <div className="lg:col-span-1 space-y-4">
          {loading ? (
            <div className="h-56 rounded-2xl bg-neutral-100 animate-pulse" />
          ) : nextPayment ? (
            <NextPaymentCard
              payment={nextPayment}
              processPaymentMutation={processPaymentMutation as any}
              redeemCouponMutation={redeemCouponMutation as any}
            />
          ) : (
            <Card>
              <div className="py-8 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-success-50 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success-500" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-800">All caught up!</p>
                  <p className="text-xs text-neutral-500 mt-0.5">No pending payments due</p>
                </div>
              </div>
            </Card>
          )}

          {/* Offers banner */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4" />
              <p className="text-sm font-bold">Exclusive Offers</p>
            </div>
            <p className="text-xs text-brand-200 leading-relaxed">
              Apply coupon codes at checkout to unlock special discounts on your monthly payments. Codes are available from your franchise manager.
            </p>
          </div>
        </div>

        {/* Right: payment history */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <CardHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
              <CardTitle>Payment History</CardTitle>
            </CardHeader>

            {loading ? (
              <SkeletonTable />
            ) : error ? (
              <ErrorState
                description={error instanceof Error ? error.message : 'Failed to load payments'}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['user', 'payments', userId] })}
              />
            ) : payments.length === 0 ? (
              <EmptyState title="No payments yet" icon={<CreditCard className="h-6 w-6" />} />
            ) : (
              <>
                {/* Mobile: stacked */}
                <ul className="sm:hidden divide-y divide-neutral-100">
                  {pageItems.map(p => (
                    <li key={p.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-800">{p.periodLabel}</p>
                        <p className="font-mono font-semibold text-brand-600 mt-0.5">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {p.status === 'Paid' && p.paidAt ? `Paid ${formatDate(p.paidAt)}` : `Due ${formatDate(p.dueDate)}`}
                        </p>
                      </div>
                      <PaymentStatusBadge status={p.status} />
                    </li>
                  ))}
                </ul>

                {/* Desktop: table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>{['Period', 'Amount', 'Due Date', 'Status', 'Paid On'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-3">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {pageItems.map(p => (
                        <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-neutral-800">{p.periodLabel}</td>
                          <td className="px-4 py-3 tabular-nums font-mono text-brand-600 font-semibold">{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-3 text-neutral-500">{formatDate(p.dueDate)}</td>
                          <td className="px-4 py-3"><PaymentStatusBadge status={p.status} /></td>
                          <td className="px-4 py-3 text-neutral-400">{p.paidAt ? formatDate(p.paidAt) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination page={page} pageCount={pageCount} onPageChange={setPage} range={range} total={total} itemLabel="payments" />
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
