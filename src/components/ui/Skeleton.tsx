// =============================================================================
// Skeleton — loading placeholder primitives
// DESIGN-SYSTEM.md: skeleton UI matching shape of real content, never a bare spinner
// =============================================================================
import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: 'none' | 'sm' | 'md' | 'full';
}

export function Skeleton({ className, rounded = 'md', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-neutral-200',
        rounded === 'none' && 'rounded-none',
        rounded === 'sm'   && 'rounded-sm',
        rounded === 'md'   && 'rounded-md',
        rounded === 'full' && 'rounded-full',
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 && 'w-3/4')} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-neutral-200 bg-white p-6 shadow-sm', className)}>
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-9" rounded="full" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-40" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full" aria-hidden="true">
      <div className="flex gap-4 p-3 border-b border-neutral-200 mb-1">
        {[40, 20, 20, 20].map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 border-b border-neutral-100">
          {[40, 20, 20, 20].map((w, j) => (
            <Skeleton key={j} className="h-4" style={{ width: `${w}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Matches the redesigned User Home layout so both the lazy-load Suspense
// fallback and the in-component loading state look identical (no flash/jump):
// balance hero → banner → quick actions → stat chips → plan → two cards.
export function SkeletonUserHome() {
  return (
    <div className="space-y-6 max-w-6xl" aria-hidden="true">
      <Skeleton className="h-40 sm:h-44 w-full rounded-3xl" />
      <Skeleton className="h-40 sm:h-56 lg:h-64 w-full rounded-3xl" />

      <div>
        <Skeleton className="h-4 w-28 mb-3" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-neutral-200 p-3 sm:p-4 flex flex-col items-center gap-2">
              <Skeleton className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-neutral-100 rounded-2xl border border-neutral-200 bg-white shadow-sm sm:gap-4 sm:border-0 sm:bg-transparent sm:shadow-none sm:divide-x-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 sm:p-4 flex items-center gap-3 sm:rounded-2xl sm:bg-white sm:border sm:border-neutral-200">
            <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl" />
            <div className="flex-1 space-y-1.5 hidden sm:block">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-10" />
            </div>
            <div className="flex-1 space-y-1.5 sm:hidden">
               <Skeleton className="h-3 w-10 mx-auto" />
               <Skeleton className="h-4 w-6 mx-auto" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-3">
          <Skeleton className="h-5 w-36 mb-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-40 mb-4" />
          <SkeletonTable rows={4} />
        </div>
      </div>
    </div>
  );
}
