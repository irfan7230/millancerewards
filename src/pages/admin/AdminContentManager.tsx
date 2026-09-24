// =============================================================================
// Admin Content Manager — Landing Page & Portal CMS
// Allows admin to edit hero content, stats, prizes, how-it-works, banners,
// CTA section, and publish portal notices to User/Franchise portals.
// =============================================================================
import React, { useEffect, useState } from 'react';
import {
  Globe, Image, BarChart3, Gift, Zap, MessageSquare, Plus, Trash2,
  Save, RotateCcw, Eye, EyeOff, ChevronUp, ChevronDown, RefreshCw,
  Sparkles, Type, Layout,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/stores/uiStore';
import { cmsService } from '@/services/cms.service';
import type {
  HeroContent, StatItem, PrizeItem, HowStep,
  BannerSlide, CtaSection, PortalNotice,
} from '@/services/cms.service';
import { cn, currentPeriodLabel } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

type TabId = 'hero' | 'stats' | 'prizes' | 'how' | 'banners' | 'cta' | 'notices';

const TABS: { id: TabId; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'hero',    label: 'Hero Section',   icon: Type,         description: 'Headline, badge, and CTA buttons' },
  { id: 'stats',   label: 'Key Stats',      icon: BarChart3,    description: '4 highlight cards below hero' },
  { id: 'prizes',  label: 'Prize Lineup',   icon: Gift,         description: 'Prize cards shown on landing page' },
  { id: 'how',     label: 'How It Works',   icon: Zap,          description: 'Step-by-step process section' },
  { id: 'banners', label: 'Promo Banners',  icon: Image,        description: 'Member portal carousel slides' },
  { id: 'cta',     label: 'CTA Section',    icon: Layout,       description: 'Bottom call-to-action block' },
  { id: 'notices', label: 'Portal Notices', icon: MessageSquare, description: 'Announcements shown in portals' },
];

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function SectionHeader({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 mb-5">
      <div>
        <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
      <label className="text-xs font-semibold text-neutral-600 pt-2">{label}</label>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero editor
// ---------------------------------------------------------------------------

function HeroEditor({ onSaved }: { onSaved: () => void }) {
  const toast = useToast();
  const [data, setData] = useState<HeroContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { cmsService.getHero().then(setData); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    try {
      await cmsService.saveHero(data);
      toast.success('Hero section saved', 'Landing page will reflect changes on next load.');
      onSaved();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const reset = () => setData(cmsService.getHeroDefaults());

  if (!data) return <div className="h-32 animate-pulse bg-neutral-100 rounded-xl" />;

  return (
    <form onSubmit={save} className="space-y-4">
      <SectionHeader title="Hero Section" description="The first section visitors see on the landing page.">
        <Button type="button" variant="ghost" size="sm" onClick={reset} leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>Reset</Button>
      </SectionHeader>

      <FieldRow label="Badge text">
        <Input value={data.badge} onChange={e => setData({ ...data, badge: e.target.value })} placeholder="Millance Savings & Rewards" />
      </FieldRow>
      <FieldRow label="Headline">
        <Input value={data.headline} onChange={e => setData({ ...data, headline: e.target.value })} placeholder="Save Smart. Win Big." />
      </FieldRow>
      <FieldRow label="Subheadline">
        <Textarea value={data.subheadline} onChange={e => setData({ ...data, subheadline: e.target.value })} rows={3} placeholder="Describe your programme in 1–2 sentences." />
      </FieldRow>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldRow label="Primary CTA">
          <Input value={data.primaryCta} onChange={e => setData({ ...data, primaryCta: e.target.value })} />
        </FieldRow>
        <FieldRow label="Secondary CTA">
          <Input value={data.secondaryCta} onChange={e => setData({ ...data, secondaryCta: e.target.value })} />
        </FieldRow>
      </div>
      <FieldRow label="Live draw label">
        <Input value={data.liveLabel} onChange={e => setData({ ...data, liveLabel: e.target.value })} />
      </FieldRow>

      {/* Live preview */}
      <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white mt-4">
        <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{data.badge || 'Badge'}</p>
        <h2 className="text-2xl sm:text-3xl font-black mb-2">{data.headline || 'Headline'}</h2>
        <p className="text-sm opacity-80 mb-4 max-w-lg">{data.subheadline || 'Subheadline...'}</p>
        <div className="flex gap-2 flex-wrap">
          <span className="px-4 py-2 bg-white text-brand-700 rounded-full text-sm font-bold">{data.primaryCta}</span>
          <span className="px-4 py-2 border border-white/40 text-white rounded-full text-sm font-semibold">{data.secondaryCta}</span>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={saving} leftIcon={<Save className="h-4 w-4" />}>Save Hero</Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Stats editor
// ---------------------------------------------------------------------------

function StatsEditor({ onSaved }: { onSaved: () => void }) {
  const toast = useToast();
  const [items, setItems] = useState<StatItem[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { cmsService.getStats().then(setItems); }, []);

  const update = (i: number, patch: Partial<StatItem>) =>
    setItems(prev => prev ? prev.map((s, idx) => idx === i ? { ...s, ...patch } : s) : prev);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items) return;
    setSaving(true);
    try {
      await cmsService.saveStats(items);
      toast.success('Stats updated', 'Visible on landing page on next load.');
      onSaved();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (!items) return <div className="h-32 animate-pulse bg-neutral-100 rounded-xl" />;

  return (
    <form onSubmit={save} className="space-y-4">
      <SectionHeader title="Key Statistics" description="4 highlight cards displayed below the hero section." />
      {items.map((stat, i) => (
        <Card key={i} className="p-4 space-y-3">
          <p className="text-xs font-bold text-neutral-500 uppercase">Card {i + 1}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Value" value={stat.value} onChange={e => update(i, { value: e.target.value })} placeholder="₹1,000+" />
            <Input label="Label" value={stat.label} onChange={e => update(i, { label: e.target.value })} placeholder="Monthly Amount" />
            <Input label="Detail" value={stat.detail} onChange={e => update(i, { detail: e.target.value })} placeholder="No hidden fees" />
          </div>
        </Card>
      ))}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={saving} leftIcon={<Save className="h-4 w-4" />}>Save Stats</Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Prizes editor
// ---------------------------------------------------------------------------

function PrizesEditor({ onSaved }: { onSaved: () => void }) {
  const toast = useToast();
  const [prizes, setPrizes] = useState<PrizeItem[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { cmsService.getPrizes().then(setPrizes); }, []);

  const update = (i: number, patch: Partial<PrizeItem>) =>
    setPrizes(prev => prev ? prev.map((p, idx) => idx === i ? { ...p, ...patch } : p) : prev);

  const add = () => setPrizes(prev => prev ? [...prev, { rank: `RANK ${prev.length + 1}`, title: '', description: '', valueLabel: '', category: '', image: '' }] : prev);
  const remove = (i: number) => setPrizes(prev => prev ? prev.filter((_, idx) => idx !== i) : prev);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prizes) return;
    setSaving(true);
    try {
      await cmsService.savePrizes(prizes);
      toast.success('Prize lineup saved');
      onSaved();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (!prizes) return <div className="h-32 animate-pulse bg-neutral-100 rounded-xl" />;

  return (
    <form onSubmit={save} className="space-y-4">
      <SectionHeader title="Prize Lineup" description="Prizes shown in the landing page prize grid.">
        <Button type="button" variant="secondary" size="sm" onClick={add} leftIcon={<Plus className="h-3.5 w-3.5" />}>Add Prize</Button>
      </SectionHeader>
      {prizes.map((prize, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-neutral-500 uppercase">{prize.rank}</p>
            <button type="button" onClick={() => remove(i)} className="p-1.5 rounded-lg text-danger-500 hover:bg-danger-50"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Rank label" value={prize.rank} onChange={e => update(i, { rank: e.target.value })} />
            <Input label="Category" value={prize.category} onChange={e => update(i, { category: e.target.value })} />
            <Input label="Title" value={prize.title} onChange={e => update(i, { title: e.target.value })} className="sm:col-span-2" />
            <Textarea label="Description" value={prize.description} onChange={e => update(i, { description: e.target.value })} rows={2} className="sm:col-span-2" />
            <Input label="Value label" value={prize.valueLabel} onChange={e => update(i, { valueLabel: e.target.value })} placeholder="Value: ₹1,79,900" />
            <Input label="Image path" value={prize.image} onChange={e => update(i, { image: e.target.value })} placeholder="/images/stitch/hero_iphone.png" />
          </div>
          {prize.image && (
            <img src={prize.image} alt={prize.title} className="h-24 w-24 object-cover rounded-xl border border-neutral-200" onError={e => (e.currentTarget.style.display = 'none')} />
          )}
        </Card>
      ))}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={saving} leftIcon={<Save className="h-4 w-4" />}>Save Prizes</Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// How It Works editor
// ---------------------------------------------------------------------------

function HowEditor({ onSaved }: { onSaved: () => void }) {
  const toast = useToast();
  const [steps, setSteps] = useState<HowStep[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { cmsService.getHowSteps().then(setSteps); }, []);

  const update = (i: number, patch: Partial<HowStep>) =>
    setSteps(prev => prev ? prev.map((s, idx) => idx === i ? { ...s, ...patch } : s) : prev);

  const move = (i: number, dir: -1 | 1) =>
    setSteps(prev => {
      if (!prev) return prev;
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return next;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!steps) return;
    setSaving(true);
    try {
      await cmsService.saveHowSteps(steps);
      toast.success('How It Works steps saved');
      onSaved();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (!steps) return <div className="h-32 animate-pulse bg-neutral-100 rounded-xl" />;

  return (
    <form onSubmit={save} className="space-y-4">
      <SectionHeader title="How It Works" description="Step-by-step explanation section on the landing page." />
      {steps.map((step, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase">Step {i + 1}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === steps.length - 1} className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Step number" value={step.number} onChange={e => update(i, { number: e.target.value })} placeholder="01" />
            <Input label="Title" value={step.title} onChange={e => update(i, { title: e.target.value })} className="sm:col-span-2" />
          </div>
          <Textarea label="Description" value={step.description} onChange={e => update(i, { description: e.target.value })} rows={2} />
        </Card>
      ))}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={saving} leftIcon={<Save className="h-4 w-4" />}>Save Steps</Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Banners editor
// ---------------------------------------------------------------------------

const BG_OPTIONS = [
  { label: 'Brand Blue', value: 'from-brand-600 to-brand-800' },
  { label: 'Purple-Indigo', value: 'from-purple-600 to-indigo-800' },
  { label: 'Gold-Amber', value: 'from-accent-600 to-accent-800' },
  { label: 'Emerald', value: 'from-emerald-600 to-emerald-800' },
  { label: 'Rose', value: 'from-rose-600 to-rose-800' },
];

function BannersEditor({ onSaved }: { onSaved: () => void }) {
  const toast = useToast();
  const [banners, setBanners] = useState<BannerSlide[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { cmsService.getBanners().then(setBanners); }, []);

  const update = (i: number, patch: Partial<BannerSlide>) =>
    setBanners(prev => prev ? prev.map((b, idx) => idx === i ? { ...b, ...patch } : b) : prev);

  const add = () => setBanners(prev => prev ? [...prev, { id: `b${Date.now()}`, title: 'New Banner', subtitle: '', cta: 'Learn More', ctaLink: '/login', bgClass: 'from-brand-600 to-brand-800', published: false }] : prev);
  const remove = (i: number) => setBanners(prev => prev ? prev.filter((_, idx) => idx !== i) : prev);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banners) return;
    setSaving(true);
    try {
      await cmsService.saveBanners(banners);
      toast.success('Banners saved', 'Visible in member portal carousel.');
      onSaved();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (!banners) return <div className="h-32 animate-pulse bg-neutral-100 rounded-xl" />;

  return (
    <form onSubmit={save} className="space-y-4">
      <SectionHeader title="Promo Banners" description="Slides shown in the member portal dashboard carousel.">
        <Button type="button" variant="secondary" size="sm" onClick={add} leftIcon={<Plus className="h-3.5 w-3.5" />}>Add Slide</Button>
      </SectionHeader>
      {banners.map((b, i) => (
        <Card key={b.id} className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-500 uppercase">Slide {i + 1}</span>
              <Badge variant={b.published ? 'success' : 'default'}>{b.published ? 'Published' : 'Draft'}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => update(i, { published: !b.published })} className={cn('h-7 px-3 rounded-full text-xs font-semibold transition-colors', b.published ? 'bg-success-50 text-success-700 hover:bg-success-100' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200')}>
                {b.published ? <><EyeOff className="h-3 w-3 inline mr-1" />Unpublish</> : <><Eye className="h-3 w-3 inline mr-1" />Publish</>}
              </button>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded-lg text-danger-500 hover:bg-danger-50"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          {/* Preview */}
          <div className={cn('rounded-xl bg-gradient-to-r p-4 text-white', b.bgClass)}>
            <p className="font-bold text-sm">{b.title || 'Title'}</p>
            <p className="text-xs opacity-80">{b.subtitle || 'Subtitle'}</p>
            <span className="mt-2 inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">{b.cta}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Title" value={b.title} onChange={e => update(i, { title: e.target.value })} />
            <Input label="CTA text" value={b.cta} onChange={e => update(i, { cta: e.target.value })} />
            <Input label="Subtitle" value={b.subtitle} onChange={e => update(i, { subtitle: e.target.value })} className="sm:col-span-2" />
            <Input label="CTA link" value={b.ctaLink} onChange={e => update(i, { ctaLink: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Background</label>
              <select value={b.bgClass} onChange={e => update(i, { bgClass: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                {BG_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </Card>
      ))}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={saving} leftIcon={<Save className="h-4 w-4" />}>Save Banners</Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// CTA editor
// ---------------------------------------------------------------------------

function CtaEditor({ onSaved }: { onSaved: () => void }) {
  const toast = useToast();
  const [data, setData] = useState<CtaSection | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { cmsService.getCta().then(setData); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    try {
      await cmsService.saveCta(data);
      toast.success('CTA section saved');
      onSaved();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (!data) return <div className="h-32 animate-pulse bg-neutral-100 rounded-xl" />;

  return (
    <form onSubmit={save} className="space-y-4">
      <SectionHeader title="CTA Section" description="Bottom call-to-action block on the landing page." />
      <Input label="Headline" value={data.headline} onChange={e => setData({ ...data, headline: e.target.value })} />
      <Textarea label="Subheadline" value={data.subheadline} onChange={e => setData({ ...data, subheadline: e.target.value })} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Primary CTA" value={data.primaryCta} onChange={e => setData({ ...data, primaryCta: e.target.value })} />
        <Input label="Secondary CTA" value={data.secondaryCta} onChange={e => setData({ ...data, secondaryCta: e.target.value })} />
      </div>
      {/* Preview */}
      <div className="rounded-xl border border-neutral-200 bg-gradient-to-r from-brand-600 to-accent-500 p-8 text-white text-center mt-2">
        <h3 className="text-xl font-black mb-1">{data.headline || 'CTA Headline'}</h3>
        <p className="text-sm opacity-80 mb-4">{data.subheadline}</p>
        <div className="flex justify-center gap-2 flex-wrap">
          <span className="px-5 py-2 bg-white text-brand-700 rounded-full text-sm font-bold">{data.primaryCta}</span>
          <span className="px-5 py-2 border border-white/30 text-white rounded-full text-sm">{data.secondaryCta}</span>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={saving} leftIcon={<Save className="h-4 w-4" />}>Save CTA</Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Portal Notices editor
// ---------------------------------------------------------------------------

const NOTICE_TYPES = ['info', 'warning', 'success'] as const;
const AUDIENCES = ['all', 'user', 'franchise'] as const;

function NoticesEditor({ onSaved }: { onSaved: () => void }) {
  const toast = useToast();
  const [notices, setNotices] = useState<PortalNotice[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<PortalNotice>>({ audience: 'all', type: 'info', published: true });
  const [saving, setSaving] = useState(false);

  const load = () => cmsService.getNotices().then(setNotices);
  useEffect(() => { void load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) { toast.error('Title and message are required'); return; }
    setSaving(true);
    try {
      const notice: PortalNotice = {
        id: `notice-${Date.now()}`,
        audience: form.audience ?? 'all',
        type: form.type ?? 'info',
        title: form.title,
        message: form.message,
        published: form.published ?? true,
        createdAt: new Date().toISOString(),
      };
      await cmsService.saveNotice(notice);
      toast.success('Notice published');
      setForm({ audience: 'all', type: 'info', published: true });
      setCreating(false);
      void load();
      onSaved();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const toggle = async (n: PortalNotice) => {
    try {
      await cmsService.saveNotice({ ...n, published: !n.published });
      void load();
    } catch { toast.error('Update failed'); }
  };

  const del = async (id: string) => {
    try {
      await cmsService.deleteNotice(id);
      toast.success('Notice deleted');
      void load();
    } catch { toast.error('Delete failed'); }
  };

  const TYPE_COLORS: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };

  if (!notices) return <div className="h-32 animate-pulse bg-neutral-100 rounded-xl" />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Portal Notices" description="Announcements displayed inside the User and Franchise portals.">
        <Button type="button" variant="primary" size="sm" onClick={() => setCreating(true)} leftIcon={<Plus className="h-3.5 w-3.5" />}>New Notice</Button>
      </SectionHeader>

      {creating && (
        <Card className="p-5 border-brand-200 bg-brand-50/30">
          <form onSubmit={save} className="space-y-3">
            <p className="text-sm font-bold text-neutral-900 mb-3">Create Notice</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Audience</label>
                <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value as PortalNotice['audience'] })} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                  {AUDIENCES.map(a => <option key={a} value={a}>{a === 'all' ? 'All portals' : a === 'user' ? 'User Portal' : 'Franchise Portal'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as PortalNotice['type'] })} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                  {NOTICE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <Input label="Title" required value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea label="Message" required value={form.message ?? ''} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} />
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={saving} leftIcon={<Save className="h-4 w-4" />}>Publish</Button>
            </div>
          </form>
        </Card>
      )}

      {notices.length === 0 && !creating && (
        <div className="py-12 text-center text-neutral-400">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No notices yet. Create one to broadcast messages to your portals.</p>
        </div>
      )}

      <div className="space-y-3">
        {notices.map(n => (
          <div key={n.id} className={cn('rounded-xl border p-4 flex items-start gap-4', TYPE_COLORS[n.type] ?? TYPE_COLORS.info, !n.published && 'opacity-50')}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-bold uppercase">{n.type}</span>
                <span className="text-xs">·</span>
                <span className="text-xs font-semibold">{n.audience === 'all' ? 'All Portals' : n.audience === 'user' ? 'User Portal' : 'Franchise Portal'}</span>
                {!n.published && <Badge variant="default">Draft</Badge>}
              </div>
              <p className="text-sm font-bold">{n.title}</p>
              <p className="text-xs mt-0.5 opacity-80">{n.message}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button type="button" onClick={() => toggle(n)} title={n.published ? 'Unpublish' : 'Publish'} className="p-1.5 rounded-lg hover:bg-black/10">
                {n.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button type="button" onClick={() => del(n.id)} title="Delete" className="p-1.5 rounded-lg hover:bg-black/10 text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminContentManager() {
  const [tab, setTab] = useState<TabId>('hero');
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  const onSaved = () => setPublishedAt(new Date().toLocaleTimeString('en-IN'));

  const activeTab = TABS.find(t => t.id === tab)!;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600 mb-1">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Content Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">CMS Editor</h1>
          <p className="text-sm text-neutral-500 mt-1">Edit and publish content across Landing Page and portals · Period: {currentPeriodLabel()}</p>
        </div>
        {publishedAt && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success-50 border border-success-200">
            <RefreshCw className="h-3.5 w-3.5 text-success-600" />
            <span className="text-xs font-semibold text-success-700">Last saved at {publishedAt}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <aside className="lg:w-56 shrink-0">
          <nav className="space-y-1" aria-label="Content sections">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150',
                    tab === t.id
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                      : 'text-neutral-600 hover:bg-neutral-100',
                  )}
                >
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{t.label}</p>
                    <p className={cn('text-[11px] mt-0.5 truncate', tab === t.id ? 'text-white/70' : 'text-neutral-400')}>{t.description}</p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Quick-link to landing page */}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-neutral-300 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-semibold">Preview Landing Page</span>
          </a>
        </aside>

        {/* Content panel */}
        <div className="flex-1 min-w-0">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-neutral-100">
              {React.createElement(activeTab.icon, { className: 'h-4 w-4 text-brand-500' })}
              <h2 className="text-sm font-bold text-neutral-900">{activeTab.label}</h2>
            </div>

            {tab === 'hero'    && <HeroEditor    onSaved={onSaved} />}
            {tab === 'stats'   && <StatsEditor   onSaved={onSaved} />}
            {tab === 'prizes'  && <PrizesEditor  onSaved={onSaved} />}
            {tab === 'how'     && <HowEditor     onSaved={onSaved} />}
            {tab === 'banners' && <BannersEditor onSaved={onSaved} />}
            {tab === 'cta'     && <CtaEditor     onSaved={onSaved} />}
            {tab === 'notices' && <NoticesEditor onSaved={onSaved} />}
          </Card>
        </div>
      </div>
    </div>
  );
}
