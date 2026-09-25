import type { Draw, DrawResult } from '@/types';
import { api } from '@/lib/api/client';
import { checkDrawEligibility } from '@/lib/engine/luckyDraw';
import { userService } from './user.service';
import { paymentService } from './payment.service';
import { useAuthStore } from '@/stores/authStore';

function resolveFranchiseId(provided?: string): string {
  if (provided) return provided;
  const user = useAuthStore.getState().user;
  if (user?.franchiseId) return user.franchiseId;
  throw new Error('Franchise context unavailable: pass franchiseId explicitly or log in.');
}

export const drawService = {
  async getFranchiseDraws(franchiseId: string): Promise<Draw[]> {
    return api.get<Draw[]>(`/core/${resolveFranchiseId(franchiseId)}/draws`);
  },

  async getAllDraws(): Promise<Draw[]> {
    return api.get<Draw[]>('/admin/draws');
  },

  async getDraw(id: string, franchiseId?: string): Promise<Draw> {
    const all = await drawService.getFranchiseDraws(resolveFranchiseId(franchiseId));
    const found = all.find((d) => d.id === id);
    if (!found) throw new Error(`Draw ${id} not found`);
    return found;
  },

  async getPlanDraws(planId: string, franchiseId?: string): Promise<Draw[]> {
    const all = await drawService.getFranchiseDraws(resolveFranchiseId(franchiseId));
    return all.filter((d) => d.planId === planId);
  },

  async checkEligibility(franchiseId: string, groupId: string, planId: string, month: number) {
    const fid = resolveFranchiseId(franchiseId);
    const allUsers = await userService.getUsersByPlan(planId, fid);
    const allPayments = await paymentService.getPlanPayments(planId, fid);
    const monthPayments = allPayments.filter((p) => p.month === month);
    const priorDraws = await drawService.getPlanDraws(planId, fid);
    return checkDrawEligibility({ franchiseId: fid, groupId, planId, month, allPlanUsers: allUsers, monthPayments, priorDraws });
  },

  async executeDraw(groupId: string, planId: string, month: number, franchiseId: string): Promise<DrawResult> {
    const fid = resolveFranchiseId(franchiseId);
    return api.post<DrawResult>(`/core/${fid}/draws/execute`, { groupId, planId, month });
  },
};
