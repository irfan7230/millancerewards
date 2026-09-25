// =============================================================================
// AdminReports — Responsive premium platform analytics
// UI/UX only — existing data flow and business logic preserved
// =============================================================================

import React from 'react';

import {
  BarChart3,
  Banknote,
  Trophy,
  Percent,
  TrendingUp,
  Building2,
  Users,
  Wallet,
} from 'lucide-react';

import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

import { ErrorState, PageLoader } from '@/components/ui/States';

import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/reports.service';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { formatCurrency } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

// =============================================================================
// Premium responsive stat card
// =============================================================================

interface ReportStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accentClassName?: string;
}

function ReportStatCard({
  title,
  value,
  icon,
  accentClassName = 'bg-brand-50 text-brand-600 ring-brand-100',
}: ReportStatCardProps) {
  return (
    <article
      className="
        group relative min-w-0 overflow-hidden
        rounded-2xl border border-neutral-200/80
        bg-white
        p-5 sm:p-6
        shadow-[0_2px_10px_rgba(15,23,42,0.04)]
        transition-all duration-200
        hover:-translate-y-0.5
        hover:shadow-[0_10px_30px_rgba(15,23,42,0.07)]
      "
      aria-label={`${title}: ${value}`}
    >
      {/* Soft decorative background */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute
          -right-10 -top-10
          h-28 w-28 rounded-full
          bg-brand-50/50 blur-2xl
        "
      />

      <div className="relative flex min-w-0 flex-col">
        {/* Icon + title */}
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-5 text-neutral-500 sm:text-[15px]">
              {title}
            </p>
          </div>

          <div
            className={`
              flex h-11 w-11 shrink-0 items-center justify-center
              rounded-xl ring-1
              transition-transform duration-200
              group-hover:scale-105
              ${accentClassName}
            `}
            aria-hidden="true"
          >
            {icon}
          </div>
        </div>

        {/* Value */}
        <div className="mt-5 min-w-0">
          <p
            className="
              min-w-0
              text-[clamp(1.9rem,7vw,2.5rem)]
              font-bold
              leading-[1.05]
              tracking-[-0.045em]
              text-neutral-950
              [overflow-wrap:anywhere]
            "
          >
            {value}
          </p>
        </div>
      </div>
    </article>
  );
}

// =============================================================================
// Chart card wrapper
// =============================================================================

interface ChartSectionProps {
  title: string;
  children: React.ReactNode;
}

function ChartSection({ title, children }: ChartSectionProps) {
  return (
    <Card className="min-w-0 overflow-hidden rounded-2xl border-neutral-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
      <CardHeader className="px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
        <CardTitle className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
          {title}
        </CardTitle>
      </CardHeader>

      <div className="min-w-0 px-3 pb-5 sm:px-5 sm:pb-6">
        {children}
      </div>
    </Card>
  );
}

// =============================================================================
// Admin Reports
// =============================================================================

export default function AdminReports() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: reportsService.getDashboard,
    refetchInterval: 30_000,
    retry: 2,
  });
  const { data: perfRows, isLoading: perfLoading } = useQuery({
    queryKey: ['reports', 'franchisePerformance'],
    queryFn: reportsService.getFranchisePerformance,
    refetchInterval: 30_000,
  });

  const loading = statsLoading || perfLoading;
  const error = statsError;

  if (loading) {
    return <PageLoader label="Building reports…" />;
  }

  if (error || !stats) {
    return <ErrorState description={error?.message ?? 'No data'} />;
  }

  const totalRevenue = stats.totalRevenue ?? 0;
  const totalVaultBalance = stats.totalVaultBalance ?? 0;
  const totalWinners = stats.totalWinners ?? 0;
  const paymentRate = (stats.paymentRate as number) ?? 0;

  const barData = (perfRows ?? []).map(row => ({
    name: row.franchiseName.split(' ')[0],
    members: row.totalMembers,
    plans: row.totalPlans,
  }));

  return (
    <div className="w-full min-w-0 space-y-6 pb-8 sm:space-y-7">
      {/* ================================================================== */}
      {/* Page heading                                                        */}
      {/* ================================================================== */}

      <header className="min-w-0">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h1
              className="
                text-[clamp(1.75rem,6vw,2.25rem)]
                font-bold
                leading-tight
                tracking-[-0.035em]
                text-neutral-950
              "
            >
              Platform Reports
            </h1>

            <p className="mt-1 text-sm leading-6 text-neutral-500 sm:text-base">
              Cross-tenant analytics
            </p>
          </div>
        </div>
      </header>

      {/* ================================================================== */}
      {/* Summary statistics                                                  */}
      {/* Mobile: 1 column                                                   */}
      {/* Tablet: 2 columns                                                  */}
      {/* Desktop: 4 columns                                                 */}
      {/* ================================================================== */}

      <section
        aria-label="Platform summary"
        className="
          grid min-w-0
          grid-cols-1
          gap-3
          sm:grid-cols-2 sm:gap-4
          xl:grid-cols-4
        "
      >
        <ReportStatCard
          title="Collected"
          value={formatCurrency(totalRevenue)}
          icon={<BarChart3 className="h-5 w-5" strokeWidth={2} />}
          accentClassName="bg-blue-50 text-blue-600 ring-blue-100"
        />

        <ReportStatCard
          title="Vault Balance"
          value={formatCurrency(totalVaultBalance)}
          icon={<Banknote className="h-5 w-5" strokeWidth={2} />}
          accentClassName="bg-emerald-50 text-emerald-600 ring-emerald-100"
        />

        <ReportStatCard
          title="Total Winners"
          value={totalWinners}
          icon={<Trophy className="h-5 w-5" strokeWidth={2} />}
          accentClassName="bg-amber-50 text-amber-600 ring-amber-100"
        />

        <ReportStatCard
          title="Payment Rate"
          value={`${paymentRate}%`}
          icon={<Percent className="h-5 w-5" strokeWidth={2} />}
          accentClassName="bg-violet-50 text-violet-600 ring-violet-100"
        />
      </section>

      {/* ================================================================== */}
      {/* Analytics sections                                                  */}
      {/* Mobile: 1 column                                                   */}
      {/* Desktop: 2 columns                                                 */}
      {/* ================================================================== */}

      <section
        aria-label="Platform analytics"
        className="
          grid min-w-0
          grid-cols-1
          gap-5
          lg:grid-cols-2 lg:gap-6
        "
      >
        {/* ================================================================ */}
        {/* Members & Plans Bar Chart                                         */}
        {/* ================================================================ */}

        <ChartSection title="Members & Plans by Franchise">
          <div
            className="h-[280px] w-full min-w-0 sm:h-[320px]"
            role="img"
            aria-label="Bar chart showing members and plans by franchise"
          >
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{
                    top: 12,
                    right: 8,
                    bottom: 18,
                    left: -8,
                  }}
                  barGap={6}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 11,
                      fill: '#64748b',
                    }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    interval={0}
                    angle={barData.length > 4 ? -25 : 0}
                    textAnchor={barData.length > 4 ? 'end' : 'middle'}
                  />

                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: '#64748b',
                    }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />

                  <Tooltip
                    cursor={{ fill: 'rgba(99,102,241,0.04)' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                      fontSize: 12,
                    }}
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: 12,
                      paddingTop: 8,
                    }}
                  />

                  <Bar
                    dataKey="members"
                    name="Members"
                    fill="#3b82f6"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={34}
                  />

                  <Bar
                    dataKey="plans"
                    name="Plans"
                    fill="#8b5cf6"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={34}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
                    <TrendingUp
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-3 text-sm font-medium text-neutral-700">
                    No franchise data
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Franchise performance data will appear here when available.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ChartSection>

        {/* ================================================================ */}
        {/* Franchise Performance Table                                       */}
        {/* ================================================================ */}

        <ChartSection title="Franchise Performance">
          <div className="min-w-0" role="region" aria-label="Franchise performance table">
            {(perfRows ?? []).length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-neutral-200">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500"
                      >
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          Franchise
                        </span>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500"
                      >
                        <span className="flex items-center justify-end gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          Members
                        </span>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500"
                      >
                        <span className="flex items-center justify-end gap-1.5">
                          <Trophy className="h-3.5 w-3.5" />
                          Plans
                        </span>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500"
                      >
                        <span className="flex items-center justify-end gap-1.5">
                          <Wallet className="h-3.5 w-3.5" />
                          Revenue
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {(perfRows ?? []).map((row) => (
                      <tr
                        key={row.franchiseId}
                        className="hover:bg-neutral-50/60 transition-colors"
                      >
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-brand-100 to-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-700 text-xs font-bold shadow-sm">
                              {row.franchiseName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-neutral-900 truncate max-w-[180px]">
                                {row.franchiseName}
                              </p>
                              <p className="text-xs text-neutral-500 font-mono">
                                #{row.franchiseId.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <span className="text-sm font-semibold text-neutral-900">
                            {row.totalMembers.toLocaleString()}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <span className="text-sm font-medium text-neutral-700">
                            {row.totalPlans.toLocaleString()}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <span className="text-sm font-bold text-emerald-600">
                            {formatCurrency(row.totalRevenue)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-[280px] sm:h-[320px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
                    <Building2
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-3 text-sm font-medium text-neutral-700">
                    No performance data
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Franchise performance data will appear here when available.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ChartSection>
      </section>
    </div>
  );
}
