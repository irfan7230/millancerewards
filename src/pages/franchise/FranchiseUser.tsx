import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Wallet, PiggyBank, CreditCard, Trophy } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { UserStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { userService } from '@/services/user.service';
import { paymentService } from '@/services/payment.service';
import { vaultService } from '@/services/vault.service';
import type { FranchiseUser, Payment, Vault } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

// Scoped design tokens for this page. Kept local (not a global theme change)
// per the brief: UI/UX only, no changes to app-wide config or business logic.
const pageStyle: React.CSSProperties = {
  '--ledger-ink': '#151A2E',
  '--ledger-ink-soft': '#5B6178',
  '--ledger-base': '#F7F6F2',
  '--ledger-accent': '#5B4FE8',
  '--ledger-accent-soft': '#E9E7FC',
  '--ledger-success': '#1F6E4E',
  '--ledger-success-soft': '#E4F2EC',
  '--ledger-pending': '#8A5A14',
  '--ledger-pending-soft': '#FBEED9',
  '--ledger-border': '#E3DFD3',
} as React.CSSProperties;

function StatTile({
  icon,
  label,
  value,
  helper,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="flex items-start justify-between gap-3 rounded-xl border p-4 sm:p-5"
      style={{
        borderColor: 'var(--ledger-border)',
        background: accent ? 'var(--ledger-accent-soft)' : '#FFFFFF',
      }}
    >
      <div className="min-w-0">
        <p
          className="text-xs font-medium leading-snug"
          style={{ color: 'var(--ledger-ink-soft)' }}
        >
          {label}
        </p>
        <p
          className="mt-1 font-mono text-xl sm:text-2xl font-semibold tabular-nums leading-tight break-words"
          style={{ color: 'var(--ledger-ink)' }}
        >
          {value}
        </p>
        {helper && (
          <p className="mt-1 text-xs" style={{ color: 'var(--ledger-ink-soft)' }}>
            {helper}
          </p>
        )}
      </div>
      <div
        className="flex h-9 w-9 flex-none items-center justify-center rounded-lg"
        style={{ background: 'var(--ledger-accent-soft)', color: 'var(--ledger-accent)' }}
        aria-hidden="true"
      >
        {icon}
      </div>
    </div>
  );
}

export default function FranchiseUserDetail() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<FranchiseUser | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [u, p, v] = await Promise.all([
          userService.getUser(id),
          paymentService.getUserPayments(id),
          vaultService.getVault(id),
        ]);
        setUser(u);
        setPayments(p);
        setVault(v);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }
  if (error || !user) return <ErrorState description={error ?? 'User not found'} />;

  const paidCount = payments.filter((p) => p.status === 'Paid').length;
  const pendingCount = payments.filter((p) => p.status === 'Pending').length;
  const sortedPayments = [...payments].sort((a, b) => b.month - a.month);
  const recentTransactions = vault ? [...vault.transactions].reverse().slice(0, 20) : [];

  return (
    <div className="space-y-6" style={pageStyle}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          to="/franchise/users"
          aria-label="Back to members"
          className="mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-lg border hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ borderColor: 'var(--ledger-border)', outlineColor: 'var(--ledger-accent)' }}
        >
          <ArrowLeft className="h-4 w-4" style={{ color: 'var(--ledger-ink)' }} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1
            className="break-words text-xl sm:text-2xl font-bold leading-tight"
            style={{ color: 'var(--ledger-ink)' }}
          >
            {user.name}
          </h1>
          <div className="mt-1 flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:gap-2">
            <span className="break-all" style={{ color: 'var(--ledger-ink-soft)' }}>
              {user.email}
            </span>
            <span className="hidden sm:inline" style={{ color: 'var(--ledger-border)' }}>
              |
            </span>
            <span style={{ color: 'var(--ledger-ink-soft)' }}>{user.phone}</span>
          </div>
          <div className="mt-2">
            <UserStatusBadge status={user.status} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          icon={<Wallet className="h-4 w-4" />}
          label="Vault balance"
          value={formatCurrency(vault?.balance ?? 0)}
          accent
        />
        <StatTile
          icon={<PiggyBank className="h-4 w-4" />}
          label="Total contributed"
          value={formatCurrency(vault?.totalContributed ?? 0)}
        />
        <StatTile
          icon={<CreditCard className="h-4 w-4" />}
          label="Payments made"
          value={String(paidCount)}
          helper={`${pendingCount} pending`}
        />
        <StatTile
          icon={<Trophy className="h-4 w-4" />}
          label="Winner status"
          value={user.hasWon ? 'Won' : 'Not yet'}
        />
      </div>

      {/* Payment History */}
      <Card padding="none">
        <CardHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b" style={{ borderColor: 'var(--ledger-border)' }}>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>

        {sortedPayments.length === 0 ? (
          <p className="px-6 py-8 text-sm text-center" style={{ color: 'var(--ledger-ink-soft)' }}>
            No payment records yet
          </p>
        ) : (
          <>
            {/* Mobile / small tablet: stacked cards, nothing truncated */}
            <ul className="md:hidden divide-y" style={{ borderColor: 'var(--ledger-border)' }}>
              {sortedPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--ledger-ink)' }}>
                      {p.periodLabel}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ledger-ink-soft)' }}>
                      {p.paidAt ? formatDate(p.paidAt) : 'Not paid yet'}
                    </p>
                  </div>
                  <div className="flex-none text-right">
                    <p
                      className="font-mono text-sm font-semibold tabular-nums"
                      style={{ color: 'var(--ledger-accent)' }}
                    >
                      {formatCurrency(p.amount)}
                    </p>
                    <div className="mt-1">
                      <PaymentStatusBadge status={p.status} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Tablet and up: full table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b" style={{ borderColor: 'var(--ledger-border)' }}>
                  <tr>
                    {['Period', 'Amount', 'Status', 'Paid at'].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold"
                        style={{ color: 'var(--ledger-ink-soft)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--ledger-border)' }}>
                  {sortedPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-2.5" style={{ color: 'var(--ledger-ink)' }}>
                        {p.periodLabel}
                      </td>
                      <td
                        className="px-4 py-2.5 font-mono tabular-nums font-medium"
                        style={{ color: 'var(--ledger-accent)' }}
                      >
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <PaymentStatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--ledger-ink-soft)' }}>
                        {p.paidAt ? formatDate(p.paidAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Vault Transactions */}
      {vault && recentTransactions.length > 0 && (
        <Card padding="none">
          <CardHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b" style={{ borderColor: 'var(--ledger-border)' }}>
            <CardTitle>Vault transactions</CardTitle>
          </CardHeader>
          <ul className="divide-y" style={{ borderColor: 'var(--ledger-border)' }}>
            {recentTransactions.map((tx) => {
              const isCredit = tx.amount >= 0;
              return (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm capitalize" style={{ color: 'var(--ledger-ink)' }}>
                      {tx.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ledger-ink-soft)' }}>
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="flex-none text-right">
                    <p
                      className="font-mono text-sm font-semibold tabular-nums"
                      style={{ color: isCredit ? 'var(--ledger-success)' : '#B4242A' }}
                    >
                      {isCredit ? '+' : ''}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ledger-ink-soft)' }}>
                      Balance {formatCurrency(tx.balanceAfter)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}