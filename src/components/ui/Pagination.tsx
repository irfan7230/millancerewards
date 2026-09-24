// =============================================================================
// Pagination — reusable hook + UI for client-side paginated tables/lists.
//
// usePagination(items, pageSize):
//   - Slices `items` into the current page.
//   - Resets to page 1 automatically when the item count changes (e.g. after a
//     search/filter narrows results) so users never land on an empty page.
//   - Clamps the page if the list shrinks below the current page.
//
// <Pagination /> renders a responsive, accessible control bar (Prev/Next +
// numbered pages with ellipses) plus a "showing X–Y of N" summary.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationState<T> {
  page: number;
  setPage: (p: number) => void;
  pageCount: number;
  pageItems: T[];
  total: number;
  pageSize: number;
  /** 1-indexed range of the current page, e.g. { from: 11, to: 20 } */
  range: { from: number; to: number };
}

export function usePagination<T>(items: T[], pageSize = 10): PaginationState<T> {
  const [page, setPage] = useState(1);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Reset to page 1 whenever the result set size changes (search/filter/reload).
  useEffect(() => { setPage(1); }, [total]);

  // Clamp if the current page is now out of range.
  const safePage = Math.min(page, pageCount);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  const range = {
    from: total === 0 ? 0 : (safePage - 1) * pageSize + 1,
    to: Math.min(safePage * pageSize, total),
  };

  return { page: safePage, setPage, pageCount, pageItems, total, pageSize, range };
}

// Build a compact page list with ellipses: 1 … 4 5 [6] 7 8 … 12
function getPageList(current: number, count: number): (number | 'ellipsis')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(count - 1, current + 1);
  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < count - 1) pages.push('ellipsis');
  pages.push(count);
  return pages;
}

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (p: number) => void;
  range: { from: number; to: number };
  total: number;
  /** Noun for the summary, e.g. "members" */
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  page, pageCount, onPageChange, range, total, itemLabel = 'items', className,
}: PaginationProps) {
  if (total === 0) return null;

  const pages = getPageList(page, pageCount);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-neutral-100',
        className,
      )}
    >
      <p className="text-xs text-neutral-500 order-2 sm:order-1">
        Showing <span className="font-medium text-neutral-700 tabular-nums">{range.from}–{range.to}</span> of{' '}
        <span className="font-medium text-neutral-700 tabular-nums">{total}</span> {itemLabel}
      </p>

      {pageCount > 1 && (
        <nav className="flex items-center gap-1 order-1 sm:order-2" aria-label="Pagination">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pages.map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`e-${i}`} className="px-1 text-neutral-400 select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  'h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-lg text-sm font-medium tabular-nums transition-colors',
                  p === page
                    ? 'bg-brand-600 text-white'
                    : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50',
                )}
              >
                {p}
              </button>
            ),
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            aria-label="Next page"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
