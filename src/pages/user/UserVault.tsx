// =============================================================================
// User Vault — Ledger and balance tracking
// =============================================================================
import { Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { vaultService } from '@/services/vault.service';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function UserVault() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const queryClient = useQueryClient();

  const { data: vault = null, isLoading: loading, error } = useQuery({
    queryKey: ['user', 'vault', userId],
    queryFn: () => vaultService.getVault(userId),
    staleTime: 15_000,
    retry: 2,
    enabled: !!userId,
  });

  // Compute + paginate before any early return so hook order stays stable.
  const sortedTx = vault ? [...vault.transactions].reverse() : [];
  const { page, setPage, pageItems, pageCount, total, range } = usePagination(sortedTx, 10);

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>;
  if (error || !vault) return <ErrorState description={(error instanceof Error ? error.message : null) ?? 'Vault not found'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['user', 'vault', userId] })} />;

  return (
  <div className="space-y-6 pb-8">
    {/* Page Header */}
    <div className="space-y-1">
  <h1 className="text-[26px] font-semibold tracking-[-0.025em] text-neutral-950 lg:text-3xl">
    Your Vault
  </h1>

  <p className="max-w-xl text-sm leading-5 text-neutral-500">
    Track your contributions, balance, and draw activity.
  </p>
</div>

    {/* Financial Overview */}
    {/* Financial Overview — minimal premium layout */}
<section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
  <div className="grid grid-cols-1 divide-y divide-neutral-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">

    {/* Current Balance */}
    <div className="px-5 py-5 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
            Current balance
          </p>

          <p className="mt-1.5 text-xl font-semibold tracking-tight text-neutral-950">
            {formatCurrency(vault.balance)}
          </p>

          <p className="mt-1 text-xs text-neutral-400">
            Available balance
          </p>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Wallet className="h-4 w-4" />
        </div>
      </div>
    </div>

    {/* Total Contributed */}
    <div className="px-5 py-5 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
            Total contributed
          </p>

          <p className="mt-1.5 text-xl font-semibold tracking-tight text-neutral-950">
            {formatCurrency(vault.totalContributed)}
          </p>

          <p className="mt-1 text-xs text-neutral-400">
            Lifetime contributions
          </p>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-50 text-success-600">
          <ArrowDownRight className="h-4 w-4" />
        </div>
      </div>
    </div>

    {/* Total Used */}
    <div className="px-5 py-5 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
            Total used
          </p>

          <p className="mt-1.5 text-xl font-semibold tracking-tight text-neutral-950">
            {formatCurrency(vault.totalUsed)}
          </p>

          <p className="mt-1 text-xs text-neutral-400">
            Draw deductions
          </p>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
    </div>

  </div>
</section>

    {/* Ledger */}
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      {/* Ledger Header */}
      <div className="flex flex-col gap-1 border-b border-neutral-100 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
            <Wallet className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-base font-semibold tracking-tight text-neutral-950">
              Transaction Ledger
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              A complete record of your vault activity
            </p>
          </div>
        </div>
      </div>

      {vault.transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Your payments and draw deductions will appear here."
          className="py-16"
        />
      ) : (
        <>
          {/* Mobile */}
          <ul className="divide-y divide-neutral-100 sm:hidden">
  {pageItems.map((tx) => {
    const isCredit = tx.amount >= 0;

    return (
      <li
        key={tx.id}
        className="flex items-center gap-3 px-4 py-3"
      >
        {/* Small status icon */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isCredit
              ? "bg-success-50 text-success-600"
              : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {isCredit ? (
            <ArrowDownRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpRight className="h-3.5 w-3.5" />
          )}
        </div>

        {/* Transaction information */}
        <div className="min-w-0 flex-1">
          <p className="break-words text-[13px] font-medium leading-5 text-neutral-900">
            {tx.type.replace(/_/g, " ")}
          </p>

          <p className="mt-0.5 text-[11px] leading-4 text-neutral-400">
            {formatDate(tx.createdAt)}
          </p>
        </div>

        {/* Amount + balance */}
        <div className="shrink-0 text-right">
          <p
            className={`font-mono text-[13px] font-semibold leading-5 tabular-nums ${
              isCredit ? "text-success-600" : "text-neutral-800"
            }`}
          >
            {tx.amount > 0 ? "+" : ""}
            {formatCurrency(tx.amount)}
          </p>

          <p className="mt-0.5 font-mono text-[10px] leading-4 tabular-nums text-neutral-400">
            Bal {formatCurrency(tx.balanceAfter)}
          </p>
        </div>
      </li>
    );
  })}
</ul>

          {/* Desktop */}
          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/70">
                  {["Date", "Type", "Amount", "Balance"].map((heading) => (
                    <th
                      key={heading}
                      className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100">
                {pageItems.map((tx) => {
                  const isCredit = tx.amount >= 0;

                  return (
                    <tr
                      key={tx.id}
                      className="group transition-colors hover:bg-neutral-50/70"
                    >
                      <td className="px-6 py-4 text-sm text-neutral-500">
                        {formatDate(tx.createdAt)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              isCredit
                                ? "bg-success-50 text-success-600"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownRight className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium capitalize text-neutral-900">
                              {tx.type.replace(/_/g, " ")}
                            </p>

                            {tx.meta && (
                              <p className="mt-0.5 max-w-[280px] truncate text-xs text-neutral-400">
                                {tx.meta.note ||
                                  tx.meta.drawId ||
                                  tx.meta.productId ||
                                  ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td
                        className={`px-6 py-4 font-mono font-semibold tabular-nums ${
                          isCredit
                            ? "text-success-600"
                            : "text-neutral-700"
                        }`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {formatCurrency(tx.amount)}
                      </td>

                      <td className="px-6 py-4 font-mono text-sm font-medium tabular-nums text-neutral-600">
                        {formatCurrency(tx.balanceAfter)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Ledger Footer — pagination */}
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} range={range} total={total} itemLabel="transactions" />
        </>
      )}
    </section>
  </div>
);
}