// Admin Vaults
import React, { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { Card, StatCard } from '@/components/ui/Card';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { vaultService } from '@/services/vault.service';
import { userService } from '@/services/user.service';
import type { Vault, FranchiseUser } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function AdminVaults() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [users, setUsers] = useState<FranchiseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [v, u] = await Promise.all([vaultService.getAllVaults(), userService.getAllUsers()]);
      setVaults(v); setUsers(u);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const uMap = new Map(users.map(u => [u.id, u]));
  const totalBalance = vaults.reduce((s, v) => s + v.balance, 0);
  const totalContributed = vaults.reduce((s, v) => s + v.totalContributed, 0);
  const sorted = [...vaults].sort((a, b) => b.balance - a.balance);
  const { page, setPage, pageItems, pageCount, total, range } = usePagination(sorted, 15);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-neutral-900">All Vaults</h1><p className="text-sm text-neutral-500">{vaults.length} vaults</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Balance" value={formatCurrency(totalBalance)} icon={<Wallet className="h-5 w-5" />} />
        <StatCard title="Total Contributed" value={formatCurrency(totalContributed)} icon={<span>💰</span>} />
        <StatCard title="Avg Balance" value={vaults.length ? formatCurrency(Math.round(totalBalance / vaults.length)) : '₹0'} icon={<span>📊</span>} />
      </div>
      <Card padding="none">
        {loading ? <SkeletonTable /> : error ? <ErrorState description={error} onRetry={load} /> : vaults.length === 0 ? (
          <EmptyState title="No vaults" icon={<Wallet className="h-6 w-6" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>{['Member', 'Balance', 'Contributed', 'Used', 'Transactions'].map(h => <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pageItems.map(v => {
                  const user = uMap.get(v.userId);
                  return (
                    <tr key={v.userId} className="hover:bg-neutral-50">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-neutral-800">{user?.name ?? v.userId}</p>
                        <p className="text-xs text-neutral-400">{user?.email}</p>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums font-mono font-semibold text-brand-600">{formatCurrency(v.balance)}</td>
                      <td className="px-4 py-2.5 tabular-nums font-mono text-success-600">{formatCurrency(v.totalContributed)}</td>
                      <td className="px-4 py-2.5 tabular-nums font-mono text-neutral-500">{formatCurrency(v.totalUsed)}</td>
                      <td className="px-4 py-2.5 tabular-nums text-neutral-500">{v.transactions.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} range={range} total={total} itemLabel="vaults" />
          </div>
        )}
      </Card>
    </div>
  );
}
