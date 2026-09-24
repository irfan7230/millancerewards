// =============================================================================
// Admin Coupons & Offers — Full CRUD for discount coupons
// Admins can create, edit, toggle, and delete coupon codes.
// Each coupon supports flat/percentage/free discounts with scope filtering
// (franchise / group / plan / user) and time/usage constraints.
// =============================================================================
import { useEffect, useState, useCallback } from 'react';
import {
  Tag, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw,
  Percent, IndianRupee, Gift, Copy, Check,
  ChevronDown, ChevronUp, Search,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useToast } from '@/stores/uiStore';
import { couponService } from '@/services/coupon.service';
import type { Coupon, CouponType } from '@/services/coupon.service';
import { cn, formatDate } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────

function typeIcon(t: CouponType) {
  if (t === 'flat') return <IndianRupee className="h-3.5 w-3.5" />;
  if (t === 'percentage') return <Percent className="h-3.5 w-3.5" />;
  return <Gift className="h-3.5 w-3.5" />;
}

function typeLabel(c: Coupon) {
  if (c.type === 'flat') return `₹${c.value} off`;
  if (c.type === 'percentage') return `${c.value}%${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''} off`;
  return 'Free';
}

function isExpired(c: Coupon) { return new Date() > new Date(c.validTo); }
function isScheduled(c: Coupon) { return new Date() < new Date(c.validFrom); }

// ── Create/Edit form ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  code: '',
  type: 'flat' as CouponType,
  value: 100,
  maxDiscount: '',
  description: '',
  franchiseId: '',
  groupId: '',
  planId: '',
  userId: '',
  usageLimit: '',
  maxUsesPerUser: 1,
  minOrderAmount: 0,
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: new Date(Date.now() + 90 * 86400_000).toISOString().slice(0, 10),
  active: true,
};
type FormState = typeof EMPTY_FORM;

function CouponForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<FormState>;
  onSubmit: (data: FormState) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const f = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-5">
      {/* Code & Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">Coupon Code *</label>
          <input
            value={form.code}
            onChange={e => f('code', e.target.value.toUpperCase())}
            placeholder="e.g. WELCOME100"
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 uppercase"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">Discount Type *</label>
          <div className="flex gap-2">
            {(['flat', 'percentage', 'free'] as CouponType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => f('type', t)}
                className={cn(
                  'flex-1 h-10 rounded-lg border text-xs font-semibold capitalize transition-colors',
                  form.type === t
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'border-neutral-200 text-neutral-600 hover:border-brand-400',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Value row (hidden for free) */}
      {form.type !== 'free' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">
              {form.type === 'flat' ? 'Discount Amount (₹) *' : 'Discount Percentage (%) *'}
            </label>
            <input
              type="number"
              min={1}
              value={form.value}
              onChange={e => f('value', Number(e.target.value))}
              className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          {form.type === 'percentage' && (
            <div>
              <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">Max Discount Cap (₹)</label>
              <input
                type="number"
                min={0}
                value={form.maxDiscount}
                onChange={e => f('maxDiscount', e.target.value)}
                placeholder="No cap"
                className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">Description (shown to user) *</label>
        <input
          value={form.description}
          onChange={e => f('description', e.target.value)}
          placeholder="e.g. ₹100 off your first payment"
          className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        />
      </div>

      {/* Validity dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">Valid From *</label>
          <input
            type="date"
            value={form.validFrom}
            onChange={e => f('validFrom', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">Valid To *</label>
          <input
            type="date"
            value={form.validTo}
            onChange={e => f('validTo', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Usage constraints */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">Total Usage Limit</label>
          <input
            type="number"
            min={1}
            value={form.usageLimit}
            onChange={e => f('usageLimit', e.target.value)}
            placeholder="Unlimited"
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">Uses Per User</label>
          <input
            type="number"
            min={1}
            value={form.maxUsesPerUser}
            onChange={e => f('maxUsesPerUser', Number(e.target.value))}
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">Min Order (₹)</label>
          <input
            type="number"
            min={0}
            value={form.minOrderAmount}
            onChange={e => f('minOrderAmount', Number(e.target.value))}
            placeholder="0 = no minimum"
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Scope (optional) */}
      <details className="group">
        <summary className="cursor-pointer text-xs font-semibold text-neutral-500 select-none flex items-center gap-1.5 py-2 hover:text-neutral-700 transition-colors list-none">
          <ChevronDown className="h-3.5 w-3.5 group-open:hidden" />
          <ChevronUp className="h-3.5 w-3.5 hidden group-open:block" />
          Scope Restrictions (optional — leave blank for global)
        </summary>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
          {[
            { key: 'franchiseId', label: 'Franchise ID' },
            { key: 'groupId', label: 'Group ID' },
            { key: 'planId', label: 'Plan ID' },
            { key: 'userId', label: 'User ID (single-user gift)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">{label}</label>
              <input
                value={form[key as keyof FormState] as string}
                onChange={e => f(key as keyof FormState, e.target.value as never)}
                placeholder="Leave blank for any"
                className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
          ))}
        </div>
      </details>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => f('active', !form.active)}
          className={cn(
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
            form.active ? 'bg-brand-600' : 'bg-neutral-300',
          )}
        >
          <span className={cn('pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200', form.active ? 'translate-x-5' : 'translate-x-0')} />
        </button>
        <span className="text-sm font-medium text-neutral-700">{form.active ? 'Active — users can apply this coupon' : 'Inactive — hidden from users'}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button
          variant="primary"
          loading={loading}
          onClick={() => onSubmit(form)}
          className="flex-1"
          disabled={!form.code || !form.description || !form.validFrom || !form.validTo}
        >
          Save Coupon
        </Button>
      </div>
    </div>
  );
}

