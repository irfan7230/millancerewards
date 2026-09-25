import type { Prize } from '@/types';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

function resolveFranchiseId(provided?: string): string {
  if (provided) return provided;
  const user = useAuthStore.getState().user;
  if (user?.franchiseId) return user.franchiseId;
  throw new Error('Franchise context unavailable: pass franchiseId explicitly or log in.');
}

export const prizeService = {
  async getFranchisePrizes(franchiseId: string): Promise<Prize[]> {
    return api.get<Prize[]>(`/core/${resolveFranchiseId(franchiseId)}/prizes`);
  },

  async getAllPrizes(): Promise<Prize[]> {
    return api.get<Prize[]>('/admin/prizes');
  },

  async getPrize(id: string, franchiseId?: string): Promise<Prize> {
    return api.get<Prize>(`/core/${resolveFranchiseId(franchiseId)}/prizes/${id}`);
  },

  async createPrize(prize: Omit<Prize, 'id'>): Promise<Prize> {
    const franchiseId = (prize as Prize & { franchiseId?: string }).franchiseId;
    if (!franchiseId) throw new Error('Cannot create prize: missing franchiseId');
    return api.post<Prize>(`/core/${resolveFranchiseId(franchiseId)}/prizes`, prize);
  },

  async updatePrize(id: string, patch: Partial<Prize>, franchiseId?: string): Promise<Prize> {
    const fid = resolveFranchiseId(franchiseId ?? patch.franchiseId);
    return api.patch<Prize>(`/core/${fid}/prizes/${id}`, patch);
  },

  async deletePrize(id: string, franchiseId?: string): Promise<void> {
    await api.del<void>(`/core/${resolveFranchiseId(franchiseId)}/prizes/${id}`);
  },
};
