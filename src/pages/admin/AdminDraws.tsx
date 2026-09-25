// Admin Draws
import { Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { DrawStatusBadge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { drawService } from '@/services/draw.service';
import { franchiseService } from '@/services/franchise.service';
import type { Draw, Franchise } from '@/types';
import { formatDate } from '@/lib/utils';

interface DrawsData { draws: Draw[]; franchises: Franchise[]; }

export default function AdminDraws() {
  const { data, isLoading: loading, error: queryError, refetch: load } = useQuery({
    queryKey: ['adminDraws'],
    queryFn: async (): Promise<DrawsData> => {
      const [d, f] = await Promise.all([drawService.getAllDraws(), franchiseService.getFranchises()]);
      return { draws: d, franchises: f };
    },
    staleTime: 15_000,
    retry: 2,
  });

  const draws = data?.draws ?? [];
  const franchises = data?.franchises ?? [];
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed') : null;
  const fMap = new Map(franchises.map(f => [f.id, f.name]));
  const sorted = [...draws].sort((a, b) => b.executedAt?.localeCompare(a.executedAt ?? '') ?? 0);
  const { page, setPage, pageItems, pageCount, total, range } = usePagination(sorted, 15);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-neutral-900">All Draws</h1><p className="text-sm text-neutral-500">{draws.filter(d => d.status === 'completed').length} completed · {draws.length} total</p></div>
      <Card padding="none">
        {loading ? <SkeletonTable /> : error ? <ErrorState description={error} onRetry={load} /> : draws.length === 0 ? (
          <EmptyState title="No draws yet" icon={<Trophy className="h-6 w-6" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>{['Franchise', 'Period', 'Status', 'Winners', 'Executed'].map(h => <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pageItems.map(d => (
                  <tr key={d.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2.5 font-medium text-neutral-800">{fMap.get(d.franchiseId) ?? d.franchiseId}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{d.periodLabel}</td>
                    <td className="px-4 py-2.5"><DrawStatusBadge status={d.status} /></td>
                    <td className="px-4 py-2.5 tabular-nums text-neutral-600">{d.winners.length}</td>
                    <td className="px-4 py-2.5 text-neutral-400">{d.executedAt ? formatDate(d.executedAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} range={range} total={total} itemLabel="draws" />
          </div>
        )}
      </Card>
    </div>
  );
}
