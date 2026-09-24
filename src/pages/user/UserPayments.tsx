// =============================================================================
// User Payments — Payment history & active dues
// =============================================================================
import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PaymentStatusBadge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { paymentService } from '@/services/payment.service';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';
import { useCheckout } from '@/components/payments/CheckoutProvider';
import type { Payment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function UserPayments() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const toast = useToast();
  const checkout = useCheckout();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  const load = async () => {
    if (!userId) return;
    setLoading(true); setError(null);
    try { setPayments(await paymentService.getUserPayments(userId)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [userId]);

  const payViaCheckout = (payment: Payment) => {
    checkout.open({
      amount: payment.amount,
      description: `${payment.periodLabel} · ${user?.groupName ?? 'Millance'} plan`,
      name: user?.name ?? 'Member',
      email: user?.email,
      onSuccess: async () => {
        setPaying(payment.id);
        try {
          const updated = await paymentService.processPayment(payment.id, 'Paid');
          setPayments(prev => prev.map(p => p.id === payment.id ? updated : p));
          toast.success('Payment successful', `${formatCurrency(payment.amount)} paid for ${payment.periodLabel}`);
        } catch (e) { toast.error('Payment failed', e instanceof Error ? e.message : 'Unknown'); }
        finally { setPaying(null); }
      },
    });
  };

  const sorted = [...payments].sort((a, b) => b.month - a.month);
  const pending = payments.filter(p => p.status === 'Pending').length;
  const { page, setPage, pageItems, pageCount, total, range } = usePagination(sorted, 10);

  return (
    <div className="space-y-6">
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

      <Card padding="none">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-neutral-100"><CardTitle>Payment History</CardTitle></CardHeader>
        {loading ? <SkeletonTable /> : error ? <ErrorState description={error} onRetry={load} /> : payments.length === 0 ? (
          <EmptyState title="No payments yet" icon={<CreditCard className="h-6 w-6" />} />
        ) : (
          <>
            {/* Mobile: stacked cards (no horizontal scroll) */}
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
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {p.status === 'Paid' && <PaymentStatusBadge status="Paid" />}
                    {p.status === 'Pending' && (
                      <Button
                        size="xs"
                        variant="primary"
                        loading={paying === p.id}
                        leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        onClick={() => payViaCheckout(p)}
                      >
                        Pay
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: full table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>{['Period', 'Amount', 'Due Date', 'Status', 'Paid On', 'Action'].map(h => <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pageItems.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-neutral-800">{p.periodLabel}</td>
                      <td className="px-4 py-3 tabular-nums font-mono text-brand-600 font-semibold">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 text-neutral-500">{formatDate(p.dueDate)}</td>
                      <td className="px-4 py-3">{p.status === 'Paid' && <PaymentStatusBadge status="Paid" />}</td>
                      <td className="px-4 py-3 text-neutral-400">{p.paidAt ? formatDate(p.paidAt) : '—'}</td>
                      <td className="px-4 py-3">
                        {p.status === 'Pending' && (
                          <Button
                            size="xs"
                            variant="primary"
                            loading={paying === p.id}
                            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                            onClick={() => payViaCheckout(p)}
                          >
                            Pay
                          </Button>
                        )}
                      </td>
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
  );
}
