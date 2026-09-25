// =============================================================================
// App Providers — wraps the entire app
// Bootstraps data on first load, initializes session, provides QueryClient
// =============================================================================
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ToastContainer } from '@/components/ui/Toast';
import { CheckoutProvider } from '@/components/payments/CheckoutProvider';
import { useAuthStore } from '@/stores/authStore';
import { bootstrapData } from '@/services/bootstrap.service';
import { sseManager } from '@/lib/realtime/sse';

// Bootstrap data once before any rendering (synchronous)
bootstrapData();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 2,
    },
  },
});

function SessionInitializer({ children }: { children: React.ReactNode }) {
  const initSession = useAuthStore(s => s.initSession);

  useEffect(() => {
    void initSession();
  }, [initSession]);

  return <>{children}</>;
}

function SSEAttacher({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const initialized = useAuthStore(s => s.initialized);
  const isAuthed = useAuthStore(s => !!s.user);

  useEffect(() => {
    if (!initialized) return;
    sseManager.attach(queryClient);
    if (isAuthed) sseManager.connect();
    return () => sseManager.disconnect();
  }, [initialized, isAuthed, queryClient]);

  useEffect(() => {
    if (!initialized) return;
    sseManager.attach(queryClient);
    if (isAuthed) sseManager.connect();
    else sseManager.disconnect();
  }, [isAuthed, initialized, queryClient]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionInitializer>
        <SSEAttacher>
          <CheckoutProvider>
            {children}
          </CheckoutProvider>
          <ToastContainer />
        </SSEAttacher>
      </SessionInitializer>
    </QueryClientProvider>
  );
}
