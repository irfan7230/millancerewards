# State Management

Zustand, split into focused stores — never one monolithic global store.

## Store boundaries

| Store | Responsibility |
|---|---|
| `authStore` | Current `AuthUser`, login/logout, role |
| `tenantStore` | Currently active franchise context (for admin viewing a specific franchise; for franchise/user roles this mirrors `authUser.franchiseId`) |
| `franchiseStore` | Franchise list/detail (Super Admin scope) |
| `userStore` | Franchise user list/detail, status transitions |
| `groupStore` | Groups, capacity/occupancy |
| `planStore` | Plans, progress calculations |
| `paymentStore` | Payment records, payment simulation actions |
| `drawStore` | Draw scheduling, execution, results, in-progress draw UI state |
| `vaultStore` | Vault balances, transaction history |
| `productStore` | Product catalog, purchases |
| `notificationStore` | Per-role notification feed, read/unread |
| `demoClockStore` | Current simulated month/date, "advance month" action |
| `uiStore` | Cross-cutting UI state: active dialogs/drawers, toast queue, sidebar collapsed state |

## Conventions

- Each store exposes **state** (data + `status: 'idle' | 'loading' | 'success' | 'error'` + `error?`) and **actions** (async functions that call the matching service, then update state).
- Stores never call `localStorage`/`indexedDB` directly — only services do, via the persistence adapter (`MOCK-DATA.md`).
- Cross-store side effects (e.g. running a draw affects `drawStore`, `userStore`, `vaultStore`, `notificationStore`, and the activity log) are orchestrated by a single action (e.g. `drawStore.executeDraw`) that calls the relevant services in sequence, not by stores subscribing to each other implicitly. Keep the effect chain explicit and readable in one place.
- Selectors: prefer small selector hooks (`useVaultBalance(userId)`) over pulling the whole store and destructuring in components, to avoid unnecessary re-renders.
- No business logic inside store files beyond orchestration — the actual rules (eligibility, prize assignment, capacity checks) live in services / `src/lib/engine`.

## Example shape

```ts
interface DrawStoreState {
  draws: Draw[];
  activeDraw: Draw | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

interface DrawStoreActions {
  loadDraws: (franchiseId: string) => Promise<void>;
  executeDraw: (groupId: string, planId: string) => Promise<Draw>;
  clearActiveDraw: () => void;
}
```
