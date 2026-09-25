// =============================================================================
// AdminPrizes — platform-wide prize management
// =============================================================================
import { useState } from 'react';
import { Gift, Plus, Search, Sparkles, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MotionCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { prizeService } from '@/services/prize.service';
import { franchiseService } from '@/services/franchise.service';
import type { Prize, Franchise } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PrizesData { prizes: Prize[]; franchises: Franchise[]; }

export default function AdminPrizes() {
  const [search, setSearch] = useState('');

  const { data, isLoading: loading, error: queryError, refetch: load } = useQuery({
    queryKey: ['adminPrizes'],
    queryFn: async (): Promise<PrizesData> => {
      const [p, f] = await Promise.all([
        prizeService.getAllPrizes(),
        franchiseService.getFranchises(),
      ]);
      return { prizes: p, franchises: f };
    },
    staleTime: 15_000,
    retry: 2,
  });

  const prizes = data?.prizes ?? [];
  const franchises = data?.franchises ?? [];
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load prizes') : null;

  const filteredPrizes = prizes.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.description.toLowerCase().includes(search.toLowerCase())
  );
  const { page, setPage, pageItems, pageCount, total, range } = usePagination(filteredPrizes, 15);

  const totalValue = prizes.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-accent-600 mb-1"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Prize Catalog</span>
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">All Prizes</h1>
          <p className="text-sm text-neutral-500 mt-1">Platform-wide overview of all configured prizes.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white border border-neutral-200 rounded-lg px-4 py-2 shadow-sm flex flex-col items-end">
            <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Total Value</span>
            <span className="text-lg font-bold text-neutral-900 tabular-nums">{formatCurrency(totalValue)}</span>
          </div>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            New Prize
          </Button>
        </div>
      </div>

      <MotionCard 
        padding="none" 
        className="animate-slide-in stagger-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-4 md:p-5 border-b border-neutral-100 bg-neutral-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search prizes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 h-10 rounded-lg border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-shadow shadow-sm"
            />
          </div>
          <div className="text-sm text-neutral-500 font-medium">
            Showing {filteredPrizes.length} of {prizes.length} prizes
          </div>
        </div>

        {loading ? <SkeletonTable /> : error ? <ErrorState description={error} onRetry={load} /> : filteredPrizes.length === 0 ? (
          <EmptyState title="No prizes found" description="Try adjusting your search query." icon={<Gift className="h-6 w-6" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>{['Prize', 'Franchise', 'Description', 'Value', 'Status', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {pageItems.map(p => {
                  const franchise = franchises.find(f => f.id === p.franchiseId);
                  return (
                    <tr key={p.id} className="group">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100 border border-accent-200/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="h-6 w-6 object-cover rounded-md" />
                            ) : (
                              <Gift className="h-5 w-5 text-accent-600" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900 block">{p.name}</span>
                            <span className="text-xs text-neutral-400 font-mono">ID: {p.id.split('-')[0]}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 text-xs font-medium text-neutral-700">
                          <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                          {franchise?.name ?? '—'}
                        </span>
                      </td>
                      <td>
                        <p className="text-sm text-neutral-600 max-w-xs truncate" title={p.description}>
                          {p.description}
                        </p>
                      </td>
                      <td>
                        <span className="font-bold text-neutral-900 tabular-nums bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                          {formatCurrency(p.value)}
                        </span>
                      </td>
                      <td>
                        <Badge variant={p.isAvailable ? 'success' : 'default'} dot>
                          {p.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </td>
                      <td>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} range={range} total={total} itemLabel="prizes" />
          </div>
        )}
      </MotionCard>
    </div>
  );
}
