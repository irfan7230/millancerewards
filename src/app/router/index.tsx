// =============================================================================
// App Router — full route tree with lazy loading per portal
// ROUTING.md: all routes, lazy-loaded, with guards
// =============================================================================
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './guards';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { FranchiseLayout } from '@/layouts/FranchiseLayout';
import { UserLayout } from '@/layouts/UserLayout';
import { PageLoader } from '@/components/ui/States';
import { SkeletonDashboard, SkeletonUserHome } from '@/components/ui/Skeleton';

// ---------------------------------------------------------------------------
// Lazy route modules — code-split per portal
// ---------------------------------------------------------------------------

// Public
const LandingPage    = React.lazy(() => import('@/pages/public/LandingPage'));
const LoginPage      = React.lazy(() => import('@/pages/public/LoginPage'));

// Admin
const AdminDashboard    = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminFranchises   = React.lazy(() => import('@/pages/admin/AdminFranchises'));
const AdminFranchise    = React.lazy(() => import('@/pages/admin/AdminFranchise'));
const AdminUsers        = React.lazy(() => import('@/pages/admin/AdminUsers'));
const AdminGroups       = React.lazy(() => import('@/pages/admin/AdminGroups'));
const AdminPlans        = React.lazy(() => import('@/pages/admin/AdminPlans'));
const AdminPayments     = React.lazy(() => import('@/pages/admin/AdminPayments'));
const AdminDraws        = React.lazy(() => import('@/pages/admin/AdminDraws'));
const AdminPrizes       = React.lazy(() => import('@/pages/admin/AdminPrizes'));
const AdminVaults       = React.lazy(() => import('@/pages/admin/AdminVaults'));
const AdminReports      = React.lazy(() => import('@/pages/admin/AdminReports'));
const AdminSettings        = React.lazy(() => import('@/pages/admin/AdminSettings'));
const AdminContentManager  = React.lazy(() => import('@/pages/admin/AdminContentManager'));
const AdminCoupons         = React.lazy(() => import('@/pages/admin/AdminCoupons'));

// Franchise
const FranchiseDashboard = React.lazy(() => import('@/pages/franchise/FranchiseDashboard'));
const FranchiseUsers     = React.lazy(() => import('@/pages/franchise/FranchiseUsers'));
const FranchiseUser      = React.lazy(() => import('@/pages/franchise/FranchiseUser'));
const FranchiseGroups    = React.lazy(() => import('@/pages/franchise/FranchiseGroups'));
const FranchiseGroup     = React.lazy(() => import('@/pages/franchise/FranchiseGroup'));
const FranchisePlans     = React.lazy(() => import('@/pages/franchise/FranchisePlans'));
const FranchisePayments  = React.lazy(() => import('@/pages/franchise/FranchisePayments'));
const FranchiseRedeem    = React.lazy(() => import('@/pages/franchise/FranchiseRedeem'));
const FranchisePrizes    = React.lazy(() => import('@/pages/franchise/FranchisePrizes'));
const FranchiseVault     = React.lazy(() => import('@/pages/franchise/FranchiseVault'));
const FranchiseReports   = React.lazy(() => import('@/pages/franchise/FranchiseReports'));

// User
const UserDashboard  = React.lazy(() => import('@/pages/user/UserDashboard'));
const UserPlan       = React.lazy(() => import('@/pages/user/UserPlan'));
const UserPayments   = React.lazy(() => import('@/pages/user/UserPayments'));
const UserVault      = React.lazy(() => import('@/pages/user/UserVault'));
const UserDraws      = React.lazy(() => import('@/pages/user/UserDraws'));
const UserRedeem     = React.lazy(() => import('@/pages/user/UserRedeem'));
const UserProfile    = React.lazy(() => import('@/pages/user/UserProfile'));

// ---------------------------------------------------------------------------
// Route-level Suspense fallback
// ---------------------------------------------------------------------------

function RouteFallback() {
  return (
    <div className="p-6">
      <SkeletonDashboard />
    </div>
  );
}

