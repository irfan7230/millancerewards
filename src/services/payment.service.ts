import type { Payment, PaymentStatus } from '@/types';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

function resolveFranchiseId(provided?: string): string {
  if (provided) return provided;
  const user = useAuthStore.getState().user;
  if (user?.franchiseId) return user.franchiseId;
  throw new Error('Franchise context unavailable: pass franchiseId explicitly or log in.');
}

export const paymentService = {
  async getFranchisePayments(franchiseId: string): Promise<Payment[]> {
    return api.get<Payment[]>(`/core/${resolveFranchiseId(franchiseId)}/payments`);
  },

  async getAllPayments(): Promise<Payment[]> {
    return api.get<Payment[]>('/admin/payments');
  },

  async getUserPayments(userId: string, franchiseId?: string): Promise<Payment[]> {
    return api.get<Payment[]>(`/core/${resolveFranchiseId(franchiseId)}/users/${userId}/payments`);
  },

  async getPlanPayments(planId: string, franchiseId?: string): Promise<Payment[]> {
    const all = await paymentService.getFranchisePayments(resolveFranchiseId(franchiseId));
    return all.filter((p) => p.planId === planId);
  },

  async getPayment(id: string, franchiseId?: string): Promise<Payment> {
    const all = await paymentService.getFranchisePayments(resolveFranchiseId(franchiseId));
    const found = all.find((p) => p.id === id);
    if (!found) throw new Error(`Payment ${id} not found`);
    return found;
  },

  async processPayment(paymentId: string, outcome: PaymentStatus, franchiseId?: string): Promise<Payment> {
    return api.post<Payment>(
      `/core/${resolveFranchiseId(franchiseId)}/payments/${paymentId}/simulate`,
      { outcome },
    );
  },

  async batchCreatePayments(_payments: Payment[]): Promise<void> {
    // Plan/month payment generation is a server-side responsibility (transactional).
    // This client-side helper is a no-op in production.
  },
};
