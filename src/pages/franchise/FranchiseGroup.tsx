// Franchise Group Detail
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, BarChart3, CalendarDays, Trophy, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { UserStatusBadge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { groupService } from '@/services/group.service';
import { userService } from '@/services/user.service';
import type { Group, GroupType, FranchiseUser } from '@/types';
import { formatDate } from '@/lib/utils';

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
      <div className="min-w-0">
        <p className="text-xs font-medium text-neutral-500 leading-snug">{label}</p>
        <p className="mt-1 text-lg sm:text-xl font-semibold text-neutral-900 tabular-nums break-words leading-tight">
          {value}
        </p>
      </div>
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-50 text-brand-600" aria-hidden="true">
        {icon}
      </div>
    </div>
  );
}

export default function FranchiseGroup() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [groupType, setGroupType] = useState<GroupType | null>(null);
  const [members, setMembers] = useState<FranchiseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true); setError(null);
      try {
        const g = await groupService.getGroup(id);
        const types = await groupService.getGroupTypes();
        const gt = types.find(t => t.id === g.groupTypeId) ?? null;
        const users = await userService.getUsersByGroup(id, g.franchiseId);
        setGroup(g); setGroupType(gt); setMembers(users);
      } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="space-y-4">{[1, 2].map(i => <SkeletonCard key={i} />)}</div>;
  if (error || !group) return <ErrorState description={error ?? 'Not found'} />;

  const capacity = groupType?.capacity ?? 1;
  const pct = Math.round((group.memberCount / capacity) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          to="/franchise/groups"
          aria-label="Back to groups"
          className="mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-neutral-200 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <ArrowLeft className="h-4 w-4 text-neutral-700" />
        </Link>
        <div className="min-w-0">
          <h1 className="break-words text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">{group.name}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {groupType?.name ?? group.groupTypeId} · Created {formatDate(group.createdAt)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatTile icon={<Users className="h-4 w-4" />} label="Members" value={`${group.memberCount} / ${capacity}`} />
        <StatTile icon={<BarChart3 className="h-4 w-4" />} label="Capacity used" value={`${pct}%`} />
        <StatTile icon={<CalendarDays className="h-4 w-4" />} label="Created at" value={formatDate(group.createdAt)} />
      </div>

      {/* Members */}
      <Card padding="none">
        <CardHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-neutral-100">
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        {members.length === 0 ? (
          <EmptyState title="No members in this group" className="py-8" />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {members.map(u => (
              <li key={u.id} className="px-4 sm:px-6 py-3">
                {/* Stacks on mobile so status badges never get clipped off-screen;
                    sits on one row from `sm:` where there's room. */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 flex-none rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                      {u.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 break-words">{u.name}</p>
                      <p className="text-xs text-neutral-400 break-all">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pl-9 sm:pl-0">
                    {u.hasWon && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-600">
                        <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                        Winner
                      </span>
                    )}
                    <UserStatusBadge status={u.status} />
                    <Link
                      to={`/franchise/users/${u.id}`}
                      aria-label={`View ${u.name}`}
                      className="inline-flex items-center text-brand-600 hover:underline"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}