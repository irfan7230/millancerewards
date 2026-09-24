// =============================================================================
// Data Bootstrap Service
// Checks if seed data exists in persistence; if not, generates and stores it.
// Called once at app startup (in AppProviders).
// In production this is replaced by API calls that hydrate the store on login.
// =============================================================================

import { persistence, KEYS } from '@/lib/persistence';
import { generateSeedData } from '@/data/generators';

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

  persistence.set(KEYS.SEEDED, true);
}
