// Franchise Prizes
import React, { useEffect, useState } from 'react';
import { Plus, Gift, Search, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { prizeService } from '@/services/prize.service';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';
import type { Prize } from '@/types';
import { formatCurrency } from '@/lib/utils';

const prizeSchema = z.object({
  name: z.string().min(2, 'Name required'),
  description: z.string().min(1, 'Description required'),
  value: z.coerce.number().min(1, 'Value required'),
});
type PrizeForm = z.infer<typeof prizeSchema>;

export default function FranchisePrizes() {
  const { user } = useAuthStore();
  const franchiseId = user?.franchiseId ?? '';
  const toast = useToast();

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [availFilter, setAvailFilter] = useState('all');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PrizeForm>({ resolver: zodResolver(prizeSchema) as any });

  const load = async () => {
    setLoading(true); setError(null);
    try { setPrizes(await prizeService.getFranchisePrizes(franchiseId)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (franchiseId) void load(); }, [franchiseId]);

  const onSubmit = async (data: PrizeForm) => {
    setCreating(true);
    try {
      const p = await prizeService.createPrize({ ...data, franchiseId, isAvailable: true });
      setPrizes(prev => [...prev, p]);
      toast.success('Prize created', p.name);
      setDialogOpen(false); reset();
    } catch (e) { toast.error('Failed', e instanceof Error ? e.message : 'Unknown'); }
    finally { setCreating(false); }
  };

  const q = search.trim().toLowerCase();
  const sorted = [...prizes]
    .sort((a, b) => b.value - a.value)
    .filter(p => {
      if (availFilter === 'available' && !p.isAvailable) return false;
      if (availFilter === 'awarded' && p.isAvailable) return false;
      if (q && !(p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))) return false;
      return true;
    });
  const { page, setPage, pageItems, pageCount, total, range } = usePagination(sorted, 12);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Prizes</h1><p className="text-sm text-neutral-500">{prizes.length} prize{prizes.length !== 1 ? 's' : ''} configured</p></div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">Add Prize</Button>
      </div>

            {/* Search + availability filter (only once prizes exist) */}
      {!loading && !error && prizes.length > 0 && (
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_12rem] sm:gap-3">

          {/* Search */}
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

            <input
              type="text"
              placeholder="Search prizes by name"
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

          {/* Availability filter */}
          <div className="min-w-0">
            <Select
              value={availFilter}
              onChange={(e) => setAvailFilter(e.target.value)}
              aria-label="Filter by availability"
              className="w-full min-w-0"
            >
              <option value="all">All prizes</option>
              <option value="available">Available</option>
              <option value="awarded">Awarded</option>
            </Select>
          </div>

        </div>
      )}

      {loading ? (
        <Card padding="none"><SkeletonTable /></Card>
      ) : error ? (
        <ErrorState description={error} onRetry={load} />
      ) : prizes.length === 0 ? (
        <Card><EmptyState title="No prizes yet" icon={<Gift className="h-6 w-6" />} description="Prizes are awarded automatically in the monthly draw." action={{ label: 'Add Prize', onClick: () => setDialogOpen(true) }} /></Card>
      ) : sorted.length === 0 ? (
        <Card><EmptyState title="No prizes match" icon={<Search className="h-6 w-6" />} description="Try a different search or filter." /></Card>
      ) : (
        <>
          {/* Mobile: card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {pageItems.map(p => (
              <Card key={p.id}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="font-bold text-neutral-900">{p.name}</p>
                  <Badge variant={p.isAvailable ? 'success' : 'default'} dot>{p.isAvailable ? 'Available' : 'Awarded'}</Badge>
                </div>
                <p className="text-lg font-bold font-mono text-brand-600">{formatCurrency(p.value)}</p>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{p.description}</p>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card padding="none" className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>{['Name', 'Value', 'Description', 'Status'].map(h => <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pageItems.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-800">{p.name}</td>
                      <td className="px-4 py-3 tabular-nums font-mono font-semibold text-brand-600">{formatCurrency(p.value)}</td>
                      <td className="px-4 py-3 text-neutral-500">{p.description}</td>
                      <td className="px-4 py-3"><Badge variant={p.isAvailable ? 'success' : 'default'} dot>{p.isAvailable ? 'Available' : 'Awarded'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {pageCount > 1 && (
            <Card padding="none">
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} range={range} total={total} itemLabel="prizes" />
            </Card>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Prize" size="sm">
        <form className="space-y-4" onSubmit={(handleSubmit as any)(onSubmit)}>
          <Input {...register('name')} label="Prize Name" placeholder="iPhone 16 Pro" error={errors.name?.message} />
          <Input label="Description" {...register('description')} error={errors.description?.message} placeholder="E.g., Latest model" />
          <Input {...register('value')} type="number" label="Value (₹)" placeholder="134900" error={errors.value?.message} />
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={creating} onClick={(handleSubmit as any)(onSubmit)}>Add Prize</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
