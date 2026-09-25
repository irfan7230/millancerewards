// =============================================================================
// Admin Franchise detail — hierarchical view: Franchise → Plans → Groups →
// Members. Admin can edit the franchise, suspend/activate, and drill into its
// plans/groups with the members attached to each. Fully responsive.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Pencil, Users, Layers, FileText,
  Wallet, ChevronDown, UserRound,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, UserStatusBadge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { SearchFilter } from '@/components/admin/SearchFilter';
import { FranchiseEditor } from '@/components/admin/FranchiseEditor';
import { franchiseService } from '@/services/franchise.service';
import { userService } from '@/services/user.service';
import { groupService } from '@/services/group.service';
import { planService } from '@/services/plan.service';
import { vaultService } from '@/services/vault.service';
import { useToast } from '@/stores/uiStore';
import type { Franchise, FranchiseUser, Group, Plan, GroupType } from '@/types';
import { cn, formatDate, formatCurrency } from '@/lib/utils';

export default function AdminFranchise() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [users, setUsers] = useState<FranchiseUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [groupTypes, setGroupTypes] = useState<GroupType[]>([]);
  const [totalVault, setTotalVault] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const [f, u, g, p, gt] = await Promise.all([
        franchiseService.getFranchise(id),
        userService.getFranchiseUsers(id),
        groupService.getFranchiseGroups(id),
        planService.getFranchisePlans(id),
        groupService.getGroupTypes(),
      ]);
      setFranchise(f); setUsers(u); setGroups(g); setPlans(p); setGroupTypes(gt);
      // Sum member vault balances for this franchise.
      const vaults = await vaultService.getFranchiseVaults(id, u.map(x => x.id));
      setTotalVault(vaults.reduce((s, v) => s + v.balance, 0));
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [id]);

  const toggleStatus = async () => {
    if (!franchise) return;
    try {
      const updated = franchise.status === 'active'
        ? await franchiseService.suspendFranchise(franchise.id)
        : await franchiseService.activateFranchise(franchise.id);
      setFranchise(updated);
      toast.success(updated.status === 'active' ? 'Franchise activated' : 'Franchise suspended');
    } catch { toast.error('Failed to update status'); }
  };

  const gtMap = useMemo(() => new Map(groupTypes.map(t => [t.id, t])), [groupTypes]);
  const groupMap = useMemo(() => new Map(groups.map(g => [g.id, g])), [groups]);

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>;
  if (error || !franchise) return <ErrorState description={error ?? 'Franchise not found'} onRetry={load} />;

  const winnerCount = users.filter(u => u.hasWon).length;
  const activeCount = users.filter(u => !['INACTIVE', 'WINNER'].includes(u.status)).length;

  // Build the hierarchy: each plan → its group → its members.
  const q = memberSearch.trim().toLowerCase();
  const plansWithData = plans.map(plan => {
    const group = groupMap.get(plan.groupId);
    const gt = group ? gtMap.get(group.groupTypeId) : undefined;
    const members = users.filter(u => u.planId === plan.id && (
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    ));
    return { plan, group, gt, members };
  });
  // Members not attached to any loaded plan (edge case) — surface separately.
  const orphanMembers = users.filter(u => !plans.some(p => p.id === u.planId) && (
    !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  ));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/admin/franchises" className="p-2 hover:bg-neutral-100 rounded-lg shrink-0" aria-label="Back to franchises">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 truncate">{franchise.name}</h1>
          <p className="text-sm text-neutral-500">{franchise.ownerName} · {franchise.city}</p>
        </div>
        <Badge variant={franchise.status === 'active' ? 'success' : 'danger'} dot>
          {franchise.status === 'active' ? 'Active' : 'Suspended'}
        </Badge>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditorOpen(true)}>
            Edit
          </Button>
          <Button
            variant={franchise.status === 'active' ? 'destructive' : 'primary'}
            size="sm"
            onClick={toggleStatus}
          >
            {franchise.status === 'active' ? 'Suspend' : 'Activate'}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Members" value={users.length} description={`${activeCount} active`} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Plans" value={plans.length} icon={<FileText className="h-5 w-5" />} />
        <StatCard title="Groups" value={groups.length} icon={<Layers className="h-5 w-5" />} />
        <StatCard title="Vault Balance" value={formatCurrency(totalVault)} description={`${winnerCount} winners`} icon={<Wallet className="h-5 w-5" />} />
      </div>

      {/* Details */}
      <Card>
        <CardHeader><CardTitle>Franchise Details</CardTitle></CardHeader>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Mail className="h-4 w-4" />, label: 'Email', value: franchise.email },
            { icon: <Phone className="h-4 w-4" />, label: 'Phone', value: franchise.phone },
            { icon: <MapPin className="h-4 w-4" />, label: 'City', value: franchise.city },
            { icon: <Calendar className="h-4 w-4" />, label: 'Joined', value: formatDate(franchise.createdAt) },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 min-w-0">
              <span className="h-9 w-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <dt className="text-xs text-neutral-400">{item.label}</dt>
                <dd className="text-sm font-medium text-neutral-800 truncate">{item.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Card>

      {/* Hierarchy: Plans → Groups → Members */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h2 className="text-base font-bold text-neutral-900">Plans, Groups & Members</h2>
          <div className="sm:w-72">
            <SearchFilter search={memberSearch} onSearchChange={setMemberSearch} placeholder="Search members…" />
          </div>
        </div>

        {plans.length === 0 ? (
          <Card><EmptyState title="No plans yet" icon={<FileText className="h-6 w-6" />} description="This franchise hasn't created any plans." /></Card>
        ) : (
          <div className="space-y-4">
            {plansWithData.map(({ plan, group, gt, members }) => (
              <PlanGroup key={plan.id} plan={plan} groupName={group?.name} groupTypeName={gt?.name} members={members} />
            ))}
            {orphanMembers.length > 0 && (
              <PlanGroup plan={null} groupName="Unassigned" groupTypeName={undefined} members={orphanMembers} />
            )}
          </div>
        )}
      </div>

      <FranchiseEditor
        open={editorOpen}
        franchise={franchise}
        onClose={() => setEditorOpen(false)}
        onSaved={(f) => setFranchise(f)}
      />
    </div>
  );
}

