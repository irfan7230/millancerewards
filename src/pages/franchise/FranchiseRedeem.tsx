// =============================================================================
// Franchise Redeem — in-store voucher validation & billing counter.
// Staff scan/enter a member's voucher code → validate → see member + authorized
// value → enter the bill amount → confirm, which deducts the member's vault and
// marks the voucher redeemed. Also lists recent voucher activity for the store.
// Backend-ready: all logic lives in voucherService.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import {
  QrCode, ScanLine, CheckCircle2, XCircle, Wallet, User as UserIcon,
  ShieldCheck, Clock, RotateCcw, Store,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { voucherService, type ValidateResult } from '@/services/voucher.service';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';
import type { Voucher, FranchiseUser } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

type Stage = 'scan' | 'validated' | 'done';

export default function FranchiseRedeem() {
  const { user } = useAuthStore();
  const franchiseId = user?.franchiseId ?? '';
  const toast = useToast();

  const [code, setCode] = useState('');
  const [stage, setStage] = useState<Stage>('scan');
  const [checking, setChecking] = useState(false);
  const [validation, setValidation] = useState<ValidateResult | null>(null);
  const [member, setMember] = useState<FranchiseUser | null>(null);
  const [bill, setBill] = useState<number>(0);
  const [redeeming, setRedeeming] = useState(false);
  const [receipt, setReceipt] = useState<Voucher | null>(null);

  const [recent, setRecent] = useState<Voucher[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const loadRecent = async () => {
    setLoadingRecent(true);
    try { setRecent(await voucherService.getFranchiseVouchers(franchiseId)); }
    finally { setLoadingRecent(false); }
  };
  useEffect(() => { if (franchiseId) void loadRecent(); }, [franchiseId]);

  const recentPages = usePagination(recent, 8);

  const reset = () => {
    setCode(''); setStage('scan'); setValidation(null);
    setMember(null); setBill(0); setReceipt(null);
  };

  const validate = async () => {
    if (!code.trim()) return;
    setChecking(true); setValidation(null); setMember(null);
    try {
      const result = await voucherService.validate(code, franchiseId);
      setValidation(result);
      if (result.ok && result.voucher) {
        const m = await userService.getUser(result.voucher.userId).catch(() => null);
        setMember(m);
        setBill(result.voucher.value); // default the bill to full value
        setStage('validated');
      }
    } catch {
      setValidation({ ok: false, reason: 'not_found' });
    } finally {
      setChecking(false);
    }
  };

  const confirmBill = async () => {
    if (!validation?.voucher) return;
    setRedeeming(true);
    try {
      const redeemed = await voucherService.redeem(validation.voucher.code, franchiseId, bill);
      setReceipt(redeemed);
      setStage('done');
      toast.success('Purchase completed', `${formatCurrency(bill)} billed to ${member?.name ?? 'member'}`);
      void loadRecent();
    } catch (e) {
      toast.error('Redemption failed', e instanceof Error ? e.message : 'Unknown');
    } finally {
      setRedeeming(false);
    }
  };

  const errorMessage = useMemo(() => {
    if (!validation || validation.ok) return null;
    switch (validation.reason) {
      case 'not_found': return 'No voucher found for this code.';
      case 'expired': return 'This voucher has expired.';
      case 'redeemed': return 'This voucher was already redeemed.';
      case 'wrong_franchise': return 'This voucher belongs to another franchise.';
      default: return 'Voucher is not valid.';
    }
  }, [validation]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-2">
          <Store className="h-3.5 w-3.5" /> Store counter
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Redeem Voucher</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Scan or enter a member's voucher code to validate and bill their in-store purchase.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── Left: scan / validate / bill ─────────────────────────────────── */}
        <Card>
          {stage === 'scan' && (
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center py-4">
                <div className="h-16 w-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-3">
                  <ScanLine className="h-8 w-8 text-brand-600" />
                </div>
                <h2 className="font-bold text-neutral-900">Scan or enter voucher code</h2>
                <p className="text-sm text-neutral-500 mt-1">Format: MLN-XXXX-XXXX</p>
              </div>

              <div>
                <label htmlFor="voucher-code" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">Voucher Code</label>
                <input
                  id="voucher-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') void validate(); }}
                  placeholder="MLN-8F3A-52K9"
                  autoFocus
                  className="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-3.5 text-lg font-mono font-bold tracking-wider text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:border-brand-500"
                />
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                  <XCircle className="h-4 w-4 shrink-0" /> {errorMessage}
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                loading={checking}
                disabled={!code.trim()}
                onClick={validate}
                leftIcon={<QrCode className="h-4 w-4" />}
              >
                Validate Voucher
              </Button>
            </div>
          )}

          {stage === 'validated' && validation?.voucher && (
            <div className="space-y-5">
              {/* Valid banner */}
              <div className="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-semibold text-success-700">
                <ShieldCheck className="h-4 w-4 shrink-0" /> Voucher validated
              </div>

              {/* Member + voucher summary */}
              <div className="rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
                <Row icon={<UserIcon className="h-4 w-4" />} label="Member" value={member?.name ?? validation.voucher.userId} />
                <Row icon={<QrCode className="h-4 w-4" />} label="Code" value={<span className="font-mono">{validation.voucher.code}</span>} />
                <Row icon={<Wallet className="h-4 w-4" />} label="Authorized value" value={<span className="font-mono font-bold text-brand-600">{formatCurrency(validation.voucher.value)}</span>} />
                <Row icon={<Clock className="h-4 w-4" />} label="Valid until" value={formatDateTime(validation.voucher.expiresAt)} />
              </div>

              {/* Bill amount */}
              <div>
                <label htmlFor="bill" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">Bill Amount</label>
                <div className="flex items-center rounded-xl border-2 border-neutral-200 bg-white focus-within:border-brand-500">
                  <span className="pl-4 text-xl font-mono text-neutral-400">₹</span>
                  <input
                    id="bill"
                    type="number"
                    min={0}
                    max={validation.voucher.value}
                    value={bill || ''}
                    onChange={(e) => setBill(Math.min(validation.voucher!.value, Math.max(0, Number(e.target.value))))}
                    className="w-full bg-transparent px-3 py-3.5 text-xl font-mono font-bold text-neutral-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setBill(validation.voucher!.value)}
                    className="mr-3 shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100"
                  >
                    FULL
                  </button>
                </div>
                {bill > validation.voucher.value && (
                  <p className="text-xs font-semibold text-danger-500 mt-1.5">Bill exceeds the authorized voucher value.</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={reset} leftIcon={<RotateCcw className="h-4 w-4" />}>Cancel</Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  loading={redeeming}
                  disabled={bill <= 0 || bill > validation.voucher.value}
                  onClick={confirmBill}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Confirm & Bill
                </Button>
              </div>
            </div>
          )}

          {stage === 'done' && receipt && (
            <div className="flex flex-col items-center text-center py-6">
              <div className="relative mb-4">
                <span className="absolute inset-0 rounded-full bg-success-400/30 animate-ping" />
                <div className="relative h-16 w-16 rounded-full bg-success-500 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-neutral-900">Purchase Completed</h2>
              <p className="text-sm text-neutral-500 mt-1">
                {formatCurrency(receipt.redeemedAmount ?? 0)} billed to {member?.name ?? 'member'} · settled from vault
              </p>
              <p className="mt-3 text-[11px] font-mono text-neutral-400">Voucher {receipt.code}</p>
              <Button variant="primary" className="mt-6" onClick={reset} leftIcon={<ScanLine className="h-4 w-4" />}>
                Redeem Another
              </Button>
            </div>
          )}
        </Card>

        {/* ── Right: recent store redemptions ──────────────────────────────── */}
        <Card padding="none">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-bold text-neutral-900">Recent Voucher Activity</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Vouchers issued & redeemed at this franchise</p>
          </div>
          {loadingRecent ? (
            <SkeletonTable rows={4} />
          ) : recent.length === 0 ? (
            <EmptyState title="No vouchers yet" icon={<QrCode className="h-6 w-6" />} description="Vouchers members generate will appear here." className="py-12" />
          ) : (
            <>
              <ul className="divide-y divide-neutral-100">
                {recentPages.pageItems.map(v => (
                  <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-neutral-800 truncate">{v.code}</p>
                      <p className="text-xs text-neutral-400">
                        {v.status === 'redeemed'
                          ? `Billed ${formatCurrency(v.redeemedAmount ?? 0)} · ${formatDateTime(v.redeemedAt ?? v.issuedAt)}`
                          : `Value ${formatCurrency(v.value)} · issued ${formatDateTime(v.issuedAt)}`}
                      </p>
                    </div>
                    <VoucherBadge status={v.status} />
                  </li>
                ))}
              </ul>
              <Pagination
                page={recentPages.page}
                pageCount={recentPages.pageCount}
                onPageChange={recentPages.setPage}
                range={recentPages.range}
                total={recentPages.total}
                itemLabel="vouchers"
              />
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">{icon}</span>
      <span className="text-xs font-medium text-neutral-500 w-28 shrink-0">{label}</span>
      <span className="text-sm text-neutral-900 truncate flex-1 text-right">{value}</span>
    </div>
  );
}

function VoucherBadge({ status }: { status: Voucher['status'] }) {
  const map = {
    active: { variant: 'success' as const, label: 'Active' },
    redeemed: { variant: 'default' as const, label: 'Redeemed' },
    expired: { variant: 'danger' as const, label: 'Expired' },
  };
  const m = map[status];
  return <Badge variant={m.variant} dot>{m.label}</Badge>;
}
