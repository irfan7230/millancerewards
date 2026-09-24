// =============================================================================
// Prize Service
// =============================================================================
import type { Prize } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';

function delay(ms = 200): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
function getAll(): Prize[] { return persistence.get<Prize[]>(KEYS.PRIZES) ?? []; }
function saveAll(d: Prize[]): void { persistence.set(KEYS.PRIZES, d); }

export const prizeService = {
  async getFranchisePrizes(franchiseId: string): Promise<Prize[]> {
    await delay();
    return getAll().filter(p => p.franchiseId === franchiseId);
  },

  async getAllPrizes(): Promise<Prize[]> {
    await delay();
    return getAll();
  },

  async getPrize(id: string): Promise<Prize> {
    const found = getAll().find(p => p.id === id);
    if (!found) throw new Error(`Prize ${id} not found`);
    return found;
  },

  async createPrize(prize: Omit<Prize, 'id'>): Promise<Prize> {
    await delay(300);
    const newPrize: Prize = { ...prize, id: `prz-${crypto.randomUUID()}` };
    saveAll([...getAll(), newPrize]);
    return newPrize;
  },

  async updatePrize(id: string, patch: Partial<Prize>): Promise<Prize> {
    await delay(200);
    const all = getAll();
    const idx = all.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Prize ${id} not found`);
    all[idx] = { ...all[idx], ...patch };
    saveAll(all);
    return all[idx];
  },

  async deletePrize(id: string): Promise<void> {
    await delay(200);
    saveAll(getAll().filter(p => p.id !== id));
  },
};
