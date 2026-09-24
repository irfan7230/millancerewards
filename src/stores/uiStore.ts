// =============================================================================
// UI Store — cross-cutting UI state
// =============================================================================
import { create } from 'zustand';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface UIState {
  sidebarCollapsed: boolean;
  activeDialog: string | null;
  toasts: Toast[];
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  openDialog: (id: string) => void;
  closeDialog: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useUIStore = create<UIState & UIActions>()((set, get) => ({
  sidebarCollapsed: false,
  activeDialog: null,
  toasts: [],

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  openDialog: (id) => set({ activeDialog: id }),
  closeDialog: () => set({ activeDialog: null }),

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set(s => ({ toasts: [...s.toasts, { ...toast, id }] }));
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => get().removeToast(id), duration);
    }
    return id;
  },

  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}));

/** Convenience hook — call from any component to show a toast */
export function useToast() {
  const addToast = useUIStore(s => s.addToast);
  return {
    toast: (options: Omit<Toast, 'id'>) => addToast(options),
    success: (title: string, description?: string) =>
      addToast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) =>
      addToast({ title, description, variant: 'error' }),
    warning: (title: string, description?: string) =>
      addToast({ title, description, variant: 'warning' }),
    info: (title: string, description?: string) =>
      addToast({ title, description, variant: 'info' }),
  };
}
