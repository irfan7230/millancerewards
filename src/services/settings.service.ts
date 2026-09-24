// =============================================================================
// Settings Service — admin-configurable platform settings.
// Backed by the persistence adapter (localStorage now). Backend-ready: the same
// getSettings/updateSettings signatures map onto a future /api/settings endpoint.
// =============================================================================
import type { PlatformSettings } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';

function delay(ms = 250): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

export const DEFAULT_SETTINGS: PlatformSettings = {
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

  notifyEmail: true,
  notifySms: true,
  notifyPush: false,

  requireKyc: true,

  updatedAt: new Date(0).toISOString(),
};

export const settingsService = {
  async getSettings(): Promise<PlatformSettings> {
    await delay();
    const stored = persistence.get<Partial<PlatformSettings>>(KEYS.SETTINGS);
    // Merge with defaults so new fields added later still resolve.
    return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  },

  async updateSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
    await delay(400);
    const current = await settingsService.getSettings();
    const next: PlatformSettings = { ...current, ...patch, updatedAt: new Date().toISOString() };
    persistence.set(KEYS.SETTINGS, next);
    return next;
  },

  async resetSettings(): Promise<PlatformSettings> {
    await delay(300);
    const next = { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
    persistence.set(KEYS.SETTINGS, next);
    return next;
  },
};
