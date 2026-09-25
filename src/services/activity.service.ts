import type { ActivityLogEntry, Role } from '@/types';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

function resolveFranchiseId(provided?: string): string {
  if (provided) return provided;
  const user = useAuthStore.getState().user;
  if (user?.franchiseId) return user.franchiseId;
  throw new Error('Franchise context unavailable: pass franchiseId explicitly or log in.');
}

interface LogInput {
  franchiseId?: string;
  actorRole: Role;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown>;
}

export const activityService = {
  async log(_input: LogInput): Promise<ActivityLogEntry> {
    throw new Error(
      'Client-side activity writes are not supported. Activity logs are emitted by the backend automatically as part of transactional workflows (draws, redemptions, payments, etc.).',
    );
  },

  async getFranchiseLog(franchiseId: string): Promise<ActivityLogEntry[]> {
    const logs = await api.get<ActivityLogEntry[]>(`/core/${resolveFranchiseId(franchiseId)}/activity`);
    return [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getAllLog(): Promise<ActivityLogEntry[]> {
    const user = useAuthStore.getState().user;
    if (user?.franchiseId) {
      return activityService.getFranchiseLog(user.franchiseId);
    }
    return [];
  },
};
