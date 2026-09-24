# Mock Data & Persistence

## Principles

- No mock arrays inside components. All seed data lives in `src/data/*.ts`, one file per domain, and is only ever consumed through `src/services/*.service.ts`.
- Seed data must be **deterministic** (fixed seed for any randomness used during generation) so the demo is reproducible across reloads and across machines.
- Seed data must be **realistic in volume**, not a token handful of rows.

## Minimum volumes

- 5+ franchises
- 10+ groups (mix of Group A / Group B across franchises)
- 100+ franchise users, distributed across groups with realistic status spread (some ACTIVE, some mid-plan, a handful WINNER/INACTIVE, a few PLAN_COMPLETED)
- Multiple plans (varying duration/monthly amount) per franchise
- Multiple months of payment history per user (so tables/charts have real history to render, not just month 1)
- Vault transactions consistent with that payment history
- Multiple completed draw histories with winners + prizes already assigned, plus at least one upcoming/eligible-but-not-yet-run draw
- 10+ prizes
- A product catalog (10–20 products across a few categories)
- A realistic notification backlog per role

## Generation strategy

- Write small deterministic generator functions (`generateUsers(count, seed)`, etc.) in `src/data/generators/` rather than hand-typing 100 literal user objects. Seed with a fixed constant so output is stable.
- Compose: franchises → groups (per franchise) → plans (per group) → users (per plan, respecting group capacity) → payments (per user, for months elapsed so far) → vault transactions (derived from payments + any historical draw wins) → draws (for past months) → notifications/activity log (derived from the above, not independently invented).
- Derived fields (vault balance, memberCount, currentMonth) are computed once at generation time and then kept in sync by the persistence layer as the user interacts with the app (see below) — they are never a second, independently-maintained source of truth.

## Persistence abstraction

Location: `src/lib/persistence/`.

```ts
interface PersistenceAdapter {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}
```

- Default implementation: `localStorageAdapter` (JSON-serialized). If a dataset risks exceeding localStorage's practical size, use an `indexedDbAdapter` behind the same interface instead — the choice is an implementation detail behind this interface, not something services or components know about.
- On first load, if no persisted state exists, the store is seeded from `src/data/*` (via the generators). On subsequent loads, persisted state wins over seed data.
- Every simulated mutation (payment, draw execution, vault transaction, purchase, plan advance) is written through this adapter so a refresh does not lose state.
- Provide a **"Reset demo data"** action (clearly labeled, tucked into a settings/demo panel, never a primary nav item) that clears persisted state and reseeds from `src/data/*`. This is essential for development and for demoing the app repeatedly.

## Why this matters for the future backend swap

Services should read/write through the persistence adapter and never assume localStorage specifically. When a real backend exists, the same service function signatures stay, and only their internal implementation changes from "read persistence adapter" to "call REST API" (see `FUTURE-BACKEND-INTEGRATION.md`). Do not let components or stores talk to `localStorage` directly.