// ── Coupon row card ──────────────────────────────────────────────────────────

function CouponCard({
  coupon,
  onToggle,
  onDelete,
}: {
  coupon: Coupon;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const expired = isExpired(coupon);
  const scheduled = isScheduled(coupon);

  const copy = () => {
    void navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusBadge = () => {
    if (expired) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-500">Expired</span>;
    if (scheduled) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600">Scheduled</span>;
    if (!coupon.active) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-500">Inactive</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">Active</span>;
  };

  return (
    <div className={cn(
      'bg-white rounded-2xl border p-4 sm:p-5 transition-all',
      coupon.active && !expired && !scheduled ? 'border-neutral-200 hover:border-brand-300 hover:shadow-sm' : 'border-neutral-100 opacity-75',
    )}>
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          {typeIcon(coupon.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <button
              onClick={copy}
              className="font-mono font-bold text-sm text-neutral-900 hover:text-brand-600 transition-colors flex items-center gap-1.5"
            >
              {coupon.code}
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3 w-3 text-neutral-400" />}
            </button>
            {statusBadge()}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-600">
              {typeLabel(coupon)}
            </span>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">{coupon.description}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="rounded-xl bg-neutral-50 p-2.5">
          <p className="text-[10px] text-neutral-400 mb-0.5">Used</p>
          <p className="text-sm font-bold text-neutral-800">
            {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
          </p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-2.5">
          <p className="text-[10px] text-neutral-400 mb-0.5">Min Order</p>
          <p className="text-sm font-bold text-neutral-800">
            {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : 'None'}
          </p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-2.5">
          <p className="text-[10px] text-neutral-400 mb-0.5">Valid From</p>
          <p className="text-[11px] font-semibold text-neutral-700">{formatDate(coupon.validFrom)}</p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-2.5">
          <p className="text-[10px] text-neutral-400 mb-0.5">Valid To</p>
          <p className={cn('text-[11px] font-semibold', expired ? 'text-red-500' : 'text-neutral-700')}>
            {formatDate(coupon.validTo)}
          </p>
        </div>
      </div>

      {/* Scope tags */}
      {(coupon.franchiseId || coupon.groupId || coupon.planId || coupon.userId) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {coupon.franchiseId && <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-600">Franchise: {coupon.franchiseId}</span>}
          {coupon.groupId && <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-600">Group: {coupon.groupId}</span>}
          {coupon.planId && <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-50 text-cyan-600">Plan: {coupon.planId}</span>}
          {coupon.userId && <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-600">User: {coupon.userId}</span>}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
            coupon.active ? 'text-neutral-600 hover:bg-neutral-100' : 'text-brand-600 hover:bg-brand-50',
          )}
        >
          {coupon.active
            ? <><ToggleRight className="h-4 w-4 text-brand-500" />Deactivate</>
            : <><ToggleLeft className="h-4 w-4 text-neutral-400" />Activate</>}
        </button>
        <button
          onClick={onDelete}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />Delete
        </button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AdminCoupons() {
  const toast = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      await couponService.seedDefaults();
      setCoupons(await couponService.getAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load coupons');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleCreate = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    try {
      await couponService.create({
        code: form.code,
        type: form.type,
        value: form.value,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        description: form.description,
        franchiseId: form.franchiseId || undefined,
        groupId: form.groupId || undefined,
        planId: form.planId || undefined,
        userId: form.userId || undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        maxUsesPerUser: form.maxUsesPerUser,
        minOrderAmount: form.minOrderAmount,
        validFrom: new Date(form.validFrom).toISOString(),
        validTo: new Date(form.validTo + 'T23:59:59').toISOString(),
        active: form.active,
      });
      toast.success('Coupon created', `${form.code} is ready to use`);
      setShowForm(false);
      await load();
    } catch (e) {
      toast.error('Failed', e instanceof Error ? e.message : 'Unknown error');
    } finally { setSaving(false); }
  };

  const handleToggle = async (c: Coupon) => {
    try {
      await couponService.toggleActive(c.id);
      toast.success(c.active ? 'Deactivated' : 'Activated', c.code);
      await load();
    } catch { toast.error('Failed to update coupon'); }
  };

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"? This cannot be undone.`)) return;
    try {
      await couponService.delete(c.id);
      toast.success('Deleted', `Coupon ${c.code} removed`);
      await load();
    } catch { toast.error('Failed to delete coupon'); }
  };

  const now = new Date();
  const filtered = coupons
    .filter(c => {
      if (search && !c.code.includes(search.toUpperCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'active') return c.active && now <= new Date(c.validTo) && now >= new Date(c.validFrom);
      if (filter === 'inactive') return !c.active;
      if (filter === 'expired') return now > new Date(c.validTo);
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.active && now <= new Date(c.validTo)).length,
    totalUsed: coupons.reduce((s, c) => s + c.usedCount, 0),
    expired: coupons.filter(c => now > new Date(c.validTo)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 flex items-center gap-2">
            <Tag className="h-7 w-7 text-brand-600" />
            Coupons &amp; Offers
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">Create and manage discount codes for payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={load}>Refresh</Button>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>New Coupon</Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Coupons', value: stats.total, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Active', value: stats.active, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Redeemed', value: stats.totalUsed, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Expired', value: stats.expired, color: 'text-neutral-500', bg: 'bg-neutral-100' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-2xl border border-neutral-200 bg-white p-4')}>
            <p className="text-xs text-neutral-500 mb-1">{s.label}</p>
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-4 border-b border-neutral-100 mb-5">
            <CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" />Create New Coupon</CardTitle>
          </CardHeader>
          <CouponForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={saving} />
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search coupons…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'inactive', 'expired'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 h-10 rounded-xl text-xs font-semibold capitalize transition-colors border',
                filter === f ? 'bg-brand-600 text-white border-brand-600' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search ? 'No coupons match your search' : 'No coupons yet'}
          icon={<Tag className="h-6 w-6" />}
          description={search ? 'Try a different search term' : 'Create your first coupon to get started'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(c => (
            <CouponCard
              key={c.id}
              coupon={c}
              onToggle={() => handleToggle(c)}
              onDelete={() => handleDelete(c)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
