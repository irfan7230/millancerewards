import type { Group, GroupType, NewGroupInput } from '@/types';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

function resolveFranchiseId(provided?: string): string {
  if (provided) return provided;
  const user = useAuthStore.getState().user;
  if (user?.franchiseId) return user.franchiseId;
  throw new Error('Franchise context unavailable: pass franchiseId explicitly or log in.');
}

export const groupService = {
  async getGroupTypes(): Promise<GroupType[]> {
    return api.get<GroupType[]>('/core/group-types');
  },

  async getFranchiseGroups(franchiseId: string): Promise<Group[]> {
    return api.get<Group[]>(`/core/${resolveFranchiseId(franchiseId)}/groups`);
  },

  async getAllGroups(): Promise<Group[]> {
    return api.get<Group[]>('/admin/groups');
  },

  async getGroup(id: string, franchiseId?: string): Promise<Group> {
    return api.get<Group>(`/core/${resolveFranchiseId(franchiseId)}/groups/${id}`);
  },

  async createGroup(input: NewGroupInput): Promise<Group> {
    return api.post<Group>(`/core/${input.franchiseId}/groups`, input);
  },

  async incrementMemberCount(_groupId: string): Promise<void> {
    // Backend updates member counts transactionally as part of user create/delete flows.
  },

  async decrementMemberCount(_groupId: string): Promise<void> {
    // Backend updates member counts transactionally as part of user create/delete flows.
  },
};
