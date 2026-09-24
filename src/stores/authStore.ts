// =============================================================================
// Auth Store
// SECURITY NOTE: This is a UI-layer mock only. Not a security boundary.
// See src/services/auth.service.ts and FUTURE-BACKEND-INTEGRATION.md.
// =============================================================================
import { create } from 'zustand';
import type { AuthUser, Role } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

interface AuthActions {
  login: (role: Role, credentials: { email: string; password?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
  initSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  user: null,
  status: 'idle',

  initSession: async () => {
    set({ status: 'loading' });
    try {
      const user = await authService.getSession();
      set({ user, status: 'success' });
    } catch {
      set({ status: 'error', error: 'Failed to restore session' });
    }
  },

  login: async (role, credentials) => {
    set({ status: 'loading', error: undefined });
    try {
      const user = await authService.login(role, credentials);
      set({ user, status: 'success' });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : 'Login failed' });
      throw e;
    }
  },

  updateUser: (patch) => set((state) => ({
    user: state.user ? { ...state.user, ...patch } : null
  })),

  logout: async () => {
    await authService.logout();
    set({ user: null, status: 'idle' });
  },
}));
