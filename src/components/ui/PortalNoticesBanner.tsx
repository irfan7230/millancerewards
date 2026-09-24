// =============================================================================
// PortalNoticesBanner — displays admin-published notices in portals.
// Shows notices relevant to the given audience from the CMS service.
// Notices can be dismissed per session (sessionStorage).
// =============================================================================
import { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cmsService } from '@/services/cms.service';
import type { PortalNotice } from '@/services/cms.service';
import { cn } from '@/lib/utils';

interface PortalNoticesBannerProps {
  audience: 'user' | 'franchise';
  className?: string;
}

const ICONS = {
  info:    Info,
  warning: AlertTriangle,
  success: CheckCircle2,
};

const STYLES = {
  info:    'bg-blue-50 border-blue-200 text-blue-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
};

const ICON_STYLES = {
  info:    'text-blue-500',
  warning: 'text-amber-500',
  success: 'text-emerald-500',
};

const DISMISS_KEY = 'millance:dismissed_notices';

function getDismissed(): string[] {
  try { return JSON.parse(sessionStorage.getItem(DISMISS_KEY) ?? '[]'); }
  catch { return []; }
}

function addDismissed(id: string): void {
  const cur = getDismissed();
  if (!cur.includes(id)) {
    sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...cur, id]));
  }
}

export function PortalNoticesBanner({ audience, className }: PortalNoticesBannerProps) {
  const [notices, setNotices] = useState<PortalNotice[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(getDismissed());

  useEffect(() => {
    cmsService.getNotices().then(all => {
      const visible = all.filter(n =>
        n.published && (n.audience === 'all' || n.audience === audience)
      );
      setNotices(visible);
    });
  }, [audience]);

  const dismiss = (id: string) => {
    addDismissed(id);
    setDismissed(prev => [...prev, id]);
  };

  const visible = notices.filter(n => !dismissed.includes(n.id));

  if (visible.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {visible.map(n => {
        const Icon = ICONS[n.type] ?? Info;
        return (
          <div
            key={n.id}
            role="alert"
            className={cn(
              'flex items-start gap-3 rounded-xl border px-4 py-3',
              STYLES[n.type] ?? STYLES.info,
            )}
          >
            <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', ICON_STYLES[n.type])} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{n.title}</p>
              <p className="text-xs mt-0.5 opacity-80">{n.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(n.id)}
              aria-label={`Dismiss notice: ${n.title}`}
              className="shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
