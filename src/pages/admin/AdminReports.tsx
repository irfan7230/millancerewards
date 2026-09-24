// =============================================================================
// AdminReports — Responsive premium platform analytics
// UI/UX only — existing data flow and business logic preserved
// =============================================================================

import React, { useEffect, useState } from 'react';

import {
  BarChart3,
  Banknote,
  Trophy,
  Percent,
  TrendingUp,
} from 'lucide-react';

import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

import { ErrorState, PageLoader } from '@/components/ui/States';

import { franchiseService } from '@/services/franchise.service';
import { userService } from '@/services/user.service';
import { drawService } from '@/services/draw.service';
import { paymentService } from '@/services/payment.service';
import { vaultService } from '@/services/vault.service';
import type { Payment } from '@/types';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { formatCurrency } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface FranchiseStat {
  name: string;
  members: number;
  draws: number;
  paidPayments: number;
}

interface PaymentBreakdown {
  name: string;
  value: number;
  color: string;
}

interface ReportsData {
  fStats: FranchiseStat[];
  paymentBreakdown: PaymentBreakdown[];
  totalRevenue: number;
  totalVaultBalance: number;
  totalWinners: number;
  franchises: unknown[];
  users: unknown[];
  draws: unknown[];
  payments: Payment[];
}

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
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const [
          franchises,
          users,
          draws,
          payments,
          vaults,
        ] = await Promise.all([
          franchiseService.getFranchises(),
          userService.getAllUsers(),
          drawService.getAllDraws(),
          paymentService.getAllPayments(),
          vaultService.getAllVaults(),
        ]);

        // ---------------------------------------------------------------------
        // Build per-franchise stats
        // Existing business logic preserved
        // ---------------------------------------------------------------------

        const fStats = franchises.map((f) => ({
          name: f.name.split(' ')[0],
          members: users.filter((u) => u.franchiseId === f.id).length,
          draws: draws.filter(
            (d) => d.franchiseId === f.id && d.status === 'completed',
          ).length,
          paidPayments: payments.filter(
            (p) => p.franchiseId === f.id && p.status === 'Paid',
          ).length,
        }));

        // ---------------------------------------------------------------------
        // Payment status breakdown
        // Existing business logic preserved
        // ---------------------------------------------------------------------

        const paymentBreakdown = [
          {
            name: 'Paid',
            value: payments.filter((p) => p.status === 'Paid').length,
            color: '#22c55e',
          },
          {
            name: 'Pending',
            value: payments.filter((p) => p.status === 'Pending').length,
            color: '#f59e0b',
          },
          {
            name: 'Failed',
            value: payments.filter((p) => p.status === 'Failed').length,
            color: '#ef4444',
          },
          {
            name: 'Skipped',
            value: payments.filter((p) => p.status === 'Skipped').length,
            color: '#9ca3af',
          },
        ].filter((d) => d.value > 0);

        const totalRevenue = payments
          .filter((p) => p.status === 'Paid')
          .reduce((s, p) => s + p.amount, 0);

        const totalVaultBalance = vaults.reduce(
          (s, v) => s + v.balance,
          0,
        );

        const totalWinners = draws.flatMap((d) => d.winners).length;

        setData({
          fStats,
          paymentBreakdown,
          totalRevenue,
          totalVaultBalance,
          totalWinners,
          franchises,
          users,
          draws,
          payments,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <PageLoader label="Building reports…" />;
  }

  if (error || !data) {
    return <ErrorState description={error ?? 'No data'} />;
  }

  const {
    fStats,
    paymentBreakdown,
    totalRevenue,
    totalVaultBalance,
    totalWinners,
    payments,
  } = data;

  const paymentRate = Math.round(
    (payments.filter((p: Payment) => p.status === 'Paid').length /
      Math.max(1, payments.length)) *
      100,
  );

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
      {/* Analytics charts                                                    */}
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
        {/* Members & Draws                                                  */}
        {/* ================================================================ */}

        <ChartSection title="Members & Draws by Franchise">
          <div
            className="h-[280px] w-full min-w-0 sm:h-[320px]"
            role="img"
            aria-label="Bar chart showing members and completed draws by franchise"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fStats}
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
                  angle={fStats.length > 4 ? -25 : 0}
                  textAnchor={fStats.length > 4 ? 'end' : 'middle'}
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
                  dataKey="draws"
                  name="Draws"
                  fill="#8b5cf6"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={34}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartSection>

        {/* ================================================================ */}
        {/* Payment Distribution                                             */}
        {/* ================================================================ */}

        <ChartSection title="Payment Status Distribution">
          <div
            className="h-[280px] w-full min-w-0 sm:h-[320px]"
            role="img"
            aria-label="Pie chart showing payment status distribution"
          >
            {paymentBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="43%"
                    outerRadius="58%"
                    innerRadius="28%"
                    paddingAngle={2}
                    label={({ name, percent }: any) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {paymentBreakdown.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                      fontSize: 12,
                    }}
                  />

                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{
                      fontSize: 12,
                    }}
                  />
                </PieChart>
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
                    No payment data
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Payment status data will appear here when available.
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