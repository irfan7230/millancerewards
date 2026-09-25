// =============================================================================
// Auth Service — real backend implementation
// FUTURE-BACKEND-INTEGRATION.md §AuthService interface
//
// Talks to POST /auth/login, POST /auth/logout, GET /auth/session.
// The backend issues a short-lived JWT access token (kept in localStorage via
// the token store) and a long-lived httpOnly refresh cookie (managed by the
// browser). The exported signatures and the returned AuthUser shape are
// unchanged, so authStore, route guards, and pages need no modification.
// =============================================================================

import type { AuthUser, Role } from '@/types';
import { api } from '@/lib/api/client';
import { setToken, clearToken, getToken } from '@/lib/api/token';

// Demo accounts retained for the login screen's quick-fill buttons. These are
// display hints only; real credentials are verified by the backend.
export const DEMO_ACCOUNTS: Record<Role, AuthUser> = {
  super_admin: {
    id: 'demo-admin-001',
    role: 'super_admin',
    name: 'Demo Admin',
    email: 'admin@millance.com',
  },
  franchise: {
    id: 'demo-fran-001',
    role: 'franchise',
    name: 'Demo Franchise Manager',
    email: 'franchise@millance.com',
    franchiseId: 'fran-0001',
  },
  user: {
    id: 'usr-0001',
    role: 'user',
    name: 'Demo User',
    email: 'user@millance.com',
    franchiseId: 'fran-0001',
  },
};

export interface AuthService {
  login(role: Role, credentials: { email: string; password?: string }): Promise<AuthUser>;
  logout(): Promise<void>;
  getSession(): Promise<AuthUser | null>;
}

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

export const authService: AuthService = {
  async login(role, credentials): Promise<AuthUser> {
    const res = await api.post<LoginResponse>(
      '/auth/login',
      { role, email: credentials.email, password: credentials.password },
      { skipAuth: true },
    );
    setToken(res.accessToken);
    return res.user;
  },

  async logout(): Promise<void> {
    try {
      await api.post<null>('/auth/logout');
    } finally {
      // Always clear the local token even if the network call fails.
      clearToken();
    }
  },

  async getSession(): Promise<AuthUser | null> {
    // No stored access token means no session to restore.
    if (!getToken()) return null;
    try {
      return await api.get<AuthUser>('/auth/session');
    } catch {
      // Token invalid/expired and refresh failed — treat as logged out.
      clearToken();
      return null;
    }
  },
};
