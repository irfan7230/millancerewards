// Admin Payments — cross-tenant
import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PaymentStatusBadge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { paymentService } from '@/services/payment.service';
import { franchiseService } from '@/services/franchise.service';
import type { Payment, Franchise } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [p, f] = await Promise.all([paymentService.getAllPayments(), franchiseService.getFranchises()]);
      setPayments(p); setFranchises(f);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const fMap = new Map(franchises.map(f => [f.id, f.name]));

  const summary = { paid: payments.filter(p => p.status === 'Paid').length, pending: payments.filter(p => p.status === 'Pending').length, failed: payments.filter(p => p.status === 'Failed').length };
  const { page, setPage, pageItems, pageCount, total, range } = usePagination(payments, 15);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-neutral-900">All Payments</h1><p className="text-sm text-neutral-500">{payments.length} records ·  {summary.paid} Paid |  {summary.pending} Pending |  {summary.failed} Failed</p></div>
      <Card padding="none">
        {loading ? <SkeletonTable /> : error ? <ErrorState description={error} onRetry={load} /> : payments.length === 0 ? (
          <EmptyState title="No payments found" icon={<CreditCard className="h-6 w-6" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>{['Franchise', 'Period', 'Amount', 'Status', 'Paid At'].map(h => <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pageItems.map(p => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2.5 text-neutral-600">{fMap.get(p.franchiseId) ?? p.franchiseId}</td>
                    <td className="px-4 py-2.5 text-neutral-700">{p.periodLabel}</td>
                    <td className="px-4 py-2.5 tabular-nums font-mono text-neutral-800">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-2.5"><PaymentStatusBadge status={p.status} /></td>
                    <td className="px-4 py-2.5 text-neutral-400">{p.paidAt ? formatDate(p.paidAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} range={range} total={total} itemLabel="payments" />
          </div>
        )}
      </Card>
    </div>
  );
}
