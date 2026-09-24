// =============================================================================
// Voucher Service — store-redemption vouchers.
// A member issues a voucher from their vault balance (UserRedeem); a franchise
// validates the code and bills against it in store (FranchiseRedeem), which
// deducts the member's vault atomically. Backend-ready: same signatures map
// cleanly onto a future /api/vouchers surface.
// =============================================================================
import type { Voucher, VoucherStatus } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';
import { vaultService } from './vault.service';
import { notificationService } from './notification.service';
import { activityService } from './activity.service';

function delay(ms = 250): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
function getAll(): Voucher[] { return persistence.get<Voucher[]>(KEYS.VOUCHERS) ?? []; }
function saveAll(d: Voucher[]): void { persistence.set(KEYS.VOUCHERS, d); }

const VALID_HOURS = 24;

// Normalize a scanned/typed code (case-insensitive, trims spaces).
function normalize(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

/** A voucher that has passed its expiry window is treated as expired. */
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
  /** Member issues a voucher from their vault balance. */
  async issue(input: { code: string; userId: string; franchiseId: string; value: number }): Promise<Voucher> {
    await delay();
    const now = Date.now();
    const voucher: Voucher = {
      id: `vch-${now}-${Math.random().toString(36).slice(2)}`,
      code: normalize(input.code),
      userId: input.userId,
      franchiseId: input.franchiseId,
      value: input.value,
      status: 'active',
      issuedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + VALID_HOURS * 3600 * 1000).toISOString(),
    };
    // Replace any prior active voucher with the same code (defensive).
    saveAll([...getAll().filter(v => v.code !== voucher.code), voucher]);
    return voucher;
  },

  async getByCode(code: string): Promise<Voucher | undefined> {
    await delay(150);
    const v = getAll().find(x => x.code === normalize(code));
    return v ? { ...v, status: effectiveStatus(v) } : undefined;
  },

  async getFranchiseVouchers(franchiseId: string): Promise<Voucher[]> {
    await delay();
    return getAll()
      .filter(v => v.franchiseId === franchiseId)
      .map(v => ({ ...v, status: effectiveStatus(v) }))
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  },

  /**
   * Validate a code for a given franchise (staff at the counter).
   * Does not mutate anything — pure check used before billing.
   */
  async validate(code: string, franchiseId: string): Promise<ValidateResult> {
    const voucher = await voucherService.getByCode(code);
    if (!voucher) return { ok: false, reason: 'not_found' };
    if (voucher.franchiseId !== franchiseId) return { ok: false, reason: 'wrong_franchise', voucher };
    if (voucher.status === 'redeemed') return { ok: false, reason: 'redeemed', voucher };
    if (voucher.status === 'expired') return { ok: false, reason: 'expired', voucher };
    return { ok: true, voucher };
  },

  /**
   * Redeem a voucher at the store for `billAmount` (≤ voucher.value).
   * Atomically: deduct the member's vault + mark the voucher redeemed.
   */
  async redeem(code: string, franchiseId: string, billAmount: number): Promise<Voucher> {
    await delay(500);
    const check = await voucherService.validate(code, franchiseId);
    if (!check.ok || !check.voucher) {
      throw new Error(
        check.reason === 'not_found' ? 'Voucher not found.'
        : check.reason === 'expired' ? 'This voucher has expired.'
        : check.reason === 'redeemed' ? 'This voucher was already redeemed.'
        : check.reason === 'wrong_franchise' ? 'Voucher belongs to another franchise.'
        : 'Voucher is not valid.',
      );
    }
    const voucher = check.voucher;

    if (billAmount <= 0) throw new Error('Enter a bill amount greater than zero.');
    if (billAmount > voucher.value) throw new Error(`Bill exceeds voucher value (${voucher.value}).`);

    // Check live vault balance covers the bill.
    const vault = await vaultService.getVault(voucher.userId);
    if (vault.balance < billAmount) {
      throw new Error(`Member vault balance (₹${vault.balance.toLocaleString('en-IN')}) is insufficient.`);
    }

    // Deduct from the member's vault (atomic within the service call).
    const updatedVault = await vaultService.applyTransaction(voucher.userId, {
      userId: voucher.userId,
      type: 'product_purchase',
      amount: -billAmount,
      createdAt: new Date().toISOString(),
      meta: { note: `In-store purchase · voucher ${voucher.code}` },
    });
    const vaultTransactionId = updatedVault.transactions[updatedVault.transactions.length - 1].id;

    // Mark the voucher redeemed.
    const all = getAll();
    const idx = all.findIndex(v => v.id === voucher.id);
    const redeemed: Voucher = {
      ...voucher,
      status: 'redeemed',
      redeemedAt: new Date().toISOString(),
      redeemedAmount: billAmount,
      vaultTransactionId,
    };
    if (idx !== -1) { all[idx] = redeemed; saveAll(all); }

    // Notify the member + log activity.
    await notificationService.emit({
      audienceRole: 'user',
      franchiseId,
      userId: voucher.userId,
      kind: 'purchase_success',
      message: `In-store purchase of ₹${billAmount.toLocaleString('en-IN')} settled from your vault (voucher ${voucher.code}).`,
    });
    await activityService.log({
      franchiseId,
      actorRole: 'franchise',
      action: 'voucher.redeemed',
      targetType: 'voucher',
      targetId: voucher.id,
      meta: { userId: voucher.userId, billAmount, vaultTransactionId },
    });

    return redeemed;
  },
};
