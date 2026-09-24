// =============================================================================
// Payment Service
// Production-ready: all operations are backend-contract-compatible.
// The localStorage adapter is swapped for real HTTP calls during integration.
// =============================================================================
import type { Payment, PaymentStatus } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';

function delay(ms = 300): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
function getAll(): Payment[] { return persistence.get<Payment[]>(KEYS.PAYMENTS) ?? []; }
function saveAll(d: Payment[]): void { persistence.set(KEYS.PAYMENTS, d); }

export const paymentService = {
  async getFranchisePayments(franchiseId: string): Promise<Payment[]> {
    await delay();
    return getAll().filter(p => p.franchiseId === franchiseId);
  },

  async getAllPayments(): Promise<Payment[]> {
    await delay();
    return getAll();
  },

  async getUserPayments(userId: string): Promise<Payment[]> {
    await delay(200);
    return getAll().filter(p => p.userId === userId);
  },

  async getPlanPayments(planId: string): Promise<Payment[]> {
    await delay(200);
    return getAll().filter(p => p.planId === planId);
  },

  async getPayment(id: string): Promise<Payment> {
    await delay(150);
    const found = getAll().find(p => p.id === id);
    if (!found) throw new Error(`Payment ${id} not found`);
    return found;
  },

  /**
   * Mark a payment as Paid (or another terminal status).
   * In production this will POST /api/payments/:id/status.
   */
  async processPayment(paymentId: string, outcome: PaymentStatus): Promise<Payment> {
    await delay(600);
    const all = getAll();
    const idx = all.findIndex(p => p.id === paymentId);
    if (idx === -1) throw new Error(`Payment ${paymentId} not found`);
    const updated: Payment = {
      ...all[idx],
      status: outcome,
      paidAt: outcome === 'Paid' ? new Date().toISOString() : undefined,
    };
    all[idx] = updated;
    saveAll(all);
    return updated;
  },

  /** Bulk-insert payment records (used during plan creation / month rollover). */
  async batchCreatePayments(payments: Payment[]): Promise<void> {
    const all = getAll();
    saveAll([...all, ...payments]);
  },
};
