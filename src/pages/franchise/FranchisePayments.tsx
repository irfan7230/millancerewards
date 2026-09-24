// Franchise Payments — with simulate action
import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, Search, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { PaymentStatusBadge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { paymentService } from '@/services/payment.service';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';
import type { Payment, FranchiseUser } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function FranchisePayments() {
  const { user } = useAuthStore();
  const franchiseId = user?.franchiseId ?? '';
  const toast = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<FranchiseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [p, u] = await Promise.all([paymentService.getFranchisePayments(franchiseId), userService.getFranchiseUsers(franchiseId)]);
      setPayments(p); setUsers(u);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (franchiseId) void load(); }, [franchiseId]);

  const simulatePaid = async (paymentId: string) => {
    setSimulating(paymentId);
    try {
      const updated = await paymentService.processPayment(paymentId, 'Paid');
      setPayments(prev => prev.map(p => p.id === paymentId ? updated : p));
      toast.success('Payment recorded as Paid');
    } catch (e) { toast.error('Failed', e instanceof Error ? e.message : 'Unknown'); }
    finally { setSimulating(null); }
  };

  const uMap = new Map(users.map(u => [u.id, u]));
  const pending = payments.filter(p => p.status === 'Pending').length;
  const paid = payments.filter(p => p.status === 'Paid').length;

  const q = search.trim().toLowerCase();
  const sorted = [...payments]
    .sort((a, b) => b.month - a.month)
    .filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (q) {
        const member = uMap.get(p.userId);
        const hay = `${member?.name ?? ''} ${member?.email ?? ''} ${p.periodLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  const { page, setPage, pageItems, pageCount, total, range } = usePagination(sorted, 15);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Payments</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          <span className="text-success-600 font-medium">{paid} paid</span> · <span className="text-warning-600 font-medium">{pending} pending</span> · {payments.length} total
        </p>
      </div>
      <Card padding="none">
        {payments.length > 0 && (

                  <div className="grid w-full grid-cols-1 gap-2 border-b border-neutral-100 p-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:gap-3 sm:p-4">

            {/* Search */}
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

              <input
                type="text"
                placeholder="Search by member or period"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full min-w-0 rounded-md border border-neutral-300 bg-white py-2 pl-9 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <div className="min-w-0">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="w-full min-w-0"
              >
                <option value="all">All statuses</option>

                {['Paid', 'Pending', 'Failed', 'Skipped'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

          </div>
      )}
        {loading ? <SkeletonTable /> : error ? <ErrorState description={error} onRetry={load} /> : payments.length === 0 ? (
          <EmptyState title="No payments" icon={<CreditCard className="h-6 w-6" />} />
        ) : sorted.length === 0 ? (
          <EmptyState title="No payments match" icon={<Search className="h-6 w-6" />} description="Try a different search or status filter." className="py-10" />
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="sm:hidden divide-y divide-neutral-100">
              {pageItems.map(p => {
                const member = uMap.get(p.userId);
                return (
                  <li key={p.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-800 truncate">{member?.name ?? p.userId}</p>
                      <p className="text-xs text-neutral-400">{p.periodLabel} · <span className="font-mono text-brand-600">{formatCurrency(p.amount)}</span></p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <PaymentStatusBadge status={p.status} />
                      {p.status === 'Pending' && (
                        <Button size="xs" variant="secondary" loading={simulating === p.id} leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => simulatePaid(p.id)}>
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>{['Member', 'Period', 'Amount', 'Status', 'Due', 'Action'].map(h => <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pageItems.map(p => {
                    const member = uMap.get(p.userId);
                    return (
                      <tr key={p.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-2.5 font-medium text-neutral-800">{member?.name ?? p.userId}</td>
                        <td className="px-4 py-2.5 text-neutral-600">{p.periodLabel}</td>
                        <td className="px-4 py-2.5 tabular-nums font-mono text-brand-600">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-2.5"><PaymentStatusBadge status={p.status} /></td>
                        <td className="px-4 py-2.5 text-neutral-400">{formatDate(p.dueDate)}</td>
                        <td className="px-4 py-2.5">
                          {p.status === 'Pending' && (
                            <Button size="xs" variant="secondary" loading={simulating === p.id} leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => simulatePaid(p.id)}>
                              Mark Paid
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
