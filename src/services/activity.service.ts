// =============================================================================
// Activity Log Service
// =============================================================================
import type { ActivityLogEntry, Role } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';

function getAll(): ActivityLogEntry[] {
  return persistence.get<ActivityLogEntry[]>(KEYS.ACTIVITY_LOG) ?? [];
}
function saveAll(d: ActivityLogEntry[]): void {
  persistence.set(KEYS.ACTIVITY_LOG, d);
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
  async log(input: LogInput): Promise<ActivityLogEntry> {
    const entry: ActivityLogEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...input,
      createdAt: new Date().toISOString(),
    };
    saveAll([...getAll(), entry]);
    return entry;
  },

  async getFranchiseLog(franchiseId: string): Promise<ActivityLogEntry[]> {
    return getAll()
      .filter(e => e.franchiseId === franchiseId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getAllLog(): Promise<ActivityLogEntry[]> {
    return getAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
