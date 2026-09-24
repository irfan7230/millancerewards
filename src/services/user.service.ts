// =============================================================================
// User Service — tenant-scoped, mock implementation
// Every function requiring franchise-scope takes franchiseId as first arg.
// Super Admin cross-tenant calls are explicitly named getAllUsers().
// =============================================================================

import type { FranchiseUser, NewUserInput, UserStatus } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';

function delay(ms = 300): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function getAll(): FranchiseUser[] {
  return persistence.get<FranchiseUser[]>(KEYS.USERS) ?? [];
}
function saveAll(data: FranchiseUser[]): void {
  persistence.set(KEYS.USERS, data);
}

export const userService = {
  /** Franchise-scoped: only returns users belonging to this franchise */
  async getFranchiseUsers(franchiseId: string): Promise<FranchiseUser[]> {
    await delay();
    return getAll().filter(u => u.franchiseId === franchiseId);
  },

  /** Super Admin cross-tenant read */
  async getAllUsers(): Promise<FranchiseUser[]> {
    await delay();
    return getAll();
  },

  async getUser(id: string): Promise<FranchiseUser> {
    await delay(150);
    const found = getAll().find(u => u.id === id);
    if (!found) throw new Error(`User ${id} not found`);
    return found;
  },

  async getUsersByPlan(planId: string): Promise<FranchiseUser[]> {
    await delay(200);
    return getAll().filter(u => u.planId === planId);
  },

  async getUsersByGroup(groupId: string): Promise<FranchiseUser[]> {
    await delay(200);
    return getAll().filter(u => u.groupId === groupId);
  },

  async createUser(input: NewUserInput): Promise<FranchiseUser> {
    await delay(400);
    const all = getAll();
    // Capacity check happens in the store/service layer
    const newUser: FranchiseUser = {
      id: `usr-${Date.now()}`,
      ...input,
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
      hasWon: false,
    };
    saveAll([...all, newUser]);
    return newUser;
  },

  async updateUserStatus(id: string, status: UserStatus): Promise<FranchiseUser> {
    await delay(200);
    const all = getAll();
    const idx = all.findIndex(u => u.id === id);
    if (idx === -1) throw new Error(`User ${id} not found`);
    const updated = { ...all[idx], status };
    if (status === 'WINNER' || status === 'INACTIVE') {
      updated.hasWon = true;
    }
    all[idx] = updated;
    saveAll(all);
    return updated;
  },

  async updateUser(id: string, patch: Partial<FranchiseUser>): Promise<FranchiseUser> {
    await delay(200);
    const all = getAll();
    const idx = all.findIndex(u => u.id === id);
    if (idx === -1) throw new Error(`User ${id} not found`);
    const updated = { ...all[idx], ...patch };
    all[idx] = updated;
    saveAll(all);
    return updated;
  },

  /** Batch update multiple users (used after draw execution) */
  async batchUpdateUsers(updates: Array<{ id: string; patch: Partial<FranchiseUser> }>): Promise<void> {
    const all = getAll();
    const map = new Map(all.map((u, i) => [u.id, i]));
    for (const { id, patch } of updates) {
      const idx = map.get(id);
      if (idx !== undefined) {
        all[idx] = { ...all[idx], ...patch };
      }
    }
    saveAll(all);
  },
};
