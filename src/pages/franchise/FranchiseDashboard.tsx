// =============================================================================
// Franchise Dashboard — the primary management view
// =============================================================================
import { Link } from 'react-router-dom';
import { Users, Trophy, CreditCard, Wallet, AlertTriangle, Plus, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { UserStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { userService } from '@/services/user.service';
import { reportsService } from '@/services/reports.service';
import { useAuthStore } from '@/stores/authStore';
import type { FranchiseUser } from '@/types';
import { formatCurrency, currentPeriodLabel, formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';

export default function FranchiseDashboard() {
  const period = currentPeriodLabel();
  const { user } = useAuthStore();
  const franchiseId = user?.franchiseId ?? '';

  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErr, refetch: refetchStats } = useQuery({
    queryKey: ['reports', 'franchiseDashboard', franchiseId],
    queryFn: () => reportsService.getFranchiseDashboard(franchiseId),
    refetchInterval: 30_000,
    enabled: !!franchiseId,
    retry: 2,
  });

  const { data: paymentSummary, isLoading: psLoading, isError: psError, error: psErr, refetch: refetchPs } = useQuery({
    queryKey: ['reports', 'paymentSummary', franchiseId],
    queryFn: () => reportsService.getPaymentSummary(franchiseId),
    refetchInterval: 30_000,
    enabled: !!franchiseId,
    retry: 2,
  });

  const { data: recentUsers, isLoading: ruLoading } = useQuery({
    queryKey: ['franchiseUsers', 'recent', franchiseId],
    queryFn: () => userService.getFranchiseUsers(franchiseId).then(users => users.slice(-6).reverse()),
    enabled: !!franchiseId,
    retry: 2,
  });

  const loading = statsLoading || psLoading;
  const isError = statsError || psError;
  const error = statsErr ? (statsErr instanceof Error ? statsErr.message : 'Failed to load')
              : psErr ? (psErr instanceof Error ? psErr.message : 'Failed to load')
              : null;

  const retry = () => {
    void refetchStats();
    void refetchPs();
  };

  if (loading && !stats && !paymentSummary) return <SkeletonDashboard />;
  if (isError && !stats && !paymentSummary) return <ErrorState description={error ?? 'Failed to load'} onRetry={retry} />;

  const currentPeriodRow = paymentSummary?.find(row => row.periodLabel === period);
  const paidThisMonth = currentPeriodRow?.paidCount ?? 0;
  const pendingThisMonth = stats?.pendingPayments ?? currentPeriodRow?.pendingCount ?? 0;
  const pendingDisplay = currentPeriodRow?.pendingCount ?? pendingThisMonth;

  const totalMembers = stats?.totalMembers ?? 0;
  const totalWinners = stats?.totalWinners ?? 0;
  const totalVault = stats?.totalVault ?? 0;

  const chartData = (paymentSummary ?? [])
    .slice(-6)
    .map(row => ({
      label: row.periodLabel.split(' ')[0],
      paid: row.paidCount,
      pending: row.pendingCount,
    }));

  const members: FranchiseUser[] = recentUsers ?? [];

  return (
  <div className="w-full space-y-5 pb-6 sm:space-y-6">

    {/* ── Header ─────────────────────────────────────────────────────────── */}
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-neutral-950 sm:text-3xl">
          Franchise Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-500 sm:text-[15px]">
          {period}
          <span className="mx-1.5 text-neutral-300">·</span>
          {user?.name}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
        <Link to="/franchise/groups" className="min-w-0">
          <Button
            variant="secondary"
            leftIcon={<Layers className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            New Group
          </Button>
        </Link>

        <Link to="/franchise/users" className="min-w-0">
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            Add Member
          </Button>
        </Link>
      </div>
    </section>

    {/* ── KPI Overview ───────────────────────────────────────────────────── */}
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">

      {/* Active Members */}
      <div className="min-w-0 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 sm:h-10 sm:w-10">
            <Users className="h-[18px] w-[18px]" />
          </div>
        </div>

        <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">
          Active Members
        </p>

        <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-[28px]">
          {totalMembers}
        </p>

        <p className="mt-1 truncate text-xs text-neutral-400">
          {totalWinners} {totalWinners === 1 ? 'winner' : 'winners'}
        </p>
      </div>

      {/* Vault Balance */}
      <div className="min-w-0 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 sm:h-10 sm:w-10">
            <Wallet className="h-[18px] w-[18px]" />
          </div>
        </div>

        <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">
          Vault Balance
        </p>

        <p className="mt-1 break-words text-xl font-semibold leading-tight tracking-tight text-neutral-950 sm:text-[26px]">
          {formatCurrency(totalVault)}
        </p>

        <p className="mt-1 text-xs text-neutral-400">
          Across all members
        </p>
      </div>

      {/* Paid This Month */}
      <div className="min-w-0 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 sm:h-10 sm:w-10">
            <CreditCard className="h-[18px] w-[18px]" />
          </div>
        </div>

        <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">
          Paid This Month
        </p>

        <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-[28px]">
          {paidThisMonth}
        </p>

        <p className="mt-1 text-xs text-neutral-400">
          {pendingDisplay} pending
        </p>
      </div>

      {/* Total Winners */}
      <div className="min-w-0 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 sm:h-10 sm:w-10">
            <Trophy className="h-[18px] w-[18px]" />
          </div>
        </div>

        <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">
          Total Winners
        </p>

        <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-[28px]">
          {totalWinners}
        </p>

        <p className="mt-1 text-xs text-neutral-400">
          All-time auto-draws
        </p>
      </div>
    </section>

    {/* ── Pending Payments ───────────────────────────────────────────────── */}
    {pendingDisplay > 0 && (
      <div className="flex items-start gap-3 rounded-2xl border border-warning-200/80 bg-warning-50/70 px-4 py-3.5 sm:items-center sm:px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
          <AlertTriangle className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-warning-800">
            {pendingDisplay} payment{pendingDisplay !== 1 ? 's' : ''} pending
          </p>
          <p className="mt-0.5 text-xs leading-5 text-warning-700/80">
            Pending payments affect eligibility for this month's auto-draw.
          </p>
        </div>

        <Link
          to="/franchise/payments"
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-warning-800 transition-colors hover:bg-warning-100"
        >
          View
        </Link>
      </div>
    )}

    {/* ── Analytics + Members ────────────────────────────────────────────── */}
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

      {/* Payment Collections */}
      <Card className="overflow-hidden">
        <CardHeader className="px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
          <div>
            <CardTitle className="text-base sm:text-lg">
              Payment Collections
            </CardTitle>
            <p className="mt-1 text-xs text-neutral-400">
              Last 6 months
            </p>
          </div>
        </CardHeader>

        <div className="px-2 pb-5 sm:px-4 sm:pb-6">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
              barCategoryGap="22%"
            >
              <CartesianGrid
                strokeDasharray="3 4"
                stroke="#eef0f3"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fill: '#737373',
                }}
                interval={0}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fill: '#737373',
                }}
                width={34}
              />

              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                  fontSize: 12,
                }}
              />

              <Bar
                dataKey="paid"
                name="Paid"
                fill="#22c55e"
                radius={[5, 5, 0, 0]}
                stackId="a"
              />

              <Bar
                dataKey="pending"
                name="Pending"
                fill="#f59e0b"
                radius={[5, 5, 0, 0]}
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-center gap-5 pt-1">
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Paid
            </span>

            <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Pending
            </span>
          </div>
        </div>
      </Card>

      {/* Recent Members */}
      <Card padding="none" className="overflow-hidden">
        <CardHeader className="px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg">
                Recent Members
              </CardTitle>
              <p className="mt-1 text-xs text-neutral-400">
                Latest members in your franchise
              </p>
            </div>

            <Link
              to="/franchise/users"
              className="shrink-0 text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              View all
            </Link>
          </div>
        </CardHeader>

        <div className="divide-y divide-neutral-100 border-t border-neutral-100">
          {ruLoading && members.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 sm:px-6 animate-pulse">
                <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-200" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3 w-1/2 rounded bg-neutral-200" />
                  <div className="h-2.5 w-1/3 rounded bg-neutral-200" />
                </div>
              </div>
            ))
          ) : members.map((u) => (
            <div
              key={u.id}
              className="flex min-w-0 items-center gap-3 px-5 py-3.5 sm:px-6"
            >
              {/* Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 ring-1 ring-brand-100">
                {u.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>

              {/* Member info */}
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium leading-5 text-neutral-900">
                  {u.name}
                </p>

                <p className="mt-0.5 text-xs text-neutral-400">
                  Joined {formatDate(u.joinedAt)}
                </p>
              </div>

              {/* Status */}
              <div className="shrink-0">
                <UserStatusBadge status={u.status} />
              </div>
            </div>
          ))}

          {!ruLoading && members.length === 0 && (
            <EmptyState
              title="No members yet"
              className="py-10"
            />
          )}
        </div>
      </Card>
    </div>
  </div>
);
}
