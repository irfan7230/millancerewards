// =============================================================================
// Payment Service
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

  async simulatePayment(paymentId: string, outcome: PaymentStatus): Promise<Payment> {
    await delay(600); // Simulate a network roundtrip feel
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

  /** Generate payment records for the next month (called by advanceMonth) */
  async generateNextMonthPayments(
    franchiseId: string,
    planId: string,
    userId: string,
    month: number,
    amount: number,
    periodLabel: string,
    dueDate: string,
  ): Promise<Payment> {
    const newPayment: Payment = {
      id: `pay-${Date.now()}-${userId}`,
      franchiseId,
      userId,
      planId,
      month,
      periodLabel,
      amount,
      status: 'Pending',
      dueDate,
    };
    const all = getAll();
    saveAll([...all, newPayment]);
    return newPayment;
  },

  async batchCreatePayments(payments: Payment[]): Promise<void> {
    const all = getAll();
    saveAll([...all, ...payments]);
  },
};
