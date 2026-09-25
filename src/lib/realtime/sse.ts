import { QueryClient } from '@tanstack/react-query';
import { BASE_URL } from '@/lib/api/client';

type SSEEventTypes = 'draw_executed' | 'payment_cleared' | 'notification_created' | 'dashboard_delta' | 'ping' | 'connected';

export class SSEManager {
  private es: EventSource | null = null;
  private queryClient: QueryClient | null = null;
  private backoff = 2000;
  private maxBackoff = 30_000;
  private manualClose = false;
  private reconnectTimer: number | null = null;
  private listeners = new Map<string, Set<(payload: any) => void>>();

  attach(queryClient: QueryClient) { this.queryClient = queryClient; }

  connect() {
    if (this.es) return;
    this.manualClose = false;
    const url = `${BASE_URL}/events/stream`;
    try {
      this.es = new EventSource(url, { withCredentials: true });
    } catch (e) { console.error('[SSE] create failed', e); this.scheduleReconnect(); return; }

    this.es.onopen = () => { this.backoff = 2000; };

    this.es.addEventListener('connected', (_ev: any) => { /* noop */ });
    this.es.addEventListener('ping', (_ev: any) => { /* keepalive */ });

    this.es.addEventListener('draw_executed', (ev: any) => {
      const data = JSON.parse(ev.data);
      this.dispatch('draw_executed', data);
      this.queryClient?.invalidateQueries({ queryKey: ['draws'], exact: false });
      this.queryClient?.invalidateQueries({ queryKey: ['reports'], exact: false });
    });

    this.es.addEventListener('payment_cleared', (ev: any) => {
      const data = JSON.parse(ev.data);
      this.dispatch('payment_cleared', data);
      this.queryClient?.invalidateQueries({ queryKey: ['payments'], exact: false });
      this.queryClient?.invalidateQueries({ queryKey: ['reports'], exact: false });
      this.queryClient?.invalidateQueries({ queryKey: ['vault'], exact: false });
    });

    this.es.addEventListener('notification_created', (ev: any) => {
      const data = JSON.parse(ev.data);
      this.dispatch('notification_created', data);
      this.queryClient?.setQueryData(['notifications'], (old: any) => {
        if (!old) return [data];
        return Array.isArray(old.items) ? { ...old, items: [data, ...old.items] } : [data, ...old];
      });
      this.queryClient?.invalidateQueries({ queryKey: ['notifications', 'unread'], exact: false });
    });

    this.es.addEventListener('dashboard_delta', (ev: any) => {
      const data = JSON.parse(ev.data);
      this.dispatch('dashboard_delta', data);
      if (data.scope === 'platform') {
        this.queryClient?.setQueryData(['reports', 'dashboard'], data.kpis);
      } else if (data.scope && typeof data.scope === 'string') {
        this.queryClient?.setQueryData(['reports', 'franchiseDashboard', data.scope], data.kpis);
      }
    });

    this.es.onerror = () => {
      this.es?.close();
      this.es = null;
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.manualClose) return;
    if (this.reconnectTimer) return;
    const delay = Math.min(this.backoff, this.maxBackoff);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.backoff = Math.min(this.backoff * 2, this.maxBackoff);
      this.connect();
    }, delay);
  }

  disconnect() {
    this.manualClose = true;
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.es) { this.es.close(); this.es = null; }
  }

  on(type: SSEEventTypes, cb: (payload: any) => void): () => void {
    const bucket = this.listeners.get(type) ?? new Set();
    bucket.add(cb);
    this.listeners.set(type, bucket);
    return () => bucket.delete(cb);
  }

  private dispatch(type: string, payload: any) {
    for (const cb of (this.listeners.get(type) ?? [])) {
      try { cb(payload); } catch {}
    }
  }
}

export const sseManager = new SSEManager();