// A collapsible plan block showing its group + members.
function PlanGroup({
  plan, groupName, groupTypeName, members,
}: {
  plan: Plan | null;
  groupName?: string;
  groupTypeName?: string;
  members: FranchiseUser[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 bg-neutral-50/70 border-b border-neutral-100 text-left"
      >
        <span className="h-9 w-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-brand-600" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-neutral-900 truncate">{plan ? plan.name : 'Unassigned members'}</span>
            {groupName && <Badge variant="primary">{groupName}</Badge>}
            {groupTypeName && <span className="text-[11px] text-neutral-400">{groupTypeName}</span>}
          </span>
          {plan && (
            <span className="block text-xs text-neutral-400 mt-0.5">
              {formatCurrency(plan.monthlyAmount)}/mo · {plan.durationMonths} months · month {plan.currentMonth}/{plan.durationMonths}
            </span>
          )}
        </span>
        <span className="ml-auto flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500">
            <Users className="h-3.5 w-3.5" /> {members.length}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-neutral-400 transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        members.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-neutral-400">No members in this plan.</p>
        ) : (
          <>
            {/* Mobile: member cards */}
            <ul className="sm:hidden divide-y divide-neutral-100">
              {members.map(m => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-800 truncate">{m.name}</p>
                    <p className="text-xs text-neutral-400 truncate">{m.email}</p>
                  </div>
                  <UserStatusBadge status={m.status} />
                </li>
              ))}
            </ul>

            {/* Desktop: member table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50/50 border-b border-neutral-100">
                  <tr>{['Member', 'Email', 'Phone', 'Status', 'Joined'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-5 py-2.5">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-2.5 font-medium text-neutral-800">{m.name}</td>
                      <td className="px-5 py-2.5 text-neutral-500">{m.email}</td>
                      <td className="px-5 py-2.5 text-neutral-500">{m.phone}</td>
                      <td className="px-5 py-2.5"><UserStatusBadge status={m.status} /></td>
                      <td className="px-5 py-2.5 text-neutral-400">{formatDate(m.joinedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}
    </section>
  );
}
