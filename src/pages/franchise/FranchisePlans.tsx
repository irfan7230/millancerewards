import { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Search, X } from 'lucide-react';
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
import { planService } from '@/services/plan.service';
import { groupService } from '@/services/group.service';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';
import type { Plan, Group, NewPlanInput } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const planSchema = z.object({
  name: z.string().min(2, 'Plan name required'),
  groupId: z.string().min(1, 'Select a group'),
  durationMonths: z.coerce.number().int().min(1, 'Min 1 month').max(120, 'Too long'),
  monthlyAmount: z.coerce.number().int().min(100, 'Min ₹100'),
  startDate: z.string().min(1, 'Start date required'),
});
// Input type (raw string fields from the form) vs output type (coerced numbers).
type PlanFormInput = z.input<typeof planSchema>;
type PlanForm = z.output<typeof planSchema>;

const STATUS_VARIANT: Record<Plan['status'], 'success' | 'warning' | 'default' | 'danger'> = {
  active: 'success', draft: 'warning', completed: 'default', archived: 'danger',
};

export default function FranchisePlans() {
  const { user } = useAuthStore();
  const franchiseId = user?.franchiseId ?? '';
  const toast = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PlanFormInput, unknown, PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: { startDate: new Date().toISOString().slice(0, 10) },
  });

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [p, g] = await Promise.all([
        planService.getFranchisePlans(franchiseId),
        groupService.getFranchiseGroups(franchiseId),
      ]);
      setPlans(p); setGroups(g);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (franchiseId) void load(); }, [franchiseId]);

  // Live total preview from the form values.
  const duration = watch('durationMonths');
  const monthly = watch('monthlyAmount');
  const total = useMemo(
    () => (Number(duration) > 0 && Number(monthly) > 0 ? Number(duration) * Number(monthly) : 0),
    [duration, monthly],
  );

  const onSubmit = async (data: PlanForm) => {
    setCreating(true);
    try {
      const group = groups.find(g => g.id === data.groupId);
      if (!group) throw new Error('Selected group not found');
      const input: NewPlanInput = {
        franchiseId,
        groupId: data.groupId,
        name: data.name,
        groupType: group.groupTypeId,           // carry the group's type onto the plan
        durationMonths: data.durationMonths,
        monthlyAmount: data.monthlyAmount,
        startDate: new Date(data.startDate).toISOString(),
      };
      const created = await planService.createPlan(input);
      setPlans(prev => [...prev, created]);      // reactive update
      toast.success('Plan created', created.name);
      setDialogOpen(false);
      reset({ startDate: new Date().toISOString().slice(0, 10) } as PlanFormInput);
    } catch (e) { toast.error('Failed', e instanceof Error ? e.message : 'Unknown'); }
    finally { setCreating(false); }
  };

  const groupMap = new Map(groups.map(g => [g.id, g]));

  const q = search.trim().toLowerCase();
  const filteredPlans = plans.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (q && !(p.name.toLowerCase().includes(q) || (groupMap.get(p.groupId)?.name ?? '').toLowerCase().includes(q))) return false;
    return true;
  });
  const planStatuses = Array.from(new Set(plans.map(p => p.status)));
  const { page, setPage, pageItems, pageCount, total: pagedTotal, range } = usePagination(filteredPlans, 12);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Plans</h1>
          <p className="text-sm text-neutral-500">{plans.length} plan{plans.length !== 1 ? 's' : ''} configured</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setDialogOpen(true)}
          disabled={groups.length === 0}
          className="w-full sm:w-auto"
        >
          New Plan
        </Button>
      </div>

      {groups.length === 0 && !loading && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700">
          Create a <a href="/franchise/groups" className="font-semibold underline">group</a> first — every plan must belong to a group.
        </div>
      )}

            {/* Search + status filter (only once plans exist) */}
      {!loading && !error && plans.length > 0 && (
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_12rem] sm:gap-3">

          {/* Search */}
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

            <input
              type="text"
              placeholder="Search plans by name or group"
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

              {planStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

        </div>
      )}

      {loading ? (
        <Card padding="none"><SkeletonTable /></Card>
      ) : error ? (
        <ErrorState description={error} onRetry={load} />
      ) : plans.length === 0 ? (
        <Card><EmptyState title="No plans yet" icon={<FileText className="h-6 w-6" />} description="Define a savings plan that members can subscribe to." action={groups.length > 0 ? { label: 'Create Plan', onClick: () => setDialogOpen(true) } : undefined} /></Card>
      ) : filteredPlans.length === 0 ? (
        <Card><EmptyState title="No plans match" icon={<Search className="h-6 w-6" />} description="Try a different name or status filter." /></Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {pageItems.map(p => {
              const pct = Math.round((p.currentMonth / p.durationMonths) * 100);
              return (
                <Card key={p.id}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-neutral-900 truncate">{p.name}</p>
                      <p className="text-xs text-neutral-400">{groupMap.get(p.groupId)?.name ?? '—'}</p>
                    </div>
                    <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-xl font-bold font-mono text-brand-600">{formatCurrency(p.monthlyAmount)}</span>
                    <span className="text-xs text-neutral-400">/mo · {p.durationMonths}mo</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-neutral-500">Progress</span>
                    <span className="tabular-nums text-neutral-700">Month {p.currentMonth}/{p.durationMonths}</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Desktop: table */}
          <Card padding="none" className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>{['Plan', 'Group', 'Monthly', 'Duration', 'Progress', 'Started', 'Status'].map(h => <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pageItems.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-800">{p.name}</td>
                      <td className="px-4 py-3 text-neutral-500">{groupMap.get(p.groupId)?.name ?? '—'}</td>
                      <td className="px-4 py-3 tabular-nums font-mono text-brand-600">{formatCurrency(p.monthlyAmount)}</td>
                      <td className="px-4 py-3 text-neutral-500">{p.durationMonths} mo</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums text-neutral-600 text-xs w-10">{p.currentMonth}/{p.durationMonths}</span>
                          <div className="h-1.5 w-24 bg-neutral-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.round((p.currentMonth / p.durationMonths) * 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-400">{formatDate(p.startDate)}</td>
                      <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {pageCount > 1 && (
            <Card padding="none">
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} range={range} total={pagedTotal} itemLabel="plans" />
            </Card>
          )}
        </>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Create Plan" description="Plans belong to a group; members subscribe to a plan." size="md">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input {...register('name')} label="Plan Name" placeholder="e.g. Gold 24" error={errors.name?.message} />
          <Select {...register('groupId')} label="Group" placeholder="Select a group" error={errors.groupId?.message}>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input {...register('monthlyAmount')} type="number" label="Monthly Amount (₹)" placeholder="2000" error={errors.monthlyAmount?.message} />
            <Input {...register('durationMonths')} type="number" label="Duration (months)" placeholder="24" error={errors.durationMonths?.message} />
          </div>
          <Input {...register('startDate')} type="date" label="Start Date" error={errors.startDate?.message} />

          {/* Live total preview */}
          <div className="rounded-lg bg-brand-50 border border-brand-100 p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-brand-700">Total planned amount</span>
            <span className="text-sm font-bold font-mono text-brand-900">{total > 0 ? formatCurrency(total) : '—'}</span>
          </div>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={creating} onClick={handleSubmit(onSubmit)}>Create Plan</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
