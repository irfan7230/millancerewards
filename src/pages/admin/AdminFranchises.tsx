// =============================================================================
// Admin Franchises — franchise-based card grid with per-franchise stats,
// search + status filter, create/edit (FranchiseEditor), and suspend/activate.
// Replaces the old flat table. Fully responsive (1 → 2 → 3 columns).
// All data via services (mock now, backend-ready).
// =============================================================================
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Building2, Users, Layers, FileText, Pencil, Power, ExternalLink,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { SearchFilter } from '@/components/admin/SearchFilter';
import { FranchiseEditor } from '@/components/admin/FranchiseEditor';
import { franchiseService } from '@/services/franchise.service';
import { userService } from '@/services/user.service';
import { groupService } from '@/services/group.service';
import { planService } from '@/services/plan.service';
import { useToast } from '@/stores/uiStore';
import type { Franchise } from '@/types';
import { cn, formatDate } from '@/lib/utils';

interface FranchiseStats { members: number; groups: number; plans: number; }
interface LoadedData { franchises: Franchise[]; stats: Record<string, FranchiseStats>; }

export default function AdminFranchises() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Franchise | null>(null);

  const { data, isLoading: loading, error: queryError, refetch: load } = useQuery({
    queryKey: ['adminFranchises'],
    queryFn: async (): Promise<LoadedData> => {
      const [f, users, groups, plans] = await Promise.all([
        franchiseService.getFranchises(),
        userService.getAllUsers(),
        groupService.getAllGroups(),
        planService.getAllPlans(),
      ]);
      const s: Record<string, FranchiseStats> = {};
      for (const fr of f) s[fr.id] = { members: 0, groups: 0, plans: 0 };
      for (const u of users) if (s[u.franchiseId]) s[u.franchiseId].members++;
      for (const g of groups) if (s[g.franchiseId]) s[g.franchiseId].groups++;
      for (const p of plans) if (s[p.franchiseId]) s[p.franchiseId].plans++;
      return { franchises: f, stats: s };
    },
    staleTime: 15_000,
    retry: 2,
  });

  const franchises = data?.franchises ?? [];
  const stats = data?.stats ?? {};
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load') : null;

  const openCreate = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (f: Franchise) => { setEditing(f); setEditorOpen(true); };

  const saveMutation = useMutation({
    mutationFn: (args: { franchise: Franchise; mode: 'create' | 'edit' }) => {
      return Promise.resolve(args);
    },
    onMutate: async ({ franchise, mode }) => {
      await queryClient.cancelQueries({ queryKey: ['adminFranchises'] });
      const prev = queryClient.getQueryData<LoadedData>(['adminFranchises']);
      if (prev) {
        const nextFranchises = mode === 'create'
          ? [...prev.franchises, franchise]
          : prev.franchises.map(x => x.id === franchise.id ? franchise : x);
        const nextStats = mode === 'create'
          ? { ...prev.stats, [franchise.id]: { members: 0, groups: 0, plans: 0 } }
          : prev.stats;
        queryClient.setQueryData(['adminFranchises'], { franchises: nextFranchises, stats: nextStats });
      }
      return { prev };
    },
    onError: (_err, _args, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['adminFranchises'], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFranchises'] });
    },
  });

  const handleSaved = (f: Franchise, mode: 'create' | 'edit') => {
    saveMutation.mutate({ franchise: f, mode });
  };

  const toggleFranchiseMutation = useMutation({
    mutationFn: (f: Franchise) =>
      f.status === 'active'
        ? franchiseService.suspendFranchise(f.id)
        : franchiseService.activateFranchise(f.id),
    onMutate: async (targetFranchise) => {
      await queryClient.cancelQueries({ queryKey: ['adminFranchises'] });
      const prev = queryClient.getQueryData<LoadedData>(['adminFranchises']);
      if (prev) {
        const flippedStatus = targetFranchise.status === 'active' ? 'suspended' : 'active';
        queryClient.setQueryData(['adminFranchises'], {
          franchises: prev.franchises.map(x =>
            x.id === targetFranchise.id ? { ...x, status: flippedStatus as Franchise['status'] } : x
          ),
          stats: prev.stats,
        });
      }
      return { prev, targetFranchise };
    },
    onError: (_err, _f, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['adminFranchises'], ctx.prev);
      toast.error('Failed to update status', _err instanceof Error ? _err.message : 'Unknown');
    },
    onSuccess: (updated, originalFranchise) => {
      toast.success(
        updated.status === 'active' ? 'Franchise activated' : 'Franchise suspended',
        originalFranchise.name
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFranchises'] });
    },
  });

  const toggleStatus = (f: Franchise) => {
    toggleFranchiseMutation.mutate(f);
  };

  const toggling = toggleFranchiseMutation.isPending
    ? (toggleFranchiseMutation.variables as Franchise | undefined)?.id ?? null
    : null;

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => franchises.filter(f => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      f.city.toLowerCase().includes(q) ||
      f.ownerName.toLowerCase().includes(q)
    );
  }), [franchises, statusFilter, q]);

  const activeCount = franchises.filter(f => f.status === 'active').length;
  const { page, setPage, pageItems, pageCount, total, range } = usePagination(filtered, 9);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Franchises</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {franchises.length} tenant{franchises.length !== 1 ? 's' : ''} · {activeCount} active
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate} className="w-full sm:w-auto">
          New Franchise
        </Button>
      </div>

      {/* Search + filter */}
      {!loading && !error && franchises.length > 0 && (
        <SearchFilter
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by name, city or owner…"
          filters={[{
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            ariaLabel: 'Filter by status',
            options: [
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
            ],
          }]}
        />
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={load} />
      ) : franchises.length === 0 ? (
        <Card><EmptyState title="No franchises yet" icon={<Building2 className="h-6 w-6" />} description="Create your first franchise tenant to get started." action={{ label: 'New Franchise', onClick: openCreate }} /></Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState title="No franchises match" icon={<Building2 className="h-6 w-6" />} description="Try a different search or status filter." /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {pageItems.map(f => {
            const s = stats[f.id] ?? { members: 0, groups: 0, plans: 0 };
            return (
              <Card key={f.id} className="flex flex-col hover:shadow-md transition-shadow">
                {/* Head */}
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                    {f.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/admin/franchises/${f.id}`} className="font-bold text-neutral-900 truncate hover:text-brand-600 transition-colors">
                        {f.name}
                      </Link>
                    </div>
                    <p className="text-xs text-neutral-400 truncate">{f.ownerName} · {f.city}</p>
                  </div>
                  <Badge variant={f.status === 'active' ? 'success' : 'danger'} dot>
                    {f.status === 'active' ? 'Active' : 'Suspended'}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <MiniStat icon={<Users className="h-4 w-4" />} label="Members" value={s.members} />
                  <MiniStat icon={<Layers className="h-4 w-4" />} label="Groups" value={s.groups} />
                  <MiniStat icon={<FileText className="h-4 w-4" />} label="Plans" value={s.plans} />
                </div>

                <p className="text-[11px] text-neutral-400 mt-3">Joined {formatDate(f.createdAt)}</p>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-100">
                  <Link
                    to={`/admin/franchises/${f.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-neutral-100 text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" /> Manage
                  </Link>
                  <button
                    onClick={() => openEdit(f)}
                    aria-label={`Edit ${f.name}`}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleStatus(f)}
                    disabled={toggling === f.id}
                    aria-label={f.status === 'active' ? `Suspend ${f.name}` : `Activate ${f.name}`}
                    className={cn(
                      'h-9 w-9 inline-flex items-center justify-center rounded-lg border transition-colors disabled:opacity-50',
                      f.status === 'active'
                        ? 'border-danger-200 text-danger-600 hover:bg-danger-50'
                        : 'border-success-200 text-success-600 hover:bg-success-50',
                    )}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !error && pageCount > 1 && (
        <Card padding="none">
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} range={range} total={total} itemLabel="franchises" />
        </Card>
      )}

      <FranchiseEditor
        open={editorOpen}
        franchise={editing}
        onClose={() => setEditorOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-2 py-2.5 text-center">
      <div className="flex items-center justify-center text-neutral-400 mb-1">{icon}</div>
      <p className="text-lg font-bold text-neutral-900 leading-none tabular-nums">{value}</p>
      <p className="text-[10px] text-neutral-400 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}
