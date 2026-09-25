// =============================================================================
// Admin Dashboard — cross-tenant overview
// =============================================================================
import { Link } from 'react-router-dom';
import { Building2, Users, Wallet, Trophy, AlertCircle, Sparkles, Activity, Globe } from 'lucide-react';
import { StatCard, CardHeader, CardTitle, MotionCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/reports.service';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
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
  const { data: recentDraws, isLoading: drawsLoading } = useQuery({
    queryKey: ['reports', 'recentDraws', 5],
    queryFn: () => reportsService.getRecentDraws(5),
    refetchInterval: 30_000,
  });

  const loading = statsLoading || perfLoading || drawsLoading;
  const error = statsError;
  const load = () => { void refetchStats(); };

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState description={error.message ?? 'Failed to load dashboard'} onRetry={load} />;

  const totalFranchises = stats?.totalFranchises ?? 0;
  const activeFranchises = totalFranchises - (stats?.suspendedFranchises ?? 0);
  const totalUsers = stats?.totalUsers ?? 0;
  const activeMembers = stats?.activeMembers ?? 0;
  const totalVaultBalance = stats?.totalVaultBalance ?? 0;
  const totalWinners = stats?.totalWinners ?? 0;
  const completedDraws = stats?.completedDraws ?? 0;
  const suspendedFranchises = stats?.suspendedFranchises ?? 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-brand-600 mb-1"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Super Admin Portal</span>
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Platform Overview</h1>
          <p className="text-sm text-neutral-500 mt-1">Cross-tenant insights and aggregated metrics.</p>
        </div>

        {suspendedFranchises > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-danger-200 bg-danger-50 shadow-sm"
          >
            <div className="h-8 w-8 rounded-lg bg-danger-100 flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4 text-danger-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-danger-800">
                {suspendedFranchises} suspended franchise{suspendedFranchises > 1 ? 's' : ''}
              </p>
              <Link to="/admin/franchises" className="text-xs font-medium text-danger-600 hover:text-danger-700 hover:underline">
                Review accounts →
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Franchises"
          value={totalFranchises}
          description={`${activeFranchises} active, ${suspendedFranchises} suspended`}
          icon={<Building2 className="h-5 w-5" />}
          accent="brand"
          className="stagger-1 animate-slide-in"
        />
        <StatCard
          title="Total Members"
          value={totalUsers}
          description={`${activeMembers} active participants`}
          icon={<Users className="h-5 w-5" />}
          accent="info"
          className="stagger-2 animate-slide-in"
        />
        <StatCard
          title="Platform TVL"
          value={formatCurrency(totalVaultBalance)}
          description="Total value locked across all vaults"
          icon={<Wallet className="h-5 w-5" />}
          accent="success"
          className="stagger-3 animate-slide-in"
          trend={{ value: 12.4, label: 'this month' }}
        />
        <StatCard
          title="Total Winners"
          value={totalWinners}
          description={`From ${completedDraws} completed draws`}
          icon={<Trophy className="h-5 w-5" />}
          accent="accent"
          className="stagger-4 animate-slide-in"
        />
      </div>

      {/* CMS Quick Access */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Content Management</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Edit Landing Page content, promo banners, prize lineup, and broadcast notices to User &amp; Franchise portals.</p>
          </div>
        </div>
        <Link
          to="/admin/content"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors shrink-0"
        >
          <Globe className="h-4 w-4" /> Open CMS
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Franchises */}
        <MotionCard
          hover
          padding="none"
          className="flex flex-col animate-slide-in stagger-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CardHeader className="px-6 pt-6 pb-4 border-b border-neutral-100 flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-500" />
              <CardTitle>Top Franchises</CardTitle>
            </div>
            <Link to="/admin/franchises" className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">View All</Link>
          </CardHeader>
          <div className="divide-y divide-neutral-100/60 flex-1">
            {(perfRows ?? []).slice(0, 5).map(row => (
              <div key={row.franchiseId} className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50/50 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 border border-neutral-200/60 flex items-center justify-center text-neutral-600 font-bold shadow-sm shrink-0">
                  {row.franchiseName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{row.franchiseName}</p>
                    <Badge variant="success" dot>
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {row.totalMembers}</span>
                    <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> {row.totalPlans} plans</span>
                    <span className="truncate">{formatCurrency(row.totalRevenue)}</span>
                  </div>
                </div>
              </div>
            ))}
            {(!perfRows || perfRows.length === 0) && (
              <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
                <Building2 className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No franchise data yet</p>
              </div>
            )}
          </div>
        </MotionCard>

        {/* Recent Draws */}
        <MotionCard
          hover
          padding="none"
          className="flex flex-col animate-slide-in stagger-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CardHeader className="px-6 pt-6 pb-4 border-b border-neutral-100 flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent-500" />
              <CardTitle>Recent Draws</CardTitle>
            </div>
            <Link to="/admin/draws" className="text-xs font-semibold text-accent-600 hover:text-accent-700 hover:underline">View Activity</Link>
          </CardHeader>
          <div className="divide-y divide-neutral-100/60 flex-1">
            {(recentDraws ?? []).map(draw => (
              <div key={draw.id} className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50/50 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center shrink-0">
                  <Trophy className="h-4 w-4 text-accent-600" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold text-neutral-900 truncate">
                      {draw.periodLabel}
                    </p>
                    <span className="text-xs font-medium text-success-600 bg-success-50 px-2 py-0.5 rounded border border-success-100">
                      Completed
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="font-medium text-neutral-700">{draw.franchiseName}</span>
                    <span>·</span>
                    <span>{draw.winnersCount} winners</span>
                  </div>
                </div>
              </div>
            ))}
            {(!recentDraws || recentDraws.length === 0) && (
              <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
                <Trophy className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No completed draws yet</p>
              </div>
            )}
          </div>
        </MotionCard>
      </div>
    </div>
  );
}
