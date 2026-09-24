// =============================================================================
// App Providers — wraps the entire app
// Bootstraps data on first load, initializes session, provides QueryClient
// =============================================================================
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from '@/components/ui/Toast';
import { CheckoutProvider } from '@/components/payments/CheckoutProvider';
import { useAuthStore } from '@/stores/authStore';
import { bootstrapData } from '@/services/bootstrap.service';

// Bootstrap data once before any rendering (synchronous)
bootstrapData();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
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

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionInitializer>
        <CheckoutProvider>
          {children}
        </CheckoutProvider>
        <ToastContainer />
      </SessionInitializer>
    </QueryClientProvider>
  );
}
