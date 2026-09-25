import type { PlatformSettings } from '@/types';
import { api } from '@/lib/api/client';

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'Millance',
  supportEmail: 'support@millance.in',
  supportPhone: '1800-123-4567',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  maintenanceMode: false,
  registrationOpen: true,

  winnersPerDraw: 10,
  drawDayOfMonth: 28,
  paymentDueDayOfMonth: 25,
  voucherValidHours: 24,

  notifyEmail: true,
  notifySms: true,
  notifyPush: false,

  requireKyc: true,

  updatedAt: new Date(0).toISOString(),
};

export const settingsService = {
  async getSettings(): Promise<PlatformSettings> {
    try {
      const stored = await api.get<Partial<PlatformSettings>>('/core/settings');
      return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  async updateSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const stored = await api.patch<PlatformSettings>('/core/settings', patch);
    return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  },

  async resetSettings(): Promise<PlatformSettings> {
    return settingsService.updateSettings({ ...DEFAULT_SETTINGS });
  },
};
