// =============================================================================
// EmptyState & ErrorState — shared states
// DESIGN-SYSTEM.md: never a bare spinner or generic "something went wrong"
// =============================================================================
import React from 'react';
import { PackageOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 mb-4">
        {icon ?? <PackageOpen className="h-7 w-7" aria-hidden="true" />}
      </div>
      <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-neutral-500 max-w-sm">{description}</p>
      )}
      {action && (
        <Button variant="outline" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading data. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-50 text-danger-400 mb-4">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
      <p className="mt-1 text-sm text-neutral-500 max-w-sm">{description}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={onRetry}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Try again
        </Button>
      )}
    </div>
  );
}

// Page-level loading wrapper
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-3 text-neutral-500" aria-busy="true" aria-label={label}>
      <svg className="animate-spin h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <p className="text-sm">{label}</p>
    </div>
  );
}
