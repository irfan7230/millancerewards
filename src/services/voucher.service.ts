import type { Voucher, VoucherStatus } from '@/types';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

function resolveFranchiseId(provided?: string): string {
  if (provided) return provided;
  const user = useAuthStore.getState().user;
  if (user?.franchiseId) return user.franchiseId;
  throw new Error('Franchise context unavailable: pass franchiseId explicitly or log in.');
}

function normalize(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

function effectiveStatus(v: Voucher): VoucherStatus {
  if (v.status === 'redeemed') return 'redeemed';
  if (Date.now() > new Date(v.expiresAt).getTime()) return 'expired';
  return v.status;
}

export interface ValidateResult {
  ok: boolean;
  reason?: 'not_found' | 'expired' | 'redeemed' | 'wrong_franchise';
  voucher?: Voucher;
}

export const voucherService = {
  async issue(input: { code: string; userId: string; franchiseId: string; value: number }): Promise<Voucher> {
    return api.post<Voucher>(`/core/${resolveFranchiseId(input.franchiseId)}/vouchers`, {
      code: normalize(input.code),
      userId: input.userId,
      value: input.value,
    });
  },

  async getByCode(code: string, franchiseId?: string): Promise<Voucher | undefined> {
    const list = await voucherService.getFranchiseVouchers(resolveFranchiseId(franchiseId));
    const found = list.find((v) => v.code === normalize(code));
    return found ? { ...found, status: effectiveStatus(found) } : undefined;
  },

  async getFranchiseVouchers(franchiseId: string): Promise<Voucher[]> {
    const list = await api.get<Voucher[]>(`/core/${resolveFranchiseId(franchiseId)}/vouchers`);
    return list
      .map((v) => ({ ...v, status: effectiveStatus(v) }))
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  },

  async validate(code: string, franchiseId: string): Promise<ValidateResult> {
    const fid = resolveFranchiseId(franchiseId);
    try {
      const res = await api.post<{ ok: boolean; reason?: string; voucher?: Voucher }>(
        `/core/${fid}/vouchers/validate`,
        { code: normalize(code) },
      );
      const ok = !!res.ok;
      const reasonMap: Record<string, ValidateResult['reason']> = {
        not_found: 'not_found',
        expired: 'expired',
        redeemed: 'redeemed',
        wrong_franchise: 'wrong_franchise',
      };
      return {
        ok,
        reason: !ok && res.reason ? (reasonMap[res.reason] ?? 'not_found') : undefined,
        voucher: res.voucher ? { ...res.voucher, status: effectiveStatus(res.voucher) } : undefined,
      };
    } catch (e) {
      return { ok: false, reason: 'not_found' };
    }
  },

  async redeem(code: string, franchiseId: string, billAmount: number): Promise<Voucher> {
    const fid = resolveFranchiseId(franchiseId);
    return api.post<Voucher>(`/core/${fid}/vouchers/redeem`, {
      code: normalize(code),
      billAmount,
    });
  },
};
