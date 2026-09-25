import type { FranchiseUser, NewUserInput, UserStatus } from '@/types';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

function resolveFranchiseId(provided?: string): string {
  if (provided) return provided;
  const user = useAuthStore.getState().user;
  if (user?.franchiseId) return user.franchiseId;
  throw new Error('Franchise context unavailable: pass franchiseId explicitly or log in.');
}

export const userService = {
  async getFranchiseUsers(franchiseId: string): Promise<FranchiseUser[]> {
    const res = await api.getPaginated<FranchiseUser>(`/core/${resolveFranchiseId(franchiseId)}/users`);
    return res.items;
  },

  async getAllUsers(): Promise<FranchiseUser[]> {
    return api.get<FranchiseUser[]>('/admin/users');
  },

  async getUser(id: string, franchiseId?: string): Promise<FranchiseUser> {
    return api.get<FranchiseUser>(`/core/${resolveFranchiseId(franchiseId)}/users/${id}`);
  },

  async getUsersByPlan(planId: string, franchiseId?: string): Promise<FranchiseUser[]> {
    const all = await userService.getFranchiseUsers(resolveFranchiseId(franchiseId));
    return all.filter((u) => u.planId === planId);
  },

  async getUsersByGroup(groupId: string, franchiseId?: string): Promise<FranchiseUser[]> {
    const all = await userService.getFranchiseUsers(resolveFranchiseId(franchiseId));
    return all.filter((u) => u.groupId === groupId);
  },

  async createUser(input: NewUserInput): Promise<FranchiseUser> {
    return api.post<FranchiseUser>(`/core/${input.franchiseId}/users`, input);
  },

  async updateUserStatus(id: string, status: UserStatus, franchiseId?: string): Promise<FranchiseUser> {
    return api.patch<FranchiseUser>(`/core/${resolveFranchiseId(franchiseId)}/users/${id}/status`, { status });
  },

  async updateUser(id: string, patch: Partial<FranchiseUser>, franchiseId?: string): Promise<FranchiseUser> {
    return api.patch<FranchiseUser>(`/core/${resolveFranchiseId(franchiseId)}/users/${id}`, patch);
  },

  async batchUpdateUsers(_updates: Array<{ id: string; patch: Partial<FranchiseUser> }>): Promise<void> {
    // No server equivalent. Backend performs batch operations transactionally
    // within its own workflows (draws, month rollover). Client-side callers
    // should not rely on this method doing anything.
  },
};
