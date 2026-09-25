import type { Plan, NewPlanInput } from '@/types';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

function resolveFranchiseId(provided?: string): string {
  if (provided) return provided;
  const user = useAuthStore.getState().user;
  if (user?.franchiseId) return user.franchiseId;
  throw new Error('Franchise context unavailable: pass franchiseId explicitly or log in.');
}

export const planService = {
  async getFranchisePlans(franchiseId: string): Promise<Plan[]> {
    return api.get<Plan[]>(`/core/${resolveFranchiseId(franchiseId)}/plans`);
  },

  async getAllPlans(): Promise<Plan[]> {
    return api.get<Plan[]>('/admin/plans');
  },

  async getPlan(id: string, franchiseId?: string): Promise<Plan> {
    return api.get<Plan>(`/core/${resolveFranchiseId(franchiseId)}/plans/${id}`);
  },

  async getGroupPlans(groupId: string, franchiseId?: string): Promise<Plan[]> {
    const all = await planService.getFranchisePlans(resolveFranchiseId(franchiseId));
    return all.filter((p) => p.groupId === groupId);
  },

  async createPlan(input: NewPlanInput): Promise<Plan> {
    return api.post<Plan>(`/core/${input.franchiseId}/plans`, input);
  },

  async updatePlan(id: string, patch: Partial<Plan>, franchiseId?: string): Promise<Plan> {
    const resolvedFranchiseId = resolveFranchiseId(franchiseId);
    return api.patch<Plan>(`/core/${resolvedFranchiseId}/plans/${id}`, patch);
  },

  async advancePlanMonths(_franchiseIds?: string[]): Promise<void> {
    // Month advancement is handled server-side by scheduled jobs / explicit triggers.
    // This client-side helper is intentionally a no-op in production.
  },
};
