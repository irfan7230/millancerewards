// =============================================================================
// FranchiseLayout — responsive Franchise portal shell.
// Desktop (lg+): fixed sidebar. Tablet/mobile: slide-in drawer + top bar.
// Lucky Draw removed — draws are auto-processed by the system.
// =============================================================================
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Layers, FileText, CreditCard,
  Gift, Wallet, BarChart3, LogOut, Menu, X, ChevronDown, FlaskConical, ScanLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useDemoClockStore } from '@/stores/demoClockStore';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { resetDemoData } from '@/services/bootstrap.service';

// Navigation grouped for clearer IA. (No Lucky Draw — auto-processed.)
const NAV_GROUPS: { heading: string; items: { to: string; label: string; icon: React.ElementType }[] }[] = [
  {
    heading: 'Overview',
    items: [
      { to: '/franchise/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/franchise/reports',   label: 'Reports',   icon: BarChart3 },
    ],
  },
  {
    heading: 'Manage',
    items: [
      { to: '/franchise/users',  label: 'Members', icon: Users },
      { to: '/franchise/groups', label: 'Groups',  icon: Layers },
      { to: '/franchise/plans',  label: 'Plans',   icon: FileText },
    ],
  },
  {
    heading: 'Finance & Rewards',
    items: [
      { to: '/franchise/payments', label: 'Payments', icon: CreditCard },
      { to: '/franchise/redeem',   label: 'Redeem',   icon: ScanLine },
      { to: '/franchise/vault',    label: 'Vaults',   icon: Wallet },
      { to: '/franchise/prizes',   label: 'Prizes',   icon: Gift },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);

export function FranchiseLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { clock, advancing, advanceMonth } = useDemoClockStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeLabel = ALL_ITEMS.find(i => location.pathname.startsWith(i.to))?.label ?? 'Dashboard';
  const initial = user?.name?.[0]?.toUpperCase() ?? 'F';

  // Shared nav-link renderer for both desktop sidebar and mobile drawer.
  const renderNav = (onNavigate?: () => void) => (
    <nav className="flex-1 py-4 overflow-y-auto" aria-label="Franchise navigation">
      {NAV_GROUPS.map(group => (
        <div key={group.heading} className="mb-4">
          <p className="px-5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{group.heading}</p>
          {group.items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-0.5',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );

  const userFooter = (
    <div className="border-t border-neutral-100 p-3">
      <div className="flex items-center gap-3 mb-2 px-2 py-2 rounded-xl bg-neutral-50">
        <div className="h-9 w-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-neutral-800 truncate">{user?.name}</p>
          <p className="text-[11px] text-neutral-400 truncate">{user?.email}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 rounded-xl transition-colors"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 lg:flex">
      {/* ── Desktop sidebar (lg+) ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 flex-col w-64 border-r border-neutral-200 bg-white z-40">
        <div className="flex items-center h-16 px-5 border-b border-neutral-100">
          <img src="/images/stitch/logo.png" alt="Millance" className="h-8 w-auto object-contain object-left" />
          <span className="ml-2 text-xs font-semibold text-neutral-400 border-l border-neutral-200 pl-2">Franchise</span>
        </div>
        {renderNav()}
        {userFooter}
      </aside>

      {/* ── Mobile / tablet drawer ────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm animate-ld-fade" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-72 max-w-[80vw] bg-white flex flex-col z-10 shadow-2xl">
            <div className="flex items-center justify-between h-16 px-5 border-b border-neutral-100">
              <img src="/images/stitch/logo.png" alt="Millance" className="h-8 w-auto object-contain object-left" />
              <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="p-2 -mr-2 rounded-lg hover:bg-neutral-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNav(() => setMobileOpen(false))}
            {userFooter}
          </aside>
        </div>
      )}

      {/* ── Content column ────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-neutral-200 bg-white/90 backdrop-blur-md flex items-center gap-3 px-4 sm:px-6">
          <button
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-base font-bold text-neutral-900 truncate">{activeLabel}</h2>
            <p className="hidden sm:block text-xs text-neutral-400">
              Simulated period: <span className="font-semibold text-brand-600">{clock.currentPeriodLabel}</span>
            </p>
          </div>

          <div className="flex-1" />

          {/* Demo controls — visually distinct (simulation only) */}
          <div className="relative">
            <button
              onClick={() => setDemoOpen(!demoOpen)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-warning-100 border border-warning-300 text-warning-700 text-xs font-semibold hover:bg-warning-200 transition-colors"
              aria-label="Demo controls"
              aria-expanded={demoOpen}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Demo</span>
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', demoOpen && 'rotate-180')} />
            </button>
            {demoOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDemoOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-warning-200 rounded-xl shadow-xl p-3 z-50">
                  <p className="text-xs text-warning-700 font-bold mb-1">⚠️ Simulation Controls</p>
                  <p className="text-[11px] text-neutral-500 mb-3">Demo tools only — not production actions.</p>
                  <Button
                    variant="secondary" size="sm" className="w-full mb-2 text-xs"
                    loading={advancing}
                    onClick={async () => { await advanceMonth(); setDemoOpen(false); }}
                  >
                    Advance Month
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="w-full text-xs text-danger-600 hover:bg-danger-50"
                    onClick={() => { if (window.confirm('Reset all demo data? This will reload the page.')) resetDemoData(); }}
                  >
                    Reset Demo Data
                  </Button>
                </div>
              </>
            )}
          </div>

          <NotificationBell
            audience="franchise"
            franchiseId={user?.franchiseId}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600"
          />
          <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initial}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
