// =============================================================================
// Data Bootstrap Service
// Checks if seed data exists in persistence; if not, generates and stores it.
// Called once at app startup (in AppProviders).
// =============================================================================

import { persistence, KEYS } from '@/lib/persistence';
import { generateSeedData, DEMO_START_DATE } from '@/data/generators';
import type { DemoClock } from '@/types';

export function bootstrapData(): void {
  const alreadySeeded = persistence.get<boolean>(KEYS.SEEDED);
  if (alreadySeeded) return;

  const seed = generateSeedData();

  persistence.set(KEYS.FRANCHISES,    seed.franchises);
  persistence.set(KEYS.GROUPS,        seed.groups);
  persistence.set(KEYS.PLANS,         seed.plans);
  persistence.set(KEYS.USERS,         seed.users);
  persistence.set(KEYS.PAYMENTS,      seed.payments);
  persistence.set(KEYS.VAULTS,        seed.vaults);
  persistence.set(KEYS.PRIZES,        seed.prizes);
  persistence.set(KEYS.DRAWS,         seed.draws);
  persistence.set(KEYS.PRODUCTS,      seed.products);
  persistence.set(KEYS.PURCHASES,     seed.purchases);
  persistence.set(KEYS.NOTIFICATIONS, seed.notifications);
  persistence.set(KEYS.ACTIVITY_LOG,  seed.activityLog);

  // Demo clock starts at seed date
  const clock: DemoClock = {
    currentDate: DEMO_START_DATE,
    currentPeriodLabel: new Date(DEMO_START_DATE).toLocaleString('en-IN', {
      month: 'long',
      year: 'numeric',
    }),
  };
  persistence.set(KEYS.DEMO_CLOCK, clock);
  persistence.set(KEYS.SEEDED, true);
}

/** Hard reset — clears persisted state and re-seeds. Call from demo controls. */
export function resetDemoData(): void {
  persistence.clear();
  bootstrapData();
  // Reload the page so all stores re-initialize from fresh persistence
  window.location.reload();
}
