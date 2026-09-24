// =============================================================================
// Coupon Service — Admin creates coupons; users apply them at checkout.
// Backend-ready: all functions async; replace localStorage with REST calls.
//
// Coupon types:
//   - flat:       fixed ₹ discount off the payment amount
//   - percentage: % off, with optional maxDiscount cap
//   - free:       makes the payment ₹0 (full waiver)
//
// Scope rules (all optional — absent = global):
//   - franchiseId:  only usable within this franchise
//   - groupId:      only usable within this group
//   - planId:       only applicable to this plan
//   - userId:       single-use gift coupon for one user
//
// Constraints:
//   - usageLimit:   max total redemptions (null = unlimited)
//   - usedCount:    tracks current usage
//   - maxUsesPerUser: per-user cap (default 1)
//   - minOrderAmount: minimum payment amount to apply
//   - validFrom / validTo: ISO datetime range
//   - active:       admin toggle to enable/disable
// =============================================================================
import { persistence } from '@/lib/persistence';

const COUPON_KEY = 'millance:coupons';

export type CouponType = 'flat' | 'percentage' | 'free';

export interface Coupon {
  id: string;
  code: string;               // e.g. "WELCOME100"
  type: CouponType;
  value: number;              // ₹ for flat, % for percentage, ignored for free
  maxDiscount?: number;       // cap for percentage type
  description: string;        // shown to user: "₹100 off your first payment"
  // Scope
  franchiseId?: string;
  groupId?: string;
  planId?: string;
  userId?: string;            // single-user gift
  // Constraints
  usageLimit?: number;        // null = unlimited
  usedCount: number;
  maxUsesPerUser: number;
  minOrderAmount: number;     // 0 = no minimum
  // Validity
  validFrom: string;          // ISO date
  validTo: string;            // ISO date
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponApplyResult {
  valid: true;
  coupon: Coupon;
  discount: number;           // ₹ amount to subtract
  finalAmount: number;        // amount after discount
}
export interface CouponRejectResult {
  valid: false;
  reason: string;
}
export type CouponResult = CouponApplyResult | CouponRejectResult;

// Per-user usage tracking
const USAGE_KEY = (couponId: string) => `millance:coupon_usage:${couponId}`;

function delay(ms = 200): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
function getAll(): Coupon[] { return persistence.get<Coupon[]>(COUPON_KEY) ?? []; }
function saveAll(d: Coupon[]): void { persistence.set(COUPON_KEY, d); }

function getUserUsage(couponId: string, userId: string): number {
  const map = persistence.get<Record<string, number>>(USAGE_KEY(couponId)) ?? {};
  return map[userId] ?? 0;
}
function incrementUserUsage(couponId: string, userId: string): void {
  const map = persistence.get<Record<string, number>>(USAGE_KEY(couponId)) ?? {};
  map[userId] = (map[userId] ?? 0) + 1;
  persistence.set(USAGE_KEY(couponId), map);
}

export const couponService = {
  // ── Admin operations ─────────────────────────────────────────────────────

  async getAll(): Promise<Coupon[]> {
    await delay();
    return getAll();
  },

  async create(data: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>): Promise<Coupon> {
    await delay(300);
    const all = getAll();
    const code = data.code.trim().toUpperCase();
    if (all.some(c => c.code === code)) throw new Error(`Coupon code "${code}" already exists`);
    const now = new Date().toISOString();
    const coupon: Coupon = {
      ...data,
      id: crypto.randomUUID(),
      code,
      usedCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    saveAll([...all, coupon]);
    return coupon;
  },

  async update(id: string, data: Partial<Omit<Coupon, 'id' | 'createdAt'>>): Promise<Coupon> {
    await delay(300);
    const all = getAll();
    const idx = all.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Coupon not found');
    const updated: Coupon = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    if (data.code) updated.code = data.code.trim().toUpperCase();
    all[idx] = updated;
    saveAll(all);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await delay(200);
    saveAll(getAll().filter(c => c.id !== id));
  },

  async toggleActive(id: string): Promise<Coupon> {
    const all = getAll();
    const c = all.find(c => c.id === id);
    if (!c) throw new Error('Coupon not found');
    return couponService.update(id, { active: !c.active });
  },

  // ── User operations ─────────────────────────────────────────────────────

  /**
   * Validate and calculate discount for a coupon code.
   * Call this BEFORE checkout — does not consume the coupon.
   */
  async validate(args: {
    code: string;
    userId: string;
    amount: number;
    franchiseId?: string;
    groupId?: string;
    planId?: string;
  }): Promise<CouponResult> {
    await delay(350);
    const all = getAll();
    const coupon = all.find(c => c.code === args.code.trim().toUpperCase());

    if (!coupon) return { valid: false, reason: 'Invalid coupon code' };
    if (!coupon.active) return { valid: false, reason: 'This coupon is no longer active' };

    const now = new Date();
    if (now < new Date(coupon.validFrom)) return { valid: false, reason: 'Coupon is not yet valid' };
    if (now > new Date(coupon.validTo)) return { valid: false, reason: 'Coupon has expired' };

    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
      return { valid: false, reason: 'Coupon usage limit reached' };

    if (args.amount < coupon.minOrderAmount)
      return { valid: false, reason: `Minimum order amount is ₹${coupon.minOrderAmount}` };

    // Scope checks
    if (coupon.userId && coupon.userId !== args.userId)
      return { valid: false, reason: 'This coupon is not valid for your account' };
    if (coupon.franchiseId && coupon.franchiseId !== args.franchiseId)
      return { valid: false, reason: 'This coupon is not valid for your franchise' };
    if (coupon.groupId && coupon.groupId !== args.groupId)
      return { valid: false, reason: 'This coupon is not valid for your group' };
    if (coupon.planId && coupon.planId !== args.planId)
      return { valid: false, reason: 'This coupon is not valid for your plan' };

    // Per-user usage
    const userUsage = getUserUsage(coupon.id, args.userId);
    if (userUsage >= coupon.maxUsesPerUser)
      return { valid: false, reason: `You have already used this coupon ${coupon.maxUsesPerUser === 1 ? '' : `${coupon.maxUsesPerUser} times`}`.trim() };

    // Calculate discount
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

  /**
   * Redeem (consume) a coupon after successful payment.
   * Increments global + per-user usage counters.
   */
  async redeem(couponId: string, userId: string): Promise<void> {
    await delay(100);
    const all = getAll();
    const idx = all.findIndex(c => c.id === couponId);
    if (idx === -1) return;
    all[idx] = { ...all[idx], usedCount: all[idx].usedCount + 1, updatedAt: new Date().toISOString() };
    saveAll(all);
    incrementUserUsage(couponId, userId);
  },

  // ── Seed defaults (so Admin has sample coupons on first load) ───────────

  async seedDefaults(): Promise<void> {
    if (getAll().length > 0) return;
    const now = new Date();
    const future = new Date(now);
    future.setMonth(future.getMonth() + 3);
    await couponService.create({
      code: 'WELCOME100',
      type: 'flat',
      value: 100,
      description: '₹100 off your first payment — welcome gift',
      usageLimit: 1000,
      maxUsesPerUser: 1,
      minOrderAmount: 500,
      validFrom: now.toISOString(),
      validTo: future.toISOString(),
      active: true,
    });
    await couponService.create({
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
      maxDiscount: 200,
      description: '10% off (up to ₹200) on any payment',
      usageLimit: undefined,
      maxUsesPerUser: 3,
      minOrderAmount: 0,
      validFrom: now.toISOString(),
      validTo: future.toISOString(),
      active: true,
    });
    await couponService.create({
      code: 'FESTIVAL50',
      type: 'flat',
      value: 50,
      description: '₹50 off — Festival Special',
      usageLimit: 500,
      maxUsesPerUser: 1,
      minOrderAmount: 1000,
      validFrom: now.toISOString(),
      validTo: future.toISOString(),
      active: false,
    });
  },
};
