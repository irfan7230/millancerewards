// =============================================================================
// Dialog — accessible modal primitive
// DESIGN-SYSTEM.md: focus-trapped, Esc-dismissible, uses <dialog> element
// =============================================================================
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, size = 'md', className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        // Explicitly center with fixed + translate so it doesn't depend on the
        // native <dialog> margin:auto (which a global CSS reset can override,
        // pinning it to the top-left corner).
        'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 m-0',
        'w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto',
        'rounded-xl shadow-xl border border-neutral-200 bg-white p-0',
        'backdrop:bg-neutral-900/50 backdrop:backdrop-blur-sm',
        '[&:not([open])]:hidden',
        sizeClasses[size],
        className,
      )}
      onClick={e => { if (e.target === dialogRef.current) onClose(); }}
    >
      {(title || description) && (
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-neutral-100">
          <div>
            {title && <h2 className="text-base font-semibold text-neutral-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-neutral-500">{description}</p>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 -mt-1 -mr-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </dialog>
  );
}

export function DialogFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-end gap-2 px-6 pb-6 pt-2', className)} {...props}>
      {children}
    </div>
  );
}
