// =============================================================================
// Badge — status-aware primitive
// DESIGN-SYSTEM.md: every status must have both a color AND a label/icon
// =============================================================================
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { PaymentStatus, UserStatus, DrawStatus } from '@/types';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset shadow-sm',
  {
    variants: {
      variant: {
        default:     'bg-neutral-50 text-neutral-700 ring-neutral-200/60',
        primary:     'bg-brand-50 text-brand-700 ring-brand-200/60',
        success:     'bg-success-50 text-success-700 ring-success-200/60',
        warning:     'bg-warning-50 text-warning-700 ring-warning-200/60',
        danger:      'bg-danger-50 text-danger-700 ring-danger-200/60',
        info:        'bg-info-50 text-info-700 ring-info-200/60',
        accent:      'bg-accent-50 text-accent-700 ring-accent-200/60',
        outline:     'bg-transparent text-neutral-600 ring-neutral-300',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-success-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]',
            variant === 'warning' && 'bg-warning-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
            variant === 'danger'  && 'bg-danger-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
            variant === 'info'    && 'bg-info-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
            variant === 'primary' && 'bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]',
            variant === 'accent'  && 'bg-accent-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]',
            !variant || variant === 'default' || variant === 'outline' ? 'bg-neutral-400' : '',
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status badge helpers
// ---------------------------------------------------------------------------

const PAYMENT_STATUS_MAP: Record<PaymentStatus, { variant: BadgeProps['variant']; label: string }> = {
  Paid:    { variant: 'success', label: 'Paid' },
  Pending: { variant: 'warning', label: 'Pending' },
  Failed:  { variant: 'danger',  label: 'Failed' },
  Skipped: { variant: 'default', label: 'Skipped' },
};

const USER_STATUS_MAP: Record<UserStatus, { variant: BadgeProps['variant']; label: string }> = {
  ACTIVE:             { variant: 'success', label: 'Active' },
  PAYMENT_PENDING:    { variant: 'warning', label: 'Pmt. Pending' },
  PAYMENT_COMPLETED:  { variant: 'info',    label: 'Pmt. Done' },
  DRAW_ELIGIBLE:      { variant: 'accent',  label: 'Draw Eligible' },
  WINNER:             { variant: 'accent',  label: 'Winner' },
  INACTIVE:           { variant: 'default', label: 'Inactive' },
  PLAN_COMPLETED:     { variant: 'primary', label: 'Completed' },
};

const DRAW_STATUS_MAP: Record<DrawStatus, { variant: BadgeProps['variant']; label: string }> = {
  scheduled:   { variant: 'info',    label: 'Scheduled' },
  in_progress: { variant: 'warning', label: 'In Progress' },
  completed:   { variant: 'success', label: 'Completed' },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { variant, label } = PAYMENT_STATUS_MAP[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function UserStatusBadge({ status }: { status?: UserStatus }) {
  // Defensive: demo sessions may not carry a status; fall back gracefully.
  const entry = (status && USER_STATUS_MAP[status]) || { variant: 'default' as const, label: status ?? 'Unknown' };
  return <Badge variant={entry.variant} dot>{entry.label}</Badge>;
}

export function DrawStatusBadge({ status }: { status: DrawStatus }) {
  const { variant, label } = DRAW_STATUS_MAP[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function FranchiseStatusBadge({ status }: { status: 'active' | 'suspended' }) {
  return (
    <Badge variant={status === 'active' ? 'success' : 'danger'} dot>
      {status === 'active' ? 'Active' : 'Suspended'}
    </Badge>
  );
}
