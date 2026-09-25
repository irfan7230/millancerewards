// =============================================================================
// Franchise Service — real backend implementation
// FUTURE-BACKEND-INTEGRATION.md §FranchiseService interface
// Maps onto /api/v1/franchises. Signatures unchanged from the mock.
// =============================================================================

import type { Franchise, NewFranchiseInput } from '@/types';
import { api } from '@/lib/api/client';

export const franchiseService = {
  /** Super Admin only — returns all franchises */
  async getFranchises(): Promise<Franchise[]> {
    return api.get<Franchise[]>('/franchises');
  },

  async getFranchise(id: string): Promise<Franchise> {
    return api.get<Franchise>(`/franchises/${id}`);
  },

  async createFranchise(input: NewFranchiseInput): Promise<Franchise> {
    return api.post<Franchise>('/franchises', input);
  },

  async updateFranchise(id: string, input: Partial<Franchise>): Promise<Franchise> {
    return api.patch<Franchise>(`/franchises/${id}`, input);
  },

  async suspendFranchise(id: string): Promise<Franchise> {
    return api.post<Franchise>(`/franchises/${id}/suspend`);
  },

  async activateFranchise(id: string): Promise<Franchise> {
    return api.post<Franchise>(`/franchises/${id}/activate`);
  },
};
