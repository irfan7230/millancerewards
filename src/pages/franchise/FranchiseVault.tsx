// Franchise Vault — overview of all member vaults
import React, { useEffect, useState } from 'react';
import { Wallet, Search, X } from 'lucide-react';
import { Card, StatCard } from '@/components/ui/Card';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { vaultService } from '@/services/vault.service';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/stores/authStore';
import type { Vault, FranchiseUser } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function FranchiseVault() {
  const { user } = useAuthStore();
  const franchiseId = user?.franchiseId ?? '';

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [users, setUsers] = useState<FranchiseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!franchiseId) return;
    (async () => {
      setLoading(true); setError(null);
      try {
        const u = await userService.getFranchiseUsers(franchiseId);
        const v = await vaultService.getFranchiseVaults(franchiseId, u.map(u => u.id));
        setUsers(u); setVaults(v);
      } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
      finally { setLoading(false); }
    })();
  }, [franchiseId]);

  const uMap = new Map(users.map(u => [u.id, u]));
  const totalBalance = vaults.reduce((s, v) => s + v.balance, 0);
  const totalContributed = vaults.reduce((s, v) => s + v.totalContributed, 0);
  const q = search.trim().toLowerCase();
  const sorted = [...vaults]
    .sort((a, b) => b.balance - a.balance)
    .filter(v => {
      if (!q) return true;
      const member = uMap.get(v.userId);
      return `${member?.name ?? ''} ${member?.email ?? ''}`.toLowerCase().includes(q);
    });
  const { page, setPage, pageItems, pageCount, total, range } = usePagination(sorted, 12);

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Vault Overview</h1><p className="text-sm text-neutral-500 mt-0.5">All member vaults in your franchise</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard title="Total Balance" value={formatCurrency(totalBalance)} icon={<Wallet className="h-5 w-5" />} />
        <StatCard title="Total Contributed" value={formatCurrency(totalContributed)} icon={<Wallet className="h-5 w-5" />} />
        <StatCard title="Avg Balance" value={vaults.length ? formatCurrency(Math.round(totalBalance / vaults.length)) : '₹0'} icon={<Wallet className="h-5 w-5" />} />
      </div>

      {/* Search (only once vaults exist) */}
      {!loading && !error && vaults.length > 0 && (
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by member name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white py-2 pl-9 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <Card padding="none"><SkeletonTable /></Card>
      ) : error ? (
        <ErrorState description={error} />
      ) : vaults.length === 0 ? (
        <Card><EmptyState title="No vaults" icon={<Wallet className="h-6 w-6" />} /></Card>
      ) : sorted.length === 0 ? (
        <Card><EmptyState title="No members match" icon={<Search className="h-6 w-6" />} description="Try a different name or email." /></Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="sm:hidden space-y-3">
            {pageItems.map(v => {
              const member = uMap.get(v.userId);
              return (
                <li key={v.userId}>
                  <Card>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-800 truncate">{member?.name ?? v.userId}</p>
                        <p className="text-xs text-neutral-400 truncate">{member?.email}</p>
                      </div>
                      <p className="tabular-nums font-mono font-bold text-brand-600 shrink-0">{formatCurrency(v.balance)}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-neutral-100">
                      <div><p className="text-[10px] text-neutral-400 uppercase">Contributed</p><p className="text-xs font-mono font-semibold text-success-600">{formatCurrency(v.totalContributed)}</p></div>
                      <div><p className="text-[10px] text-neutral-400 uppercase">Used</p><p className="text-xs font-mono text-neutral-600">{formatCurrency(v.totalUsed)}</p></div>
                      <div><p className="text-[10px] text-neutral-400 uppercase">Txns</p><p className="text-xs font-mono text-neutral-600">{v.transactions.length}</p></div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          {/* Desktop: table */}
          <Card padding="none" className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>{['Member', 'Balance', 'Contributed', 'Used', 'Txns'].map(h => <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pageItems.map(v => {
                    const member = uMap.get(v.userId);
                    return (
                      <tr key={v.userId} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-neutral-800">{member?.name ?? v.userId}</p>
                          <p className="text-xs text-neutral-400">{member?.email}</p>
                        </td>
                        <td className="px-4 py-3 tabular-nums font-mono font-semibold text-brand-600">{formatCurrency(v.balance)}</td>
                        <td className="px-4 py-3 tabular-nums font-mono text-success-600">{formatCurrency(v.totalContributed)}</td>
                        <td className="px-4 py-3 tabular-nums font-mono text-neutral-500">{formatCurrency(v.totalUsed)}</td>
                        <td className="px-4 py-3 tabular-nums text-neutral-500">{v.transactions.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          {pageCount > 1 && (
            <Card padding="none">
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} range={range} total={total} itemLabel="vaults" />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
