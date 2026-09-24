import { useEffect, useState } from 'react';
import {
  Users,
  Wallet,
  Trophy,
  IndianRupee,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { PageLoader, ErrorState } from '@/components/ui/States';
import { paymentService } from '@/services/payment.service';
import { userService } from '@/services/user.service';
import { vaultService } from '@/services/vault.service';
import { useAuthStore } from '@/stores/authStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

export default function FranchiseReports() {
  const { user } = useAuthStore();
  const franchiseId = user?.franchiseId ?? '';

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!franchiseId) return;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [users, payments, allVaults] = await Promise.all([
          userService.getFranchiseUsers(franchiseId),
          paymentService.getFranchisePayments(franchiseId),
          vaultService.getAllVaults(),
        ]);

        const userIds = new Set(users.map(u => u.id));
        const vaults = allVaults.filter(v => userIds.has(v.userId));

        const periodMap = new Map<
          string,
          { paid: number; pending: number; amount: number }
        >();

        for (const p of payments) {
          const entry = periodMap.get(p.periodLabel) ?? {
            paid: 0,
            pending: 0,
            amount: 0,
          };

          if (p.status === 'Paid') {
            entry.paid++;
            entry.amount += p.amount;
          } else if (p.status === 'Pending') {
            entry.pending++;
          }

          periodMap.set(p.periodLabel, entry);
        }

        const chartData = Array.from(periodMap.entries())
          .slice(-6)
          .map(([label, values]) => ({
            label: label.split(' ')[0].slice(0, 3),
            ...values,
          }));

        const totalRevenue = payments
          .filter(p => p.status === 'Paid')
          .reduce((sum, p) => sum + p.amount, 0);

        const totalVault = vaults.reduce(
          (sum, vault) => sum + vault.balance,
          0,
        );

        const winners = users.filter(u => u.hasWon).length;

        setData({
          users,
          payments,
          vaults,
          chartData,
          totalRevenue,
          totalVault,
          winners,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [franchiseId]);

  if (loading) {
    return <PageLoader label="Building reports…" />;
  }

  if (error || !data) {
    return <ErrorState description={error ?? 'No data'} />;
  }

  const {
    users,
    chartData,
    totalRevenue,
    totalVault,
    winners,
  } = data as any;

  const stats = [
    {
      label: 'Total Members',
      value: users.length.toLocaleString(),
      icon: Users,
      iconClass: 'text-brand-600 bg-brand-50 border-brand-100',
    },
    {
      label: 'Collections',
      value: formatCurrency(totalRevenue),
      icon: IndianRupee,
      iconClass: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Vault Balance',
      value: formatCurrency(totalVault),
      icon: Wallet,
      iconClass: 'text-violet-600 bg-violet-50 border-violet-100',
    },
    {
      label: 'Winners',
      value: winners.toLocaleString(),
      icon: Trophy,
      iconClass: 'text-amber-600 bg-amber-50 border-amber-100',
    },
  ];

  return (
    <div className="w-full space-y-5 sm:space-y-6">

      {/* Header */}
      <section className="px-0.5 sm:px-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-brand-600 sm:h-6 sm:w-6" />
          <h1 className="text-[25px] leading-tight font-semibold tracking-[-0.025em] text-neutral-950 sm:text-3xl">
            Reports
          </h1>
        </div>

        <p className="mt-1 text-sm leading-5 text-neutral-500 sm:text-[15px]">
          Franchise analytics dashboard
        </p>
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, iconClass }) => (
          <article
          key={label}
          className="
            min-w-0 rounded-2xl border border-neutral-200/80
            bg-white px-4 py-4
            shadow-[0_2px_10px_rgba(15,23,42,0.04)]
            sm:px-5 sm:py-5
          "
        >
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 pr-1 text-[12px] font-medium leading-[1.35] text-neutral-500 sm:text-sm">
              {label}
            </p>

            <div
              className={`
                flex h-8 w-8 shrink-0 items-center justify-center
                rounded-[10px] border
                sm:h-9 sm:w-9
                ${iconClass}
              `}
            >
              <Icon
                className="h-4 w-4 sm:h-[17px] sm:w-[17px]"
                strokeWidth={1.8}
              />
            </div>
          </div>

          <p
            className="
              mt-3 whitespace-nowrap
              text-[22px] font-semibold leading-none
              tracking-[-0.035em] text-neutral-950
              tabular-nums
              sm:mt-4 sm:text-[26px]
            "
          >
            {value}
          </p>
        </article>
        ))}
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">

        {/* Monthly collections */}
        <Card className="overflow-hidden" padding="none">
          <CardHeader className="px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <TrendingUp className="h-4 w-4" strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <CardTitle className="text-[17px] leading-5 sm:text-lg">
                  Monthly Collections
                </CardTitle>
                <p className="mt-0.5 text-xs text-neutral-400">
                  Paid collection value
                </p>
              </div>
            </div>
          </CardHeader>

          <div className="px-2 pb-4 pt-3 sm:px-4 sm:pb-5">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={chartData}
                margin={{
                  top: 8,
                  right: 8,
                  bottom: 4,
                  left: 2,
                }}
                barCategoryGap="24%"
              >
                <CartesianGrid
                  strokeDasharray="3 4"
                  stroke="#e5e7eb"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: '#64748b',
                  }}
                  dy={8}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={42}
                  tick={{
                    fontSize: 10,
                    fill: '#64748b',
                  }}
                  tickFormatter={value =>
                    value >= 1000
                      ? `₹${Math.round(value / 1000)}k`
                      : `₹${value}`
                  }
                />

                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  formatter={(value: any) => [
                    formatCurrency(Number(value)),
                    'Collected',
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                    fontSize: 12,
                  }}
                />

                <Bar
                  dataKey="amount"
                  name="Collected"
                  fill="#4f46e5"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={34}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Payment volume */}
        <Card className="overflow-hidden" padding="none">
          <CardHeader className="px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <BarChart3 className="h-4 w-4" strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <CardTitle className="text-[17px] leading-5 sm:text-lg">
                  Payment Volume
                </CardTitle>
                <p className="mt-0.5 text-xs text-neutral-400">
                  Paid vs pending payments
                </p>
              </div>
            </div>
          </CardHeader>

          <div className="px-2 pb-4 pt-3 sm:px-4 sm:pb-5">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={chartData}
                margin={{
                  top: 8,
                  right: 8,
                  bottom: 4,
                  left: 2,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 4"
                  stroke="#e5e7eb"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: '#64748b',
                  }}
                  dy={8}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  tick={{
                    fontSize: 10,
                    fill: '#64748b',
                  }}
                  allowDecimals={false}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                    fontSize: 12,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="paid"
                  name="Paid"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={{
                    r: 3,
                    fill: '#16a34a',
                    strokeWidth: 0,
                  }}
                  activeDot={{
                    r: 5,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="pending"
                  name="Pending"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={{
                    r: 3,
                    fill: '#d97706',
                    strokeWidth: 0,
                  }}
                  activeDot={{
                    r: 5,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Compact professional legend */}
            <div className="flex items-center justify-center gap-5 pt-1 text-xs text-neutral-500">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span>Paid</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-600" />
                <span>Pending</span>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}