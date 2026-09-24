// =============================================================================
// Notification Service
// =============================================================================
import type { NotificationEvent, NotificationKind, Role } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';

function getAll(): NotificationEvent[] {
  return persistence.get<NotificationEvent[]>(KEYS.NOTIFICATIONS) ?? [];
}
function saveAll(d: NotificationEvent[]): void {
  persistence.set(KEYS.NOTIFICATIONS, d);
}

interface EmitInput {
  audienceRole: Role;
  franchiseId?: string;
  userId?: string;
  kind: NotificationKind;
  message: string;
}

export const notificationService = {
  async emit(input: EmitInput): Promise<NotificationEvent> {
    const notification: NotificationEvent = {
      id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...input,
      createdAt: new Date().toISOString(),
      read: false,
    };
    saveAll([...getAll(), notification]);
    return notification;
  },

  async getForUser(userId: string, franchiseId?: string): Promise<NotificationEvent[]> {
    return getAll().filter(
      n =>
        (n.audienceRole === 'user' && n.userId === userId) ||
        (n.audienceRole === 'franchise' && n.franchiseId === franchiseId && !n.userId),
    );
  },

  async getForFranchise(franchiseId: string): Promise<NotificationEvent[]> {
    return getAll().filter(
      n => n.audienceRole === 'franchise' && n.franchiseId === franchiseId,
    );
  },

  async getForAdmin(): Promise<NotificationEvent[]> {
    return getAll().filter(n => n.audienceRole === 'super_admin');
  },

  async markRead(id: string): Promise<void> {
    const all = getAll();
    const idx = all.findIndex(n => n.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], read: true };
      saveAll(all);
    }
  },

  async markAllRead(userId?: string, franchiseId?: string): Promise<void> {
    const all = getAll();
    const updated = all.map(n => {
      if (userId && n.userId === userId) return { ...n, read: true };
      if (franchiseId && n.franchiseId === franchiseId && !n.userId) return { ...n, read: true };
      return n;
    });
    saveAll(updated);
  },

  async getUnreadCount(userId?: string, franchiseId?: string): Promise<number> {
    const all = getAll();
    return all.filter(n => {
      if (n.read) return false;
      if (userId) return n.userId === userId || (n.audienceRole === 'franchise' && n.franchiseId === franchiseId);
      if (franchiseId) return n.franchiseId === franchiseId;
      return false;
    }).length;
  },
};
