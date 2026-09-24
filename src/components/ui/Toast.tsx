// =============================================================================
// Toast — notification primitive
// =============================================================================
import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, type Toast } from '@/stores/uiStore';
import { motion, AnimatePresence } from 'framer-motion';

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const COLORS: Record<Toast['variant'], string> = {
  success: 'border-success-200 bg-success-50 text-success-800',
  error:   'border-danger-200  bg-danger-50  text-danger-800',
  warning: 'border-warning-200 bg-warning-50 text-warning-800',
  info:    'border-brand-200   bg-brand-50   text-brand-800',
};

const ICON_COLORS: Record<Toast['variant'], string> = {
  success: 'text-success-500',
  error:   'text-danger-500',
  warning: 'text-warning-500',
  info:    'text-brand-500',
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useUIStore((s: any) => s.removeToast);
  const Icon = ICONS[toast.variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg min-w-72 max-w-sm',
        COLORS[toast.variant],
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', ICON_COLORS[toast.variant])} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && (
          <p className="text-xs mt-0.5 opacity-80">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((s: any) => s.toasts);

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast: any) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
