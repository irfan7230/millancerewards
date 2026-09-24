// =============================================================================
// Demo Clock Store — the ONLY mechanism for advancing simulated time
// DEVELOPMENT.md §Demo/simulation controls
// =============================================================================
import { create } from 'zustand';
import type { DemoClock } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';
import { DEMO_START_DATE } from '@/data/generators';
import { planService } from '@/services/plan.service';
import { paymentService } from '@/services/payment.service';
import { userService } from '@/services/user.service';

function loadClock(): DemoClock {
  return persistence.get<DemoClock>(KEYS.DEMO_CLOCK) ?? {
    currentDate: DEMO_START_DATE,
    currentPeriodLabel: new Date(DEMO_START_DATE).toLocaleString('en-IN', {
      month: 'long',
      year: 'numeric',
    }),
  };
}

interface DemoClockState {
  clock: DemoClock;
  advancing: boolean;
}

interface DemoClockActions {
  advanceMonth: () => Promise<void>;
  resetClock: () => void;
}

export const useDemoClockStore = create<DemoClockState & DemoClockActions>()((set, get) => ({
  clock: loadClock(),
  advancing: false,

  advanceMonth: async () => {
    if (get().advancing) return;
    set({ advancing: true });
    try {
      const { clock } = get();
      const next = new Date(clock.currentDate);
      next.setMonth(next.getMonth() + 1);
      const nextDate = next.toISOString();
      const nextLabel = next.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

      const newClock: DemoClock = { currentDate: nextDate, currentPeriodLabel: nextLabel };
      persistence.set(KEYS.DEMO_CLOCK, newClock);

      // Advance all active plan months
      await planService.advancePlanMonths();

      // Generate new pending payments for all active users
      const plans = await planService.getAllPlans();
      const users = await userService.getAllUsers();
      const newPayments = [];
      for (const plan of plans.filter(p => p.status === 'active')) {
        const planUsers = users.filter(u => u.planId === plan.id && u.status !== 'INACTIVE' && u.status !== 'WINNER' && u.status !== 'PLAN_COMPLETED');
        for (const user of planUsers) {
          newPayments.push({
            id: `pay-${Date.now()}-${user.id}`,
            franchiseId: user.franchiseId,
            userId: user.id,
            planId: plan.id,
            month: plan.currentMonth + 1,
            periodLabel: nextLabel,
            amount: plan.monthlyAmount,
            status: 'Pending' as const,
            dueDate: nextDate,
          });
        }
      }
      if (newPayments.length > 0) {
        await paymentService.batchCreatePayments(newPayments);
      }

      set({ clock: newClock, advancing: false });
    } catch {
      set({ advancing: false });
    }
  },

  resetClock: () => {
    const initial: DemoClock = {
      currentDate: DEMO_START_DATE,
      currentPeriodLabel: new Date(DEMO_START_DATE).toLocaleString('en-IN', {
        month: 'long',
        year: 'numeric',
      }),
    };
    persistence.set(KEYS.DEMO_CLOCK, initial);
    set({ clock: initial });
  },
}));
