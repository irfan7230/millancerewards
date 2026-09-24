// =============================================================================
// AdminLayout — Premium dark sidebar shell with smooth animations
// =============================================================================

import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Users,
  Layers,
  FileText,
  CreditCard,
  Trophy,
  Gift,
  Wallet,
  BarChart3,
  Settings,
  Globe,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { NotificationBell } from '@/components/ui/NotificationBell';

const NAV_ITEMS = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    group: 'Overview',
  },
  {
    to: '/admin/franchises',
    label: 'Franchises',
    icon: Building2,
    group: 'Management',
  },
  {
    to: '/admin/users',
    label: 'Users',
    icon: Users,
    group: 'Management',
  },
  {
    to: '/admin/groups',
    label: 'Groups',
    icon: Layers,
    group: 'Management',
  },
  {
    to: '/admin/plans',
    label: 'Plans',
    icon: FileText,
    group: 'Management',
  },
  {
    to: '/admin/payments',
    label: 'Payments',
    icon: CreditCard,
    group: 'Finance',
  },
  {
    to: '/admin/draws',
    label: 'Draws',
    icon: Trophy,
    group: 'Finance',
  },
  {
    to: '/admin/prizes',
    label: 'Prizes',
    icon: Gift,
    group: 'Finance',
  },
  {
    to: '/admin/vaults',
    label: 'Vaults',
    icon: Wallet,
    group: 'Finance',
  },
  {
    to: '/admin/content',
    label: 'Content',
    icon: Globe,
    group: 'CMS',
  },
  {
    to: '/admin/reports',
    label: 'Reports',
    icon: BarChart3,
    group: 'Analytics',
  },
  {
    to: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    group: 'System',
  },
];

const GROUP_ORDER = [
  'Overview',
  'Management',
  'Finance',
  'CMS',
  'Analytics',
  'System',
];

export function AdminLayout() {
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: NAV_ITEMS.filter((item) => item.group === group),
  }));

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex h-full min-h-0 flex-col">
      {/* ------------------------------------------------------------------ */}
      {/* Logo                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center gap-3 border-b border-neutral-800 px-5',
          collapsed && 'justify-center px-0',
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow-brand">
          <Sparkles
            className="h-4 w-4 text-white"
            aria-hidden="true"
          />
        </div>

        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            <span className="text-sm font-bold tracking-tight text-white">
              Millance
            </span>

            <span className="block text-xs font-normal text-neutral-500">
              Admin Portal
            </span>
          </motion.div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Navigation                                                         */}
      {/* ------------------------------------------------------------------ */}
      <nav
        className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-2 py-4"
        aria-label="Admin navigation"
      >
        {grouped.map(({ group, items }) => (
          <div key={group} className="mb-5">
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-600 select-none">
                {group}
              </p>
            )}

            {items.map(({ to, label, icon: Icon }, idx) => (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                onClick={() => {
                  // Close the mobile drawer after navigation.
                  setMobileOpen(false);
                }}
                className={({ isActive }) =>
                  cn(
                    'group relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                    'cursor-pointer transition-all duration-150',
                    isActive
                      ? 'nav-active-indicator bg-brand-600/20 text-white'
                      : 'text-white hover:bg-neutral-800 hover:text-white',
                    collapsed && 'justify-center',
                    `animate-slide-in stagger-${Math.min(idx + 1, 4)}`,
                  )
                }
              >
                <Icon
                  className="h-[18px] w-[18px] shrink-0 text-white transition-transform duration-150 group-hover:scale-110"
                  aria-hidden="true"
                />

                {!collapsed && (
                  <span className="truncate text-white">
                    {label}
                  </span>
                )}

                {!collapsed && (
                  <span
                    className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* User footer                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="shrink-0 border-t border-neutral-800 p-3">
        {!collapsed && (
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-neutral-200">
                {user?.name}
              </p>

              <p className="truncate text-[11px] text-neutral-500">
                {user?.email}
              </p>
            </div>
          </div>
        )}

        <div
          className={cn(
            'flex gap-1',
            collapsed && 'flex-col items-center',
          )}
        >
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
              'text-neutral-400 hover:bg-danger-500/10 hover:text-danger-400',
              'cursor-pointer transition-all duration-150',
              collapsed
                ? 'h-10 w-10 justify-center'
                : 'flex-1',
            )}
            title="Sign out"
          >
            <LogOut
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            />

            {!collapsed && 'Sign out'}
          </button>

          <button
            type="button"
            className={cn(
              'flex items-center justify-center rounded-lg px-3 py-2 text-xs',
              'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200',
              'cursor-pointer transition-all duration-150',
              collapsed ? 'h-10 w-10' : 'w-10',
            )}
            onClick={() =>
              setSidebarCollapsed(!sidebarCollapsed)
            }
            aria-label={
              sidebarCollapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
          >
            {sidebarCollapsed ? (
              <ChevronRight
                className="h-4 w-4"
                aria-hidden="true"
              />
            ) : (
              <ChevronLeft
                className="h-4 w-4"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="flex h-screen min-h-0 overflow-hidden"
      style={{
        background: 'var(--color-neutral-50)',
      }}
    >
      {/* ================================================================== */}
      {/* Desktop Sidebar                                                    */}
      {/* ================================================================== */}
      <motion.aside
        animate={{
          width: sidebarCollapsed ? 64 : 224,
        }}
        transition={{
          duration: 0.22,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="relative z-20 hidden shrink-0 flex-col overflow-hidden md:flex"
        style={{
          background: 'var(--color-sidebar-bg)',
          borderRight: '1px solid var(--color-sidebar-border)',
        }}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </motion.aside>

      {/* ================================================================== */}
      {/* Mobile Sidebar + Overlay                                           */}
      {/* ================================================================== */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay must stay BELOW the sidebar but ABOVE page content. */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[900] bg-neutral-950/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Sidebar owns the highest mobile stacking layer. */}
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{
                type: 'spring',
                damping: 28,
                stiffness: 300,
              }}
              className="fixed inset-y-0 left-0 z-[1000] flex w-56 flex-col overflow-hidden md:hidden"
              style={{
                background: 'var(--color-sidebar-bg)',
                borderRight:
                  '1px solid var(--color-sidebar-border)',
              }}
            >
              <button
                type="button"
                className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
              >
                <X
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </button>

              <SidebarContent collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ================================================================== */}
      {/* Main Content                                                        */}
      {/* ================================================================== */}
      <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
        {/* ------------------------------------------------------------------ */}
        {/* Top Bar                                                            */}
        {/* IMPORTANT: header stays BELOW the mobile sidebar.                 */}
        {/* ------------------------------------------------------------------ */}
        <header
          className="
            relative
            z-10
            flex
            h-16
            shrink-0
            items-center
            justify-between
            px-4
            md:px-6
          "
          style={{
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom:
              '1px solid var(--color-neutral-200)',
          }}
        >
          <button
            type="button"
            className="rounded-lg p-2 -ml-2 text-neutral-600 hover:bg-neutral-100 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu
              className="h-5 w-5"
              aria-hidden="true"
            />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* Notification trigger stays inside the normal header layer.
                The dropdown itself controls its own stacking context. */}
            <div className="relative shrink-0">
              <NotificationBell
                audience="super_admin"
                className="
                  p-2
                  rounded-lg
                  text-neutral-500
                  hover:text-neutral-700
                  hover:bg-neutral-100
                  transition-colors
                "
              />
            </div>

            <div className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white shadow-sm">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------------------ */}
        {/* Page Content                                                       */}
        {/* ------------------------------------------------------------------ */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="page-enter mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}