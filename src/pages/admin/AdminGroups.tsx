// =============================================================================
// Admin Groups — cross-tenant groups grouped BY FRANCHISE.
// Search (group name) + franchise filter. Collapsible franchise sections;
// mobile cards, desktop tables. Shows occupancy vs capacity.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { SearchFilter } from '@/components/admin/SearchFilter';
import { FranchiseSection } from '@/components/admin/FranchiseSection';
import { groupService } from '@/services/group.service';
import { franchiseService } from '@/services/franchise.service';
import type { Group, Franchise, GroupType } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AdminGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [groupTypes, setGroupTypes] = useState<GroupType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [franchiseFilter, setFranchiseFilter] = useState('all');

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [g, f] = await Promise.all([groupService.getAllGroups(), franchiseService.getFranchises()]);
      setGroups(g); setFranchises(f);
      setGroupTypes(groupService.getGroupTypes());
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const gtMap = useMemo(() => new Map(groupTypes.map(t => [t.id, t])), [groupTypes]);
  const q = search.trim().toLowerCase();

  const filtered = useMemo(() => groups.filter(g => {
    if (franchiseFilter !== 'all' && g.franchiseId !== franchiseFilter) return false;
    if (q && !g.name.toLowerCase().includes(q)) return false;
    return true;
  }), [groups, franchiseFilter, q]);

  const grouped = useMemo(() => franchises
    .map(f => ({ franchise: f, rows: filtered.filter(g => g.franchiseId === f.id) }))
    .filter(x => x.rows.length > 0),
    [franchises, filtered]);

  const { page, setPage, pageItems: pagedGroups, pageCount, total, range } = usePagination(grouped, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">All Groups</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{groups.length} groups across {franchises.length} franchises</p>
      </div>

      {!loading && !error && groups.length > 0 && (
        <SearchFilter
          search={search}
          onSearchChange={setSearch}
          placeholder="Search groups by name…"
          filters={[{
            key: 'franchise', value: franchiseFilter, onChange: setFranchiseFilter,
            ariaLabel: 'Filter by franchise', widthClass: 'sm:w-52',
            options: [{ value: 'all', label: 'All franchises' }, ...franchises.map(f => ({ value: f.id, label: f.name }))],
          }]}
        />
      )}

      {loading ? (
        <Card padding="none"><SkeletonTable /></Card>
      ) : error ? (
        <ErrorState description={error} onRetry={load} />
      ) : grouped.length === 0 ? (
        <Card><EmptyState title="No groups found" icon={<Layers className="h-6 w-6" />} description={q || franchiseFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Groups will appear here.'} /></Card>
      ) : (
        <div className="space-y-4">
          {pagedGroups.map(({ franchise, rows }) => (
            <FranchiseSection
              key={franchise.id}
              franchise={franchise}
              count={rows.length}
              summary={`${rows.length} group${rows.length !== 1 ? 's' : ''}`}
            >
              {/* Mobile cards */}
              <ul className="sm:hidden divide-y divide-neutral-100">
                {rows.map(g => {
                  const gt = gtMap.get(g.groupTypeId);
                  const cap = gt?.capacity ?? 0;
                  const pct = cap ? Math.round((g.memberCount / cap) * 100) : 0;
                  return (
                    <li key={g.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-medium text-neutral-800 truncate">{g.name}</span>
                        <Badge variant="primary">{gt?.name ?? g.groupTypeId}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-neutral-400">Occupancy</span>
                        <span className="tabular-nums text-neutral-600">{g.memberCount}/{cap} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50/50 border-b border-neutral-100">
                    <tr>{['Group', 'Type', 'Members / Capacity', 'Created'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-5 py-2.5">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {rows.map(g => {
                      const gt = gtMap.get(g.groupTypeId);
                      const cap = gt?.capacity ?? 0;
                      const pct = cap ? Math.round((g.memberCount / cap) * 100) : 0;
                      return (
                        <tr key={g.id} className="hover:bg-neutral-50">
                          <td className="px-5 py-2.5 font-medium text-neutral-800">{g.name}</td>
                          <td className="px-5 py-2.5"><Badge variant="primary">{gt?.name ?? g.groupTypeId}</Badge></td>
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="tabular-nums text-neutral-700 w-16">{g.memberCount}/{cap}</span>
                              <div className="h-1.5 w-28 bg-neutral-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-2.5 text-neutral-400">{formatDate(g.createdAt)}</td>
                        </tr>
                      );
                    })}
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
