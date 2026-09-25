import type { NotificationEvent, NotificationKind, Role } from '@/types';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

interface EmitInput {
  audienceRole: Role;
  franchiseId?: string;
  userId?: string;
  kind: NotificationKind;
  message: string;
}

export const notificationService = {
  async emit(_input: EmitInput): Promise<NotificationEvent> {
    throw new Error(
      'Client-side notification emission is not supported. Notifications are generated and broadcast by the backend automatically as part of draw, payment, and voucher workflows.',
    );
  },

  async getForUser(_userId: string, franchiseId?: string): Promise<NotificationEvent[]> {
    const res = await api.get<NotificationEvent[]>('/core/notifications/user');
    const state = useAuthStore.getState();
    const currentUser = state.user;
    return res.filter(
      (n) =>
        (n.audienceRole === 'user' && (!n.userId || !currentUser || n.userId === currentUser.id)) ||
        (n.audienceRole === 'franchise' && n.franchiseId === franchiseId && !n.userId),
    );
  },

  async getForFranchise(franchiseId: string): Promise<NotificationEvent[]> {
    const res = await api.get<NotificationEvent[]>('/core/notifications/admin');
    return res.filter((n) => n.audienceRole === 'franchise' && n.franchiseId === franchiseId);
  },

  async getForAdmin(): Promise<NotificationEvent[]> {
    const res = await api.get<NotificationEvent[]>('/core/notifications/admin');
    return res.filter((n) => n.audienceRole === 'super_admin');
  },

  async markRead(id: string): Promise<void> {
    await api.patch<void>(`/core/notifications/${id}/read`);
  },

  async markAllRead(userId?: string, franchiseId?: string): Promise<void> {
    let list: NotificationEvent[] = [];
    if (userId) list = await notificationService.getForUser(userId, franchiseId);
    else if (franchiseId) list = await notificationService.getForFranchise(franchiseId);
    await Promise.all(list.filter((n) => !n.read).map((n) => notificationService.markRead(n.id)));
  },

  async getUnreadCount(userId?: string, franchiseId?: string): Promise<number> {
    let list: NotificationEvent[] = [];
    if (userId) list = await notificationService.getForUser(userId, franchiseId);
    else if (franchiseId) list = await notificationService.getForFranchise(franchiseId);
    return list.filter((n) => !n.read).length;
  },
};
