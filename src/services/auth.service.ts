// =============================================================================
// Auth Service — mock implementation
// FUTURE-BACKEND-INTEGRATION.md §AuthService interface
//
// SECURITY NOTE: This is a UI-layer mock. Route guards and role checks here
// are conveniences, NOT a security boundary. A real auth server must be added
// before any production deployment. Never store real passwords here.
// =============================================================================

import type { AuthUser, Role } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';

// Demo accounts per DEVELOPMENT.md §Demo accounts
export const DEMO_ACCOUNTS: Record<Role, AuthUser> = {
  super_admin: {
    id: 'demo-admin-001',
    role: 'super_admin',
    name: 'Demo Admin',
    email: 'admin@millance.demo',
  },
  franchise: {
    id: 'demo-fran-001',
    role: 'franchise',
    name: 'Demo Franchise Manager',
    email: 'franchise@millance.demo',
    franchiseId: 'fran-0001',
  },
  user: {
    id: 'usr-0001',
    role: 'user',
    name: 'Demo User',
    email: 'user@millance.demo',
    franchiseId: 'fran-0001',
  },
};

export interface AuthService {
  login(role: Role, credentials: { email: string; password?: string }): Promise<AuthUser>;
  logout(): Promise<void>;
  getSession(): Promise<AuthUser | null>;
}

function simulateDelay(ms = 400): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const authService: AuthService = {
  async login(role, credentials): Promise<AuthUser> {
    await simulateDelay(500);
    // Map email to demo account — no real password check
    const demo = DEMO_ACCOUNTS[role];
    if (!demo) throw new Error(`Unknown role: ${role}`);
    // Accept demo email or any non-empty credentials for that role
    const user: AuthUser = {
      ...demo,
      email: credentials.email || demo.email,
    };
    persistence.set<AuthUser>(KEYS.AUTH_SESSION, user);
    return user;
  },

  async logout(): Promise<void> {
    await simulateDelay(200);
    persistence.remove(KEYS.AUTH_SESSION);
  },

  async getSession(): Promise<AuthUser | null> {
    return persistence.get<AuthUser>(KEYS.AUTH_SESSION) ?? null;
  },
};
