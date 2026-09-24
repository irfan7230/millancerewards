// =============================================================================
// Admin Settings — production-grade, functional platform configuration.
// Tabbed sections: General · Draw Rules · Notifications · Security · Demo & System.
// Settings persist via settingsService (backend-ready). Tracks a dirty state and
// exposes Save / Discard; sensitive/simulation actions are clearly marked.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import {
  Settings as SettingsIcon, Building2, Trophy, Bell, ShieldCheck,
  Save, RotateCcw, Info,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { settingsService } from '@/services/settings.service';
import { useToast } from '@/stores/uiStore';
import type { PlatformSettings } from '@/types';
import { cn, formatDateTime } from '@/lib/utils';

type TabId = 'general' | 'draws' | 'notifications' | 'security' | 'system';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'general',       label: 'General',       icon: Building2 },
  { id: 'draws',         label: 'Draw Rules',    icon: Trophy },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security',      label: 'Security',      icon: ShieldCheck },
];

const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'UTC'];

export default function AdminSettings() {
  const toast = useToast();

  const [tab, setTab] = useState<TabId>('general');
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [draft, setDraft] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const s = await settingsService.getSettings();
      setSettings(s); setDraft(s);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  // Dirty check — enables Save/Discard only when something actually changed.
  const dirty = useMemo(() => {
    if (!settings || !draft) return false;
    return (Object.keys(draft) as (keyof PlatformSettings)[])
      .some(k => k !== 'updatedAt' && draft[k] !== settings[k]);
  }, [settings, draft]);

  const set = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) =>
    setDraft(prev => (prev ? { ...prev, [key]: value } : prev));

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const saved = await settingsService.updateSettings(draft);
      setSettings(saved); setDraft(saved);
      toast.success('Settings saved', 'Your changes have been applied.');
    } catch (e) { toast.error('Save failed', e instanceof Error ? e.message : 'Unknown'); }
    finally { setSaving(false); }
  };

  const discard = () => { if (settings) setDraft(settings); };

  const restoreDefaults = async () => {
    if (!window.confirm('Restore all settings to their defaults?')) return;
    setSaving(true);
    try {
      const s = await settingsService.resetSettings();
      setSettings(s); setDraft(s);
      toast.success('Defaults restored');
    } catch (e) { toast.error('Failed', e instanceof Error ? e.message : 'Unknown'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4">{[1, 2].map(i => <SkeletonCard key={i} />)}</div>;
  if (error || !draft) return <ErrorState description={error ?? 'Settings unavailable'} onRetry={load} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-brand-600" /> Settings
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Platform configuration · last saved {settings && new Date(settings.updatedAt).getTime() > 0 ? formatDateTime(settings.updatedAt) : 'never'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6 items-start">
        {/* Tabs — horizontal scroll on mobile, sidebar on desktop */}
        <nav
          className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible -mx-1 px-1 lg:sticky lg:top-24"
          aria-label="Settings sections"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={tab === id}
              className={cn(
                'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shrink-0',
                tab === id ? 'bg-brand-600 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" /> {label}
            </button>
          ))}
        </nav>

        {/* Panel */}
        <div className="space-y-6 min-w-0">
          {tab === 'general' && (
            <Card>
              <CardHeader><CardTitle>General</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Platform Name" value={draft.platformName} onChange={e => set('platformName', e.target.value)} />
                  <Input label="Support Email" type="email" value={draft.supportEmail} onChange={e => set('supportEmail', e.target.value)} />
                  <Input label="Support Phone" value={draft.supportPhone} onChange={e => set('supportPhone', e.target.value)} />
                  <Select label="Currency" value={draft.currency} onChange={e => set('currency', e.target.value as PlatformSettings['currency'])}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </Select>
                  <Select label="Timezone" value={draft.timezone} onChange={e => set('timezone', e.target.value)}>
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </Select>
                </div>
                <SettingRow
                  title="Member Registration"
                  desc="Allow franchises to onboard new members platform-wide."
                  checked={draft.registrationOpen}
                  onChange={v => set('registrationOpen', v)}
                />
                <SettingRow
                  title="Maintenance Mode"
                  desc="Temporarily disable member-facing portals for maintenance."
                  checked={draft.maintenanceMode}
                  onChange={v => set('maintenanceMode', v)}
                  danger
                />
              </CardContent>
            </Card>
          )}

          {tab === 'draws' && (
            <Card>
              <CardHeader><CardTitle>Draw Rules</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-lg bg-brand-50 border border-brand-100 p-3 text-xs text-brand-800 flex gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  Platform-wide defaults for the auto-processed monthly lucky draw.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Winners per Draw" type="number" min={1} max={50}
                    value={draft.winnersPerDraw}
                    onChange={e => set('winnersPerDraw', clampInt(e.target.value, 1, 50))}
                  />
                  <Input
                    label="Draw Day of Month" type="number" min={1} max={28}
                    value={draft.drawDayOfMonth}
                    onChange={e => set('drawDayOfMonth', clampInt(e.target.value, 1, 28))}
                    helperText="1–28"
                  />
                  <Input
                    label="Payment Due Day" type="number" min={1} max={28}
                    value={draft.paymentDueDayOfMonth}
                    onChange={e => set('paymentDueDayOfMonth', clampInt(e.target.value, 1, 28))}
                    helperText="1–28"
                  />
                </div>
                {draft.paymentDueDayOfMonth >= draft.drawDayOfMonth && (
                  <p className="text-xs text-warning-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Payment due day should be before the draw day so members can pay in time.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {tab === 'notifications' && (
            <Card>
              <CardHeader><CardTitle>Notification Channels</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingRow title="Email Notifications" desc="Payment receipts, draw results, and reminders via email." checked={draft.notifyEmail} onChange={v => set('notifyEmail', v)} />
                <SettingRow title="SMS Notifications" desc="Critical alerts (payment due, prize won) via SMS." checked={draft.notifySms} onChange={v => set('notifySms', v)} />
                <SettingRow title="Push Notifications" desc="In-app and browser push notifications." checked={draft.notifyPush} onChange={v => set('notifyPush', v)} />
              </CardContent>
            </Card>
          )}

          {tab === 'security' && (
            <Card>
              <CardHeader><CardTitle>Security & Compliance</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingRow
                  title="Require KYC at Onboarding"
                  desc="Members must provide PAN + ID and address before activation (needed for payouts)."
                  checked={draft.requireKyc}
                  onChange={v => set('requireKyc', v)}
                />
                <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-xs text-neutral-500 flex gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-neutral-400" />
                  Authentication, role authorization, and audit logging are enforced server-side in production. This prototype uses mock auth (see FUTURE-BACKEND-INTEGRATION.md).
                </div>
              </CardContent>
            </Card>
          )}

          <button
            onClick={restoreDefaults}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-600"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restore defaults
          </button>
        </div>
      </div>

      {/* Sticky save bar — appears only when there are unsaved changes */}
      {dirty && (
        <div className="sticky bottom-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/90 backdrop-blur-md border-t border-neutral-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-neutral-600 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning-500" /> You have unsaved changes
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={discard} disabled={saving}>Discard</Button>
              <Button variant="primary" size="sm" loading={saving} onClick={save} leftIcon={<Save className="h-3.5 w-3.5" />}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── A labeled setting row with a toggle ───────────────────────────────────────
function SettingRow({
  title, desc, checked, onChange, danger,
}: {
  title: string; desc: string; checked: boolean; onChange: (v: boolean) => void; danger?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-4 p-3.5 rounded-xl border',
      danger && checked ? 'border-danger-200 bg-danger-50/40' : 'border-neutral-200',
    )}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-800">{title}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} aria-label={title} />
    </div>
  );
}

function clampInt(raw: string, min: number, max: number): number {
  const n = Math.round(Number(raw) || 0);
  return Math.min(max, Math.max(min, n));
}
