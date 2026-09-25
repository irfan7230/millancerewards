// =============================================================================
// Data Bootstrap Service
// In development: populates localStorage with seed demo data so UI screens have
// shape when the backend is not running.
// In production: no-op. The backend is the sole source of truth; services read
// directly from the REST API and the persistence layer is not consulted.
// Called once at app startup (in AppProviders).
// =============================================================================

import { persistence, KEYS } from '@/lib/persistence';
import { generateSeedData } from '@/data/generators';

export function bootstrapData(): void {
  if (!import.meta.env.DEV) return;

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
