// =============================================================================
// CheckoutProvider — app-level provider that renders the Razorpay-style
// checkout AND the post-payment Lucky Draw wheel, exposing openCheckout() via
// context. Any page can call useCheckout().open({...}) to launch the flow.
//
// Flow: open() → checkout modal → on simulated success → run caller's onSuccess
// → auto-open the LuckyDrawWheel (blurred backdrop + auto-spin + celebration).
// =============================================================================
import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import { RazorpayCheckout, type CheckoutDetails } from './RazorpayCheckout';
import { LuckyDrawWheel } from './LuckyDrawWheel';
import { prizeService } from '@/services/prize.service';
import { useAuthStore } from '@/stores/authStore';
import type { Prize } from '@/types';

interface OpenArgs extends CheckoutDetails {
  onSuccess: () => void | Promise<void>;
}

interface CheckoutContextValue {
  open: (args: OpenArgs) => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [args, setArgs] = useState<OpenArgs | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [wheelOpen, setWheelOpen] = useState(false);

  // Preload franchise prizes so the wheel can populate instantly on win.
  useEffect(() => {
    const fid = user?.franchiseId;
    if (!fid) return;
    void prizeService.getFranchisePrizes(fid).then(setPrizes).catch(() => setPrizes([]));
  }, [user?.franchiseId]);

  const open = useCallback((next: OpenArgs) => {
    setArgs(next);
    setIsOpen(true);
  }, []);

  const closeCheckout = useCallback(() => setIsOpen(false), []);

  const timeoutRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const handleSuccess = useCallback(() => {
    // Commit the caller's payment side-effects, then celebrate with the wheel.
    void args?.onSuccess();
    // Small delay so the checkout success screen finishes before the wheel opens.
    timeoutRef.current = window.setTimeout(() => setWheelOpen(true), 350);
  }, [args]);

  return (
    <CheckoutContext.Provider value={{ open }}>
      {children}

      {args && (
        <RazorpayCheckout
          open={isOpen}
          details={args}
          onClose={closeCheckout}
          onSuccess={handleSuccess}
        />
      )}

      <LuckyDrawWheel
        open={wheelOpen}
        prizes={prizes}
        onClose={() => setWheelOpen(false)}
      />
    </CheckoutContext.Provider>
  );
}

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within a CheckoutProvider');
  return ctx;
}
