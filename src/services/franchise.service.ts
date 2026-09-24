// =============================================================================
// Franchise Service — mock implementation
// FUTURE-BACKEND-INTEGRATION.md §FranchiseService interface
// All reads/writes go through the persistence adapter, never direct localStorage.
// =============================================================================

import type { Franchise, NewFranchiseInput } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';

function delay(ms = 300): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function getAll(): Franchise[] {
  return persistence.get<Franchise[]>(KEYS.FRANCHISES) ?? [];
}
function saveAll(data: Franchise[]): void {
  persistence.set(KEYS.FRANCHISES, data);
}

export const franchiseService = {
  /** Super Admin only — returns all franchises */
  async getFranchises(): Promise<Franchise[]> {
    await delay();
    return getAll();
  },

  async getFranchise(id: string): Promise<Franchise> {
    await delay(200);
    const found = getAll().find(f => f.id === id);
    if (!found) throw new Error(`Franchise ${id} not found`);
    return found;
  },

  async createFranchise(input: NewFranchiseInput): Promise<Franchise> {
    await delay(400);
    const all = getAll();
    const newFranchise: Franchise = {
      id: `fran-${Date.now()}`,
      ...input,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    saveAll([...all, newFranchise]);
    return newFranchise;
  },

  async updateFranchise(id: string, input: Partial<Franchise>): Promise<Franchise> {
    await delay(300);
    const all = getAll();
    const idx = all.findIndex(f => f.id === id);
    if (idx === -1) throw new Error(`Franchise ${id} not found`);
    const updated = { ...all[idx], ...input };
    all[idx] = updated;
    saveAll(all);
    return updated;
  },

  async suspendFranchise(id: string): Promise<Franchise> {
    return franchiseService.updateFranchise(id, { status: 'suspended' });
  },

  async activateFranchise(id: string): Promise<Franchise> {
    return franchiseService.updateFranchise(id, { status: 'active' });
  },
};
