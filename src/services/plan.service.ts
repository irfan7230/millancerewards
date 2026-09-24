// =============================================================================
// Plan Service
// =============================================================================
import type { Plan, NewPlanInput } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';

function delay(ms = 300): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
function getAll(): Plan[] { return persistence.get<Plan[]>(KEYS.PLANS) ?? []; }
function saveAll(d: Plan[]): void { persistence.set(KEYS.PLANS, d); }

export const planService = {
  async getFranchisePlans(franchiseId: string): Promise<Plan[]> {
    await delay();
    return getAll().filter(p => p.franchiseId === franchiseId);
  },

  async getAllPlans(): Promise<Plan[]> {
    await delay();
    return getAll();
  },

  async getPlan(id: string): Promise<Plan> {
    await delay(150);
    const found = getAll().find(p => p.id === id);
    if (!found) throw new Error(`Plan ${id} not found`);
    return found;
  },

  async getGroupPlans(groupId: string): Promise<Plan[]> {
    await delay(200);
    return getAll().filter(p => p.groupId === groupId);
  },

  async createPlan(input: NewPlanInput): Promise<Plan> {
    await delay(400);
    const endDate = new Date(input.startDate);
    endDate.setMonth(endDate.getMonth() + input.durationMonths);
    const newPlan: Plan = {
      id: `plan-${crypto.randomUUID()}`,
      ...input,
      totalAmount: input.monthlyAmount * input.durationMonths,
      status: 'active',
      endDate: endDate.toISOString(),
      currentMonth: 1,
    };
    saveAll([...getAll(), newPlan]);
    return newPlan;
  },

  async updatePlan(id: string, patch: Partial<Plan>): Promise<Plan> {
    await delay(250);
    const all = getAll();
    const idx = all.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Plan ${id} not found`);
    const updated = { ...all[idx], ...patch };
    all[idx] = updated;
    saveAll(all);
    return updated;
  },

  /** Called by demoClockStore.advanceMonth — updates currentMonth for all active plans */
  async advancePlanMonths(franchiseIds?: string[]): Promise<void> {
    const all = getAll();
    const updated = all.map(p => {
      if (franchiseIds && !franchiseIds.includes(p.franchiseId)) return p;
      if (p.status !== 'active') return p;
      const newMonth = p.currentMonth + 1;
      const completed = newMonth > p.durationMonths;
      return {
        ...p,
        currentMonth: newMonth,
        status: completed ? ('completed' as const) : ('active' as const),
      };
    });
    saveAll(updated);
  },
};
