// =============================================================================
// NotificationBell — reusable bell + dropdown for all three portals.
// Responsive positioning + stacking fix.
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  Bell,
  CheckCheck,
  CreditCard,
  Trophy,
  Gift,
  Clock,
  Flag,
  PartyPopper,
  ShoppingBag,
} from 'lucide-react';

import { cn, formatDateTime } from '@/lib/utils';
import { notificationService } from '@/services/notification.service';

import type {
  NotificationEvent,
  NotificationKind,
} from '@/types';

type Audience = 'user' | 'franchise' | 'super_admin';

interface Props {
  audience: Audience;
  userId?: string;
  franchiseId?: string;

  /** Tailwind classes for the trigger button */
  className?: string;
}

// =============================================================================
// Icon + tint per notification kind
// =============================================================================

const KIND_META: Record<
  NotificationKind,
  {
    icon: React.ElementType;
    tint: string;
    bg: string;
  }
> = {
  payment_success: {
    icon: CreditCard,
    tint: 'text-success-600',
    bg: 'bg-success-50',
  },

  payment_due: {
    icon: Clock,
    tint: 'text-warning-600',
    bg: 'bg-warning-50',
  },

  draw_completed: {
    icon: Trophy,
    tint: 'text-brand-600',
    bg: 'bg-brand-50',
  },

  prize_won: {
    icon: PartyPopper,
    tint: 'text-accent-600',
    bg: 'bg-accent-50',
  },

  plan_milestone: {
    icon: Flag,
    tint: 'text-brand-600',
    bg: 'bg-brand-50',
  },

  plan_completed: {
    icon: Gift,
    tint: 'text-accent-600',
    bg: 'bg-accent-50',
  },

  purchase_success: {
    icon: ShoppingBag,
    tint: 'text-brand-600',
    bg: 'bg-brand-50',
  },
};

// =============================================================================
// Notification Bell
// =============================================================================

