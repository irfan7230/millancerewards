// =============================================================================
// Admin Plans — cross-tenant plans grouped BY FRANCHISE.
// Search (plan name) + franchise + status filters. Collapsible franchise
// sections; mobile cards, desktop tables.
// =============================================================================
import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { SearchFilter } from '@/components/admin/SearchFilter';
import { FranchiseSection } from '@/components/admin/FranchiseSection';
import { planService } from '@/services/plan.service';
import { franchiseService } from '@/services/franchise.service';
import type { Plan, Franchise } from '@/types';
import { formatCurrency } from '@/lib/utils';

const STATUS_VARIANT: Record<Plan['status'], 'success' | 'warning' | 'default' | 'danger'> = {
  active: 'success', draft: 'warning', completed: 'default', archived: 'danger',
};

interface PlansData { plans: Plan[]; franchises: Franchise[]; }

export default function AdminPlans() {
  const [search, setSearch] = useState('');
  const [franchiseFilter, setFranchiseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading: loading, error: queryError, refetch: load } = useQuery({
    queryKey: ['adminPlans'],
    queryFn: async (): Promise<PlansData> => {
      const [p, f] = await Promise.all([planService.getAllPlans(), franchiseService.getFranchises()]);
      return { plans: p, franchises: f };
    },
    staleTime: 15_000,
    retry: 2,
  });

  const plans = data?.plans ?? [];
  const franchises = data?.franchises ?? [];
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load') : null;

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => plans.filter(p => {
    if (franchiseFilter !== 'all' && p.franchiseId !== franchiseFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (q && !p.name.toLowerCase().includes(q)) return false;
    return true;
  }), [plans, franchiseFilter, statusFilter, q]);

  const grouped = useMemo(() => franchises
    .map(f => ({ franchise: f, rows: filtered.filter(p => p.franchiseId === f.id) }))
    .filter(x => x.rows.length > 0),
    [franchises, filtered]);

  const statusOptions = useMemo(() => Array.from(new Set(plans.map(p => p.status))), [plans]);

  const { page, setPage, pageItems: pagedGroups, pageCount, total, range } = usePagination(grouped, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">All Plans</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{plans.length} plans across {franchises.length} franchises</p>
      </div>

      {!loading && !error && plans.length > 0 && (
        <SearchFilter
          search={search}
          onSearchChange={setSearch}
          placeholder="Search plans by name…"
          filters={[
            {
              key: 'franchise', value: franchiseFilter, onChange: setFranchiseFilter,
              ariaLabel: 'Filter by franchise', widthClass: 'sm:w-52',
              options: [{ value: 'all', label: 'All franchises' }, ...franchises.map(f => ({ value: f.id, label: f.name }))],
            },
            {
              key: 'status', value: statusFilter, onChange: setStatusFilter,
              ariaLabel: 'Filter by status', widthClass: 'sm:w-40',
              options: [{ value: 'all', label: 'All statuses' }, ...statusOptions.map(s => ({ value: s, label: s }))],
            },
          ]}
        />
      )}

      {loading ? (
        <Card padding="none"><SkeletonTable /></Card>
      ) : error ? (
        <ErrorState description={error} onRetry={load} />
      ) : grouped.length === 0 ? (
        <Card><EmptyState title="No plans found" icon={<FileText className="h-6 w-6" />} description={q || franchiseFilter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Plans will appear here.'} /></Card>
      ) : (
        <div className="space-y-4">
          {pagedGroups.map(({ franchise, rows }) => (
            <FranchiseSection
              key={franchise.id}
              franchise={franchise}
              count={rows.length}
              summary={`${rows.length} plan${rows.length !== 1 ? 's' : ''}`}
            >
              {/* Mobile cards */}
              <ul className="sm:hidden divide-y divide-neutral-100">
                {rows.map(p => (
                  <li key={p.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-neutral-800 truncate">{p.name}</span>
                      <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                    </div>
                    <p className="text-xs text-neutral-400">
                      <span className="font-mono text-brand-600 font-semibold">{formatCurrency(p.monthlyAmount)}</span>/mo · {p.durationMonths}mo · month {p.currentMonth}/{p.durationMonths}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50/50 border-b border-neutral-100">
                    <tr>{['Plan', 'Monthly', 'Duration', 'Progress', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-5 py-2.5">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {rows.map(p => (
                      <tr key={p.id} className="hover:bg-neutral-50">
                        <td className="px-5 py-2.5 font-medium text-neutral-800">{p.name}</td>
                        <td className="px-5 py-2.5 tabular-nums font-mono text-brand-600">{formatCurrency(p.monthlyAmount)}</td>
                        <td className="px-5 py-2.5 text-neutral-500">{p.durationMonths} months</td>
                        <td className="px-5 py-2.5 tabular-nums text-neutral-600">{p.currentMonth}/{p.durationMonths}</td>
                        <td className="px-5 py-2.5"><Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FranchiseSection>
          ))}
          {pageCount > 1 && (
            <Card padding="none">
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} range={range} total={total} itemLabel="franchises" />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