// ---------------------------------------------------------------------------
// App Router
// ---------------------------------------------------------------------------

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route index element={<Suspense fallback={<PageLoader />}><LandingPage /></Suspense>} />
          </Route>
          
          <Route path="login" element={
            <GuestRoute>
              <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>
            </GuestRoute>
          } />

          {/* Super Admin portal */}
          <Route path="admin" element={
            <ProtectedRoute allow={['super_admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"       element={<Suspense fallback={<RouteFallback />}><AdminDashboard /></Suspense>} />
            <Route path="franchises"      element={<Suspense fallback={<RouteFallback />}><AdminFranchises /></Suspense>} />
            <Route path="franchises/:id"  element={<Suspense fallback={<RouteFallback />}><AdminFranchise /></Suspense>} />
            <Route path="users"           element={<Suspense fallback={<RouteFallback />}><AdminUsers /></Suspense>} />
            <Route path="groups"          element={<Suspense fallback={<RouteFallback />}><AdminGroups /></Suspense>} />
            <Route path="plans"           element={<Suspense fallback={<RouteFallback />}><AdminPlans /></Suspense>} />
            <Route path="payments"        element={<Suspense fallback={<RouteFallback />}><AdminPayments /></Suspense>} />
            <Route path="draws"           element={<Suspense fallback={<RouteFallback />}><AdminDraws /></Suspense>} />
            <Route path="prizes"          element={<Suspense fallback={<RouteFallback />}><AdminPrizes /></Suspense>} />
            <Route path="vaults"          element={<Suspense fallback={<RouteFallback />}><AdminVaults /></Suspense>} />
            <Route path="reports"         element={<Suspense fallback={<RouteFallback />}><AdminReports /></Suspense>} />
            <Route path="settings"        element={<Suspense fallback={<RouteFallback />}><AdminSettings /></Suspense>} />
            <Route path="content"         element={<Suspense fallback={<RouteFallback />}><AdminContentManager /></Suspense>} />
            <Route path="coupons"         element={<Suspense fallback={<RouteFallback />}><AdminCoupons /></Suspense>} />
          </Route>

          {/* Franchise portal */}
          <Route path="franchise" element={
            <ProtectedRoute allow={['franchise']}>
              <FranchiseLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"   element={<Suspense fallback={<RouteFallback />}><FranchiseDashboard /></Suspense>} />
            <Route path="users"       element={<Suspense fallback={<RouteFallback />}><FranchiseUsers /></Suspense>} />
            <Route path="users/:id"   element={<Suspense fallback={<RouteFallback />}><FranchiseUser /></Suspense>} />
            <Route path="groups"      element={<Suspense fallback={<RouteFallback />}><FranchiseGroups /></Suspense>} />
            <Route path="groups/:id"  element={<Suspense fallback={<RouteFallback />}><FranchiseGroup /></Suspense>} />
            <Route path="plans"       element={<Suspense fallback={<RouteFallback />}><FranchisePlans /></Suspense>} />
            <Route path="payments"    element={<Suspense fallback={<RouteFallback />}><FranchisePayments /></Suspense>} />
            <Route path="redeem"      element={<Suspense fallback={<RouteFallback />}><FranchiseRedeem /></Suspense>} />
            {/* Lucky Draw removed from Franchise portal — draws are auto-processed by the system */}
            <Route path="draws"       element={<Navigate to="../dashboard" replace />} />
            <Route path="draws/:id"   element={<Navigate to="../dashboard" replace />} />
            <Route path="prizes"      element={<Suspense fallback={<RouteFallback />}><FranchisePrizes /></Suspense>} />
            <Route path="vault"       element={<Suspense fallback={<RouteFallback />}><FranchiseVault /></Suspense>} />
            <Route path="reports"     element={<Suspense fallback={<RouteFallback />}><FranchiseReports /></Suspense>} />
          </Route>

          {/* User portal */}
          <Route path="user" element={
            <ProtectedRoute allow={['user']}>
              <UserLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<div className="px-4 py-5 sm:px-6 md:px-8 md:py-8"><SkeletonUserHome /></div>}><UserDashboard /></Suspense>} />
            <Route path="plan"      element={<Suspense fallback={<RouteFallback />}><UserPlan /></Suspense>} />
            <Route path="payments"  element={<Suspense fallback={<RouteFallback />}><UserPayments /></Suspense>} />
            <Route path="vault"     element={<Suspense fallback={<RouteFallback />}><UserVault /></Suspense>} />
            <Route path="draws"     element={<Suspense fallback={<RouteFallback />}><UserDraws /></Suspense>} />
            <Route path="redeem"    element={<Suspense fallback={<RouteFallback />}><UserRedeem /></Suspense>} />
            {/* Legacy paths → redeem (shop/purchases removed; redemption is in-store only) */}
            <Route path="products"  element={<Navigate to="../redeem" replace />} />
            <Route path="purchases" element={<Navigate to="../redeem" replace />} />
            <Route path="history"   element={<Navigate to="../redeem" replace />} />
            <Route path="profile"   element={<Suspense fallback={<RouteFallback />}><UserProfile /></Suspense>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// Re-export SkeletonDashboard for use in fallbacks
export { SkeletonDashboard };