export function NotificationBell({
  audience,
  userId,
  franchiseId,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // ===========================================================================
  // Load notifications
  // ===========================================================================

  const load = useCallback(async () => {
    setLoading(true);

    try {
      let data: NotificationEvent[];

      if (audience === 'super_admin') {
        data = await notificationService.getForAdmin();
      } else if (audience === 'franchise') {
        data = await notificationService.getForFranchise(
          franchiseId ?? '',
        );
      } else {
        data = await notificationService.getForUser(
          userId ?? '',
          franchiseId,
        );
      }

      // Newest first
      data.sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );

      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [audience, userId, franchiseId]);

  // ===========================================================================
  // Initial load
  // ===========================================================================

  useEffect(() => {
    void load();
  }, [load]);

  // ===========================================================================
  // Periodic refresh (only when closed)
  // ===========================================================================

  useEffect(() => {
    if (open) return; // Do not poll when open; we fetch on open instead.
    const t = window.setInterval(() => {
      void load();
    }, 15_000);

    return () => window.clearInterval(t);
  }, [load, open]);

  // ===========================================================================
  // Refresh when opening
  // ===========================================================================

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [open, load]);

  // ===========================================================================
  // Close on outside click / Escape
  // ===========================================================================

  useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        btnRef.current &&
        !btnRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // ===========================================================================
  // Actions
  // ===========================================================================

  const unread = items.filter((n) => !n.read).length;

  const handleItemClick = async (n: NotificationEvent) => {
    if (n.read) return;

    setItems((prev) =>
      prev.map((x) =>
        x.id === n.id
          ? { ...x, read: true }
          : x,
      ),
    );

    await notificationService.markRead(n.id);
  };

  const handleMarkAll = async () => {
    if (unread === 0) return;

    setItems((prev) =>
      prev.map((x) => ({
        ...x,
        read: true,
      })),
    );

    if (audience === 'super_admin') {
      // markAllRead is scoped by user/franchise;
      // for admin mark each unread.
      await Promise.all(
        items
          .filter((n) => !n.read)
          .map((n) =>
            notificationService.markRead(n.id),
          ),
      );
    } else if (audience === 'franchise') {
      await notificationService.markAllRead(
        undefined,
        franchiseId,
      );
    } else {
      await notificationService.markAllRead(
        userId,
        franchiseId,
      );
    }
  };

  // ===========================================================================
  // UI
  // ===========================================================================

  return (
    /*
     * IMPORTANT:
     * This root establishes a high stacking layer so the dropdown
     * can never fall behind the page content.
     */
    <div className="relative z-[100] shrink-0">
      {/* ------------------------------------------------------------------- */}
      {/* Trigger                                                             */}
      {/* ------------------------------------------------------------------- */}

      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${
          unread ? `, ${unread} unread` : ''
        }`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          'relative z-[101]',
          className,
        )}
      >
        <Bell
          className="h-5 w-5"
          aria-hidden="true"
        />

        {unread > 0 && (
          <span
            className="
              absolute
              -right-0.5
              -top-0.5
              flex
              h-[1.05rem]
              min-w-[1.05rem]
              items-center
              justify-center
              rounded-full
              bg-accent-500
              px-1
              text-[10px]
              font-bold
              text-white
              ring-2
              ring-white
            "
            aria-hidden="true"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ------------------------------------------------------------------- */}
      {/* Notification panel                                                 */}
      {/* ------------------------------------------------------------------- */}

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"

          /*
           * MOBILE
           * ------
           * Fixed to the viewport instead of being anchored to the
           * tiny notification button. This prevents the panel from
           * extending outside the screen.
           *
           * DESKTOP
           * -------
           * Returns to the original dropdown behavior underneath
           * the notification button.
           */
          className="
            fixed
            left-3
            right-3
            top-[4.25rem]
            z-[9999]
            w-auto
            max-w-none
            overflow-hidden
            rounded-2xl
            border
            border-neutral-200
            bg-white
            shadow-[0_20px_60px_rgba(15,23,42,0.16)]
            ring-1
            ring-black/[0.03]

            sm:absolute
            sm:left-auto
            sm:right-0
            sm:top-full
            sm:mt-2
            sm:w-[calc(100vw-2rem)]
            sm:max-w-sm
          "
        >
          {/* ============================================================= */}
          {/* Header                                                         */}
          {/* ============================================================= */}

          <div
            className="
              flex
              min-h-[3.5rem]
              items-center
              justify-between
              gap-3
              border-b
              border-neutral-100
              px-4
              py-3
              sm:px-4
            "
          >
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-bold text-neutral-900">
                Notifications
              </p>

              {unread > 0 && (
                <span
                  className="
                    shrink-0
                    rounded-full
                    bg-accent-100
                    px-1.5
                    py-0.5
                    text-[10px]
                    font-bold
                    text-accent-700
                  "
                >
                  {unread} new
                </span>
              )}
            </div>

            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="
                  inline-flex
                  shrink-0
                  items-center
                  gap-1
                  rounded-md
                  px-1.5
                  py-1
                  text-xs
                  font-semibold
                  text-brand-600
                  transition-colors
                  hover:bg-brand-50
                  hover:text-brand-700
                "
              >
                <CheckCheck
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
                <span className="hidden xs:inline">
                  Mark all read
                </span>
                <span className="xs:hidden">
                  Read all
                </span>
              </button>
            )}
          </div>

          {/* ============================================================= */}
          {/* List                                                           */}
          {/* ============================================================= */}

          <div className="max-h-[min(22rem,calc(100vh-6rem))] overflow-y-auto overscroll-contain">
            {loading && items.length === 0 ? (
              <div className="p-6 text-center text-sm text-neutral-400">
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div
                  className="
                    mx-auto
                    mb-3
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-full
                    bg-neutral-100
                  "
                >
                  <Bell
                    className="h-5 w-5 text-neutral-400"
                    aria-hidden="true"
                  />
                </div>

                <p className="text-sm font-semibold text-neutral-700">
                  You're all caught up
                </p>

                <p className="mt-0.5 text-xs text-neutral-400">
                  No notifications yet.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {items.map((n) => {
                  const meta =
                    KIND_META[n.kind] ?? {
                      icon: Bell,
                      tint: 'text-neutral-500',
                      bg: 'bg-neutral-100',
                    };

                  const Icon = meta.icon;

                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() =>
                          handleItemClick(n)
                        }
                        className={cn(
                          `
                            flex
                            w-full
                            min-w-0
                            gap-3
                            px-4
                            py-3
                            text-left
                            transition-colors
                            hover:bg-neutral-50
                            focus:outline-none
                            focus-visible:bg-neutral-50
                            focus-visible:ring-2
                            focus-visible:ring-inset
                            focus-visible:ring-brand-500
                          `,
                          !n.read &&
                            'bg-brand-50/40',
                        )}
                      >
                        <span
                          className={cn(
                            `
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                            `,
                            meta.bg,
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4',
                              meta.tint,
                            )}
                            aria-hidden="true"
                          />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'break-words text-sm leading-snug',
                              n.read
                                ? 'text-neutral-600'
                                : 'font-medium text-neutral-900',
                            )}
                          >
                            {n.message}
                          </p>

                          <p className="mt-0.5 text-[11px] text-neutral-400">
                            {formatDateTime(n.createdAt)}
                          </p>
                        </div>

                        {!n.read && (
                          <span
                            className="
                              mt-1.5
                              h-2
                              w-2
                              shrink-0
                              rounded-full
                              bg-accent-500
                            "
                            aria-label="Unread"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}