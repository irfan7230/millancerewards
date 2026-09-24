// =============================================================================
// FranchiseSection — a collapsible panel that groups admin data under a
// franchise heading. Used by AdminUsers / AdminGroups / AdminPlans to present
// a "grouped by franchise" hierarchy instead of one flat cross-tenant table.
// Accessible: the header is a real <button> toggling aria-expanded.
// =============================================================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { Franchise } from '@/types';

interface Props {
  franchise: Franchise;
  /** Short summary shown in the header, e.g. "12 members · 3 groups" */
  summary?: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function FranchiseSection({ franchise, summary, count, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `franchise-panel-${franchise.id}`;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 bg-neutral-50/70 border-b border-neutral-100">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <span className="h-9 w-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-brand-600" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="font-semibold text-neutral-900 truncate">{franchise.name}</span>
              <Badge variant={franchise.status === 'active' ? 'success' : 'danger'} dot>
                {franchise.status === 'active' ? 'Active' : 'Suspended'}
              </Badge>
            </span>
            {summary && <span className="block text-xs text-neutral-400 mt-0.5 truncate">{summary}</span>}
          </span>
          <span className="ml-auto flex items-center gap-3 shrink-0">
            <span className="text-xs font-medium text-neutral-500 tabular-nums">{count}</span>
            <ChevronDown className={cn('h-4 w-4 text-neutral-400 transition-transform', open && 'rotate-180')} />
          </span>
        </button>
        <Link
          to={`/admin/franchises/${franchise.id}`}
          className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline shrink-0"
          aria-label={`Open ${franchise.name} detail`}
        >
          View <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {open && <div id={panelId}>{children}</div>}
    </section>
  );
}
