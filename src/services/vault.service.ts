import type { Vault, VaultTransaction } from '@/types';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

function resolveFranchiseId(provided?: string): string {
  if (provided) return provided;
  const user = useAuthStore.getState().user;
  if (user?.franchiseId) return user.franchiseId;
  throw new Error('Franchise context unavailable: pass franchiseId explicitly or log in.');
}

export const vaultService = {
  async getVault(userId: string, franchiseId?: string): Promise<Vault> {
    return api.get<Vault>(`/core/${resolveFranchiseId(franchiseId)}/users/${userId}/vault`);
  },

  async getAllVaults(): Promise<Vault[]> {
    return api.get<Vault[]>('/admin/vaults');
  },

  async getFranchiseVaults(franchiseId: string, userIds: string[]): Promise<Vault[]> {
    const fid = resolveFranchiseId(franchiseId);
    const vaults = await Promise.all(
      userIds.map((uid) => vaultService.getVault(uid, fid).catch(() => null as Vault | null)),
    );
    return vaults.filter((v): v is Vault => v !== null);
  },

  async getTransactions(userId: string, franchiseId?: string): Promise<VaultTransaction[]> {
    const vault = await vaultService.getVault(userId, franchiseId);
    return vault.transactions ?? [];
  },

  async applyTransaction(
    _userId: string,
    _tx: Omit<VaultTransaction, 'id' | 'balanceAfter'>,
  ): Promise<Vault> {
    throw new Error(
      'Arbitrary vault transactions are not exposed to clients. Vault mutations happen server-side via draws, payments, or voucher redemptions.',
    );
  },

  async zeroOutVault(
    _userId: string,
    _prizeValue: number,
    _meta: { drawId: string; prizeId: string },
  ): Promise<Vault> {
    throw new Error(
      'Vault zero-out is a server-side side-effect of draw execution. Call drawService.executeDraw instead.',
    );
  },
};
