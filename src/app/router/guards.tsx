// =============================================================================
// Route Guards — implemented ONCE here, not per-page
// ROUTING.md §Route guards
// SECURITY NOTE: These are UI-layer conveniences only, not a security boundary.
// See FUTURE-BACKEND-INTEGRATION.md for the production auth requirements.
// =============================================================================
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { PageLoader } from '@/components/ui/States';

interface ProtectedRouteProps {
  allow: Role[];
  children: React.ReactNode;
}

/**
 * Wraps a portal's route group.
 * - Unauthenticated → redirect to /login
 * - Wrong role → redirect to the role's own dashboard
 * - Correct role → render children
 */
export function ProtectedRoute({ allow, children }: ProtectedRouteProps) {
  const { user, status } = useAuthStore();
  const location = useLocation();

  if (status === 'loading') {
    return <PageLoader label="Verifying access…" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allow.includes(user.role)) {
    // Redirect to the right portal for their role
    const roleHome: Record<Role, string> = {
      super_admin: '/admin/dashboard',
      franchise:   '/franchise/dashboard',
      user:        '/user/dashboard',
    };
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return <>{children}</>;
}

/** Redirect authenticated users away from /login to their portal */
export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  if (user) {
    const roleHome: Record<Role, string> = {
      super_admin: '/admin/dashboard',
      franchise:   '/franchise/dashboard',
      user:        '/user/dashboard',
    };
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return <>{children}</>;
}
