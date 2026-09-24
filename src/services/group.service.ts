// =============================================================================
// Group Service
// =============================================================================
import type { Group, GroupType, NewGroupInput } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';
import { GROUP_TYPES } from '@/data/generators';

function delay(ms = 300): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
function getAll(): Group[] { return persistence.get<Group[]>(KEYS.GROUPS) ?? []; }
function saveAll(d: Group[]): void { persistence.set(KEYS.GROUPS, d); }

export const groupService = {
  getGroupTypes(): GroupType[] { return GROUP_TYPES; },

  async getFranchiseGroups(franchiseId: string): Promise<Group[]> {
    await delay();
    return getAll().filter(g => g.franchiseId === franchiseId);
  },

  async getAllGroups(): Promise<Group[]> {
    await delay();
    return getAll();
  },

  async getGroup(id: string): Promise<Group> {
    await delay(150);
    const found = getAll().find(g => g.id === id);
    if (!found) throw new Error(`Group ${id} not found`);
    return found;
  },

  async createGroup(input: NewGroupInput): Promise<Group> {
    await delay(350);
    const all = getAll();
    const groupType = GROUP_TYPES.find(t => t.id === input.groupTypeId);
    if (!groupType) throw new Error(`GroupType ${input.groupTypeId} not found`);
    const existing = all.filter(g => g.franchiseId === input.franchiseId && g.groupTypeId === input.groupTypeId);
    if (existing.length > 0 && existing[0].memberCount >= groupType.capacity) {
      throw new Error(`Group ${groupType.name} is at full capacity (${groupType.capacity})`);
    }
    const newGroup: Group = {
      id: `grp-${Date.now()}`,
      franchiseId: input.franchiseId,
      groupTypeId: input.groupTypeId,
      name: input.name,
      memberCount: 0,
      createdAt: new Date().toISOString(),
    };
    saveAll([...all, newGroup]);
    return newGroup;
  },

  async incrementMemberCount(groupId: string): Promise<void> {
    const all = getAll();
    const idx = all.findIndex(g => g.id === groupId);
    if (idx !== -1) {
      all[idx] = { ...all[idx], memberCount: all[idx].memberCount + 1 };
      saveAll(all);
    }
  },

  async decrementMemberCount(groupId: string): Promise<void> {
    const all = getAll();
    const idx = all.findIndex(g => g.id === groupId);
    if (idx !== -1) {
      all[idx] = { ...all[idx], memberCount: Math.max(0, all[idx].memberCount - 1) };
      saveAll(all);
    }
  },
};
