// =============================================================================
// UserLayout — responsive member portal shell.
// Desktop (md+): fixed sidebar with grouped navigation + top bar.
// Mobile: compact top bar + bottom tab navigation.
// DESIGN-SYSTEM.md: user portal is mobile-first, but must scale up cleanly.
// =============================================================================
import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, CreditCard, Wallet, Trophy,
  QrCode, User, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useAuthStore } from '@/stores/authStore';

// Primary tabs (also shown in the mobile bottom bar)
const PRIMARY_NAV = [
  { to: '/user/dashboard',  label: 'Home',      icon: LayoutDashboard },
  { to: '/user/vault',      label: 'Vault',     icon: Wallet },
  { to: '/user/draws',      label: 'Draw',      icon: Trophy },
  { to: '/user/redeem',     label: 'Redeem',    icon: QrCode },
  { to: '/user/profile',    label: 'Profile',   icon: User },
];

// Secondary tabs (desktop sidebar only)
const SECONDARY_NAV = [
  { to: '/user/plan',       label: 'My Plan',   icon: FileText },
  { to: '/user/payments',   label: 'Payments',  icon: CreditCard },
];

const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export function UserLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeLabel =
    ALL_NAV.find((n) => location.pathname.startsWith(n.to))?.label ?? 'Home';

  const initial = user?.name?.[0]?.toUpperCase() ?? 'U';

  const sidebarLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
      isActive
        ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
        : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
    );

  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      {/* ── Desktop sidebar (md+) ─────────────────────────────────────────── */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 flex-col w-64 border-r border-neutral-200 bg-white z-40">
        {/* Brand */}
        <div className="flex items-center h-20 px-6 border-b border-neutral-100">
          <img
            src="/images/stitch/logo.png"
            alt="Millance"
            className="h-14 w-auto max-w-[190px] object-contain object-left"
          />
        </div>

        {/* Nav — grouped */}
        <nav className="flex-1 py-5 overflow-y-auto" aria-label="User navigation">
          <p className="px-6 mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Overview</p>
          {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={sidebarLink}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}

          <p className="px-6 mt-6 mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Manage</p>
          {SECONDARY_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={sidebarLink}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
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
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 rounded-xl transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Content column (offset by sidebar width on desktop) ───────────── */}
      {/* min-w-0 lets flex clamp the column so wide children (e.g. marquee
          tracks / tables) scroll internally instead of stretching the page. */}
      <div className="flex-1 min-w-0 md:pl-64 flex flex-col min-h-screen">
        {/* Desktop top bar */}
        <header className="hidden md:flex sticky top-0 z-30 items-center justify-between h-16 px-5 lg:px-6 bg-white/80 backdrop-blur-md border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">{activeLabel}</h2>
            <p className="text-xs text-neutral-400">Welcome back, {user?.name?.split(' ')[0]}</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell
              audience="user"
              userId={user?.id}
              franchiseId={user?.franchiseId}
              className="p-2.5 rounded-xl hover:bg-neutral-100 transition-colors text-neutral-600"
            />
            <div className="h-10 w-10 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold">
              {initial}
            </div>
          </div>
        </header>

        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-3 bg-white/90 backdrop-blur-md border-b border-neutral-200">
          <img
            src="/images/stitch/logo.png"
            alt="Millance"
            className="h-10 w-auto max-w-[150px] object-contain object-left"
          />

          <div className="flex items-center gap-3">
            <NotificationBell
              audience="user"
              userId={user?.id}
              franchiseId={user?.franchiseId}
              className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 active:bg-neutral-200"
            />

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {initial}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-hidden px-4 py-5 sm:px-6 md:px-8 md:py-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom navigation ──────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-neutral-200 flex items-center px-1 pb-[env(safe-area-inset-bottom)]"
        aria-label="Bottom navigation"
      >
        {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors',
                isActive ? 'text-brand-600' : 'text-neutral-400 hover:text-neutral-600',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-px h-0.5 w-8 rounded-full bg-brand-600" aria-hidden="true" />
                )}
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-[11px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
