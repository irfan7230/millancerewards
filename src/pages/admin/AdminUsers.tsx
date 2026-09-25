// =============================================================================
// Admin Members — cross-tenant members grouped BY FRANCHISE.
// Search (name/email/franchise) + franchise + status filters. Each franchise is
// a collapsible section (FranchiseSection). Mobile cards, desktop tables.
// =============================================================================
import { useMemo, useState } from 'react';
import { Users, UserRound } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { UserStatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { SearchFilter } from '@/components/admin/SearchFilter';
import { FranchiseSection } from '@/components/admin/FranchiseSection';
import { userService } from '@/services/user.service';
import { franchiseService } from '@/services/franchise.service';
import type { FranchiseUser, Franchise } from '@/types';
import { formatDate } from '@/lib/utils';

interface UsersData { users: FranchiseUser[]; franchises: Franchise[]; }

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [franchiseFilter, setFranchiseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading: loading, error: queryError, refetch: load } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async (): Promise<UsersData> => {
      const [u, f] = await Promise.all([userService.getAllUsers(), franchiseService.getFranchises()]);
      return { users: u, franchises: f };
    },
    staleTime: 15_000,
    retry: 2,
  });

  const users = data?.users ?? [];
  const franchises = data?.franchises ?? [];
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load') : null;

  const q = search.trim().toLowerCase();
  const franchiseMap = useMemo(() => new Map(franchises.map(f => [f.id, f.name])), [franchises]);

  const filtered = useMemo(() => users.filter(u => {
    if (franchiseFilter !== 'all' && u.franchiseId !== franchiseFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (franchiseMap.get(u.franchiseId) ?? '').toLowerCase().includes(q)
    );
  }), [users, franchiseFilter, statusFilter, q, franchiseMap]);

  // Group filtered members by franchise, only showing franchises that have matches.
  const grouped = useMemo(() => franchises
    .map(f => ({ franchise: f, members: filtered.filter(u => u.franchiseId === f.id) }))
    .filter(g => g.members.length > 0),
    [franchises, filtered]);

  const statusOptions = useMemo(() => Array.from(new Set(users.map(u => u.status))).sort(), [users]);

  // Paginate the franchise sections (6 franchises per page).
  const { page, setPage, pageItems: pagedGroups, pageCount, total, range } = usePagination(grouped, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">All Members</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{users.length} members across {franchises.length} franchises</p>
      </div>

      {!loading && !error && users.length > 0 && (
        <SearchFilter
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by name, email or franchise…"
          filters={[
            {
              key: 'franchise', value: franchiseFilter, onChange: setFranchiseFilter,
              ariaLabel: 'Filter by franchise', widthClass: 'sm:w-52',
              options: [{ value: 'all', label: 'All franchises' }, ...franchises.map(f => ({ value: f.id, label: f.name }))],
            },
            {
              key: 'status', value: statusFilter, onChange: setStatusFilter,
              ariaLabel: 'Filter by status', widthClass: 'sm:w-44',
              options: [{ value: 'all', label: 'All statuses' }, ...statusOptions.map(s => ({ value: s, label: s.replace(/_/g, ' ') }))],
            },
          ]}
        />
      )}

      {loading ? (
        <Card padding="none"><SkeletonTable /></Card>
      ) : error ? (
        <ErrorState description={error} onRetry={load} />
      ) : grouped.length === 0 ? (
        <Card><EmptyState title="No members found" icon={<Users className="h-6 w-6" />} description={q || franchiseFilter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Members will appear here.'} /></Card>
      ) : (
        <div className="space-y-4">
          {pagedGroups.map(({ franchise, members }) => (
            <FranchiseSection
              key={franchise.id}
              franchise={franchise}
              count={members.length}
              summary={`${members.length} member${members.length !== 1 ? 's' : ''}`}
            >
              {/* Mobile cards */}
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

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50/50 border-b border-neutral-100">
                    <tr>{['Name', 'Email', 'Status', 'Won?', 'Joined'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-5 py-2.5">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {members.map(m => (
                      <tr key={m.id} className="hover:bg-neutral-50">
                        <td className="px-5 py-2.5 font-medium text-neutral-800">{m.name}</td>
                        <td className="px-5 py-2.5 text-neutral-500">{m.email}</td>
                        <td className="px-5 py-2.5"><UserStatusBadge status={m.status} /></td>
                        <td className="px-5 py-2.5">{m.hasWon ? <span className="text-accent-600 font-semibold text-xs">🏆 Yes</span> : <span className="text-neutral-400 text-xs">No</span>}</td>
                        <td className="px-5 py-2.5 text-neutral-400">{formatDate(m.joinedAt)}</td>
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
