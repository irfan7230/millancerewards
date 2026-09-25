import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layers, Search, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { groupService } from '@/services/group.service';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';
import type { Group, NewGroupInput } from '@/types';
import { formatDate } from '@/lib/utils';

const groupSchema = z.object({
  name: z.string().min(2, 'Name required'),
  groupTypeId: z.string().min(1, 'Select a type'),
});
type GroupForm = z.infer<typeof groupSchema>;

export default function FranchiseGroups() {
  const { user } = useAuthStore();
  const franchiseId = user?.franchiseId ?? '';
  const toast = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { register, handleSubmit, reset, watch, formState: { errors } } =
    useForm<GroupForm>({ resolver: zodResolver(groupSchema) });
  const selectedTypeId = watch('groupTypeId');

  const { data: groups = [], isLoading: groupsLoading, error: groupsError } = useQuery({
    queryKey: ['franchiseGroups', franchiseId],
    queryFn: () => groupService.getFranchiseGroups(franchiseId),
    staleTime: 15_000,
    retry: 2,
    enabled: !!franchiseId,
  });

  const { data: groupTypes = [], isLoading: groupTypesLoading } = useQuery({
    queryKey: ['groupTypes'],
    queryFn: () => groupService.getGroupTypes(),
    staleTime: 15_000,
    retry: 2,
  });

  const loading = groupsLoading || groupTypesLoading;
  const error = groupsError
    ? groupsError instanceof Error
      ? groupsError.message
      : 'Failed'
    : null;

  const createGroupMutation = useMutation({
    mutationFn: (data: GroupForm) =>
      groupService.createGroup({ ...data, franchiseId } as NewGroupInput),
    onMutate: async (data: GroupForm) => {
      await queryClient.cancelQueries({ queryKey: ['franchiseGroups', franchiseId] });
      const previousGroups = queryClient.getQueryData<Group[]>(['franchiseGroups', franchiseId]);

      const optimisticGroup: Group = {
        id: `temp-${Date.now()}`,
        name: data.name,
        groupTypeId: data.groupTypeId,
        franchiseId,
        memberCount: 0,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Group[]>(
        ['franchiseGroups', franchiseId],
        (old) => (old ? [...old, optimisticGroup] : [optimisticGroup]),
      );

      return { previousGroups };
    },
    onSuccess: (createdGroup) => {
      queryClient.setQueryData<Group[]>(
        ['franchiseGroups', franchiseId],
        (old) =>
          old
            ? old.map((g) => (g.id.startsWith('temp-') ? createdGroup : g))
            : [createdGroup],
      );
      toast.success('Group created', createdGroup.name);
      setDialogOpen(false);
      reset();
    },
    onError: (err, _variables, context) => {
      if (context?.previousGroups) {
        queryClient.setQueryData(['franchiseGroups', franchiseId], context.previousGroups);
      }
      toast.error('Failed', err instanceof Error ? err.message : 'Unknown');
    },
  });

  const onSubmit = (data: GroupForm) => {
    void createGroupMutation.mutate(data);
  };

  const gtMap = useMemo(() => new Map(groupTypes.map(t => [t.id, t])), [groupTypes]);
  const selectedType = groupTypes.find(t => t.id === selectedTypeId);

  const q = search.trim().toLowerCase();
  const filteredGroups = useMemo(() => groups.filter(g => {
    if (typeFilter !== 'all' && g.groupTypeId !== typeFilter) return false;
    if (q && !g.name.toLowerCase().includes(q)) return false;
    return true;
  }), [groups, typeFilter, q]);
  const { page, setPage, pageItems, pageCount, total, range } = usePagination(filteredGroups, 12);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Groups</h1>
          <p className="text-sm text-neutral-500">{groups.length} membership pool{groups.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
          New Group
        </Button>
      </div>

            {/* Search + type filter (only once groups exist) */}
      {!loading && !error && groups.length > 0 && (
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_12rem] sm:gap-3">

          {/* Search */}
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

            <input
              type="text"
              placeholder="Search groups by name"
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

          {/* Type filter */}
          <div className="min-w-0">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by type"
              className="w-full min-w-0"
            >
              <option value="all">All types</option>

              {groupTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>

        </div>
      )}

      {loading ? (
        <Card padding="none"><SkeletonTable /></Card>
      ) : error ? (
        <ErrorState description={error} onRetry={() => {
          void queryClient.invalidateQueries({ queryKey: ['franchiseGroups', franchiseId] });
          void queryClient.invalidateQueries({ queryKey: ['groupTypes'] });
        }} />
      ) : groups.length === 0 ? (
        <Card><EmptyState title="No groups yet" icon={<Layers className="h-6 w-6" />} description="Create your first membership pool to start onboarding members." action={{ label: 'Create Group', onClick: () => setDialogOpen(true) }} /></Card>
      ) : filteredGroups.length === 0 ? (
        <Card><EmptyState title="No groups match" icon={<Search className="h-6 w-6" />} description="Try a different name or type filter." /></Card>
      ) : (
        <>
          {/* Mobile: card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {pageItems.map(g => {
              const gt = gtMap.get(g.groupTypeId);
              const cap = gt?.capacity ?? 0;
              const pct = cap ? Math.round((g.memberCount / cap) * 100) : 0;
              return (
                <Link key={g.id} to={`/franchise/groups/${g.id}`} className="block">
                  <Card className="hover:border-brand-300 hover:shadow-md transition-all h-full">
                    {/* flex-wrap lets the badge drop below a long name instead of clipping it */}
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-neutral-900 break-words leading-snug">{g.name}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">Created {formatDate(g.createdAt)}</p>
                      </div>
                      <Badge variant="primary" className="flex-none">{gt?.name ?? g.groupTypeId}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                      <span className="text-neutral-500">Occupancy</span>
                      <span className="tabular-nums text-neutral-700">{g.memberCount}/{cap} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Desktop: table */}
          <Card padding="none" className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>{['Group', 'Type', 'Members / Capacity', 'Created', ''].map(h => <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pageItems.map(g => {
                    const gt = gtMap.get(g.groupTypeId);
                    const cap = gt?.capacity ?? 0;
                    const pct = cap ? Math.round((g.memberCount / cap) * 100) : 0;
                    return (
                      <tr key={g.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 font-medium text-neutral-800">{g.name}</td>
                        <td className="px-4 py-3"><Badge variant="primary">{gt?.name ?? g.groupTypeId}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="tabular-nums text-neutral-700 w-20">{g.memberCount}/{cap}</span>
                            <div className="h-1.5 w-28 bg-neutral-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-400">{formatDate(g.createdAt)}</td>
                        <td className="px-4 py-3"><Link to={`/franchise/groups/${g.id}`} className="text-xs text-brand-600 hover:underline">View →</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          {pageCount > 1 && (
            <Card padding="none">
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} range={range} total={total} itemLabel="groups" />
            </Card>
          )}
        </>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Create Group" description="A membership pool that members and plans attach to." size="sm">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input {...register('name')} label="Group Name" placeholder="e.g. Group A — Batch 2026" error={errors.name?.message} />
          <Select {...register('groupTypeId')} label="Group Type" placeholder="Select a type" error={errors.groupTypeId?.message}>
            {groupTypes.map(t => <option key={t.id} value={t.id}>{t.name} · capacity {t.capacity.toLocaleString('en-IN')}</option>)}
          </Select>
          {selectedType && (
            <div className="rounded-lg bg-brand-50 border border-brand-100 p-3 text-xs text-brand-800">
              <span className="font-semibold">{selectedType.name}</span> — {selectedType.description}
            </div>
          )}
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={createGroupMutation.isPending} onClick={handleSubmit(onSubmit)}>Create Group</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}