// =============================================================================
// SearchFilter — reusable, responsive search + filter bar for admin views.
// UI-only: purely controlled by the parent (business logic stays in pages).
// Renders a search input plus zero or more filter dropdowns in a row that
// stacks on mobile and goes inline on desktop.
// =============================================================================
import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterConfig {
  /** Stable key (used for React key + aria) */
  key: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  options: { value: string; label: string }[];
  /** Tailwind width class for the select (default sm:w-48) */
  widthClass?: string;
}

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  filters?: FilterConfig[];
  /** Optional trailing content (e.g. a result count or an action button) */
  trailing?: React.ReactNode;
  className?: string;
}

export function SearchFilter({
  search, onSearchChange, placeholder = 'Search…', filters = [], trailing, className,
}: Props) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3', className)}>
      {/* Search */}
      <div className="relative w-full sm:flex-1 sm:min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      {filters.map((f) => (
        <select
          key={f.key}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          aria-label={f.ariaLabel}
          className={cn(
            'w-full rounded-lg border border-neutral-300 bg-white py-2 pl-3 pr-8 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:shrink-0',
            f.widthClass ?? 'sm:w-48',
          )}
        >
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}

      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}
