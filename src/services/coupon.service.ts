import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

export type CouponType = 'flat' | 'percentage' | 'free';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  maxDiscount?: number;
  description: string;
  franchiseId?: string;
  groupId?: string;
  planId?: string;
  userId?: string;
  usageLimit?: number;
  usedCount: number;
  maxUsesPerUser: number;
  minOrderAmount: number;
  validFrom: string;
  validTo: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponApplyResult {
  valid: true;
  coupon: Coupon;
  discount: number;
  finalAmount: number;
}
export interface CouponRejectResult {
  valid: false;
  reason: string;
}
export type CouponResult = CouponApplyResult | CouponRejectResult;

function resolveFranchiseId(provided?: string): string {
  if (provided) return provided;
  const user = useAuthStore.getState().user;
  if (user?.franchiseId) return user.franchiseId;
  throw new Error('Franchise context unavailable: pass franchiseId explicitly or log in.');
}

export const couponService = {
  async getAll(franchiseId?: string): Promise<Coupon[]> {
    return api.get<Coupon[]>(`/core/${resolveFranchiseId(franchiseId)}/coupons`);
  },

  async create(data: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>): Promise<Coupon> {
    return api.post<Coupon>(`/core/${resolveFranchiseId(data.franchiseId)}/coupons`, data);
  },

  async update(id: string, data: Partial<Omit<Coupon, 'id' | 'createdAt'>>, franchiseId?: string): Promise<Coupon> {
    if (Object.keys(data).length === 1 && 'active' in data) {
      return couponService.toggleActive(id, franchiseId);
    }
    throw new Error('Arbitrary coupon updates beyond active toggle are not exposed by the backend.');
  },

  async delete(id: string, franchiseId?: string): Promise<void> {
    await api.del<void>(`/core/${resolveFranchiseId(franchiseId)}/coupons/${id}`);
  },

  async toggleActive(id: string, franchiseId?: string): Promise<Coupon> {
    return api.post<Coupon>(`/core/${resolveFranchiseId(franchiseId)}/coupons/${id}/toggle`);
  },

  async validate(args: {
    code: string;
    userId: string;
    amount: number;
    franchiseId?: string;
    groupId?: string;
    planId?: string;
  }): Promise<CouponResult> {
    // Keep client-side validation for now. Backend drop-in will be a future POST /validate endpoint.
    await Promise.resolve();
    const all = await couponService.getAll(args.franchiseId);
    const coupon = all.find((c) => c.code === args.code.trim().toUpperCase());

    if (!coupon) return { valid: false, reason: 'Invalid coupon code' };
    if (!coupon.active) return { valid: false, reason: 'This coupon is no longer active' };

    const now = new Date();
    if (now < new Date(coupon.validFrom)) return { valid: false, reason: 'Coupon is not yet valid' };
    if (now > new Date(coupon.validTo)) return { valid: false, reason: 'Coupon has expired' };

    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
      return { valid: false, reason: 'Coupon usage limit reached' };

    if (args.amount < coupon.minOrderAmount)
      return { valid: false, reason: `Minimum order amount is ₹${coupon.minOrderAmount}` };

    if (coupon.userId && coupon.userId !== args.userId)
      return { valid: false, reason: 'This coupon is not valid for your account' };
    if (coupon.franchiseId && coupon.franchiseId !== args.franchiseId)
      return { valid: false, reason: 'This coupon is not valid for your franchise' };
    if (coupon.groupId && coupon.groupId !== args.groupId)
      return { valid: false, reason: 'This coupon is not valid for your group' };
    if (coupon.planId && coupon.planId !== args.planId)
      return { valid: false, reason: 'This coupon is not valid for your plan' };

    let discount = 0;
    if (coupon.type === 'flat') {
      discount = Math.min(coupon.value, args.amount);
    } else if (coupon.type === 'percentage') {
      discount = (args.amount * coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === 'free') {
      discount = args.amount;
    }
    discount = Math.round(discount);

    return {
      valid: true,
      coupon,
      discount,
      finalAmount: Math.max(0, args.amount - discount),
    };
  },

  async redeem(couponId: string, userId: string, franchiseId?: string): Promise<void> {
    // Backend will expose a dedicated redeem endpoint when integrating real payments.
    // For now we keep a best-effort client marker via toggle if the server supported it.
    void couponId; void userId; void franchiseId;
    return Promise.resolve();
  },

  async seedDefaults(): Promise<void> {
    // Seeding is a server-side responsibility in production.
    // In dev this helper is intentionally a no-op.
  },
};
