// =============================================================================
// Admin Dashboard — cross-tenant overview
// =============================================================================
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Wallet, Trophy, AlertCircle, Sparkles, Activity } from 'lucide-react';
import { StatCard, CardHeader, CardTitle, MotionCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { franchiseService } from '@/services/franchise.service';
import { userService } from '@/services/user.service';
import { drawService } from '@/services/draw.service';
import { vaultService } from '@/services/vault.service';
import type { Franchise, FranchiseUser, Draw, Vault } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [users, setUsers] = useState<FranchiseUser[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [f, u, d, v] = await Promise.all([
        franchiseService.getFranchises(),
        userService.getAllUsers(),
        drawService.getAllDraws(),
        vaultService.getAllVaults(),
      ]);
      setFranchises(f);
      setUsers(u);
      setDraws(d);
      setVaults(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState description={error} onRetry={load} />;

  const totalVaultBalance = vaults.reduce((sum, v) => sum + v.balance, 0);
  const completedDraws = draws.filter(d => d.status === 'completed');
  const totalWinners = completedDraws.reduce((sum, d) => sum + d.winners.length, 0);
  const activeUsers = users.filter(u => !['INACTIVE', 'WINNER'].includes(u.status));
  const suspendedFranchises = franchises.filter(f => f.status === 'suspended');

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
        
        {suspendedFranchises.length > 0 && (
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
                {suspendedFranchises.length} suspended franchise{suspendedFranchises.length > 1 ? 's' : ''}
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
          value={franchises.length}
          description={`${franchises.filter(f => f.status === 'active').length} active, ${suspendedFranchises.length} suspended`}
          icon={<Building2 className="h-5 w-5" />}
          accent="brand"
          className="stagger-1 animate-slide-in"
        />
        <StatCard
          title="Total Members"
          value={users.length}
          description={`${activeUsers.length} active participants`}
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
          description={`From ${completedDraws.length} completed draws`}
          icon={<Trophy className="h-5 w-5" />}
          accent="accent"
          className="stagger-4 animate-slide-in"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Franchises */}
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
            {franchises.slice(0, 5).map(franchise => {
              const fUsers = users.filter(u => u.franchiseId === franchise.id);
              const fDraws = draws.filter(d => d.franchiseId === franchise.id && d.status === 'completed');
              return (
                <div key={franchise.id} className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50/50 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 border border-neutral-200/60 flex items-center justify-center text-neutral-600 font-bold shadow-sm shrink-0">
                    {franchise.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{franchise.name}</p>
                      <Badge variant={franchise.status === 'active' ? 'success' : 'danger'} dot>
                        {franchise.status === 'active' ? 'Active' : 'Suspended'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {fUsers.length}</span>
                      <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> {fDraws.length} draws</span>
                      <span className="truncate">📍 {franchise.city}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </MotionCard>

        {/* Recent Activity / Draws */}
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
            {draws.filter(d => d.status === 'completed').slice(-5).reverse().map(draw => {
              const franchise = franchises.find(f => f.id === draw.franchiseId);
              return (
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
                      <span className="font-medium text-neutral-700">{franchise?.name ?? 'Unknown Franchise'}</span>
                      <span>·</span>
                      <span>{draw.winners.length} winners</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {draws.filter(d => d.status === 'completed').length === 0 && (
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
