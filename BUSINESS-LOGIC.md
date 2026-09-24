# Business Logic

## Hierarchy

```
Millance
 └── Super Admin
      ├── Franchise A
      │    ├── Group A (cap 500)
      │    │    ├── User 1..n
      │    └── Group B (cap 1000)
      │         ├── User 1..n
      ├── Franchise B
      └── Franchise C
```

Each franchise is a tenant. A franchise manages its own users, groups, plans, payments, prizes, and draws. Super Admin sees across all tenants; nothing else does.

## Group types

Group types are **data-driven configuration**, not hardcoded UI logic.

```ts
GroupType {
  id: string
  name: string          // "Group A", "Group B", ...
  capacity: number       // 500 for A, 1000 for B
  description: string
}
```

The architecture must support adding a `Group C` etc. without touching component code — new group types are added to configuration/data, and capacity checks read from that config.

## Plans

```ts
Plan {
  id: string
  franchiseId: string
  name: string             // "Gold 24"
  groupType: string          // references GroupType.id
  durationMonths: number
  monthlyAmount: number
  totalAmount: number        // monthlyAmount * durationMonths
  status: 'draft' | 'active' | 'completed' | 'archived'
  startDate: string
  endDate: string
}
```

UI must always surface: monthly amount, duration, total planned amount, current month, remaining months, active user count, winner count, vault amount, status.

## Monthly payment cycle

```
Month N
  User pays monthlyAmount
     ↓
  Payment status: Pending → Paid | Failed | Skipped
     ↓ (on Paid)
  Vault balance += monthlyAmount
  Vault transaction: type = 'monthly_contribution'
     ↓
  User becomes eligible for this month's draw (status → DRAW_ELIGIBLE)
```

Payment statuses: `Pending`, `Paid`, `Failed`, `Skipped`.

A user is **not** draw-eligible until the current month's payment is `Paid`. `Failed` or `Skipped` keeps them ineligible for that month (they are not removed from the plan; they can pay next cycle unless business rules for the franchise say otherwise — default: no auto-removal on a single miss).

## Vault

```ts
Vault {
  userId: string
  balance: number
  transactions: VaultTransaction[]
}

VaultTransaction {
  id: string
  userId: string
  type: 'monthly_contribution' | 'lucky_draw_prize' | 'prize_deduction' | 'product_purchase' | 'refund' | 'adjustment'
  amount: number
  balanceAfter: number
  createdAt: string
  meta?: Record<string, unknown>   // e.g. { drawId, prizeId, productId }
}
```

The vault UI must make the running total unmistakable: current balance, total contributed (lifetime), total used (lifetime), full transaction history, monthly contribution history, purchases, prize-related entries — all filterable.

## Lucky draw

Per group, per month, after the payment cycle:

```
Eligible users (DRAW_ELIGIBLE, this group, this month, never-won-in-this-plan)
     ↓
Random selection of 10 unique users
     ↓
10 unique prizes assigned, one per winner
```

Rules:
- Exactly 10 winners per draw, each a **different** user, each a **different** prize.
- A user who has already won within the current plan cannot win again (or even be selected) in a later draw of that plan.
- If eligible users < 10, do **not** force a draw. Show "Insufficient eligible participants" with the actual eligible count, and block execution.
- A draw cannot be run twice for the same group/month — the engine and UI must both prevent duplicate execution once a draw is completed for that period.

See `LUCKY-DRAW-ENGINE.md` for the full algorithm.

## Winner lifecycle

```
User wins
  → Prize assigned (vault transaction: lucky_draw_prize, then prize_deduction to zero the vault — see note below)
  → Vault balance → ₹0
  → status → WINNER, then INACTIVE
  → excluded from all future monthly payment cycles for this plan
  → excluded from all future draw eligibility for this plan
```

Note on the zero-out: model it as two transactions for auditability — a `lucky_draw_prize` entry (informational, prize awarded) and a `prize_deduction` entry that brings the balance to zero (the accumulated contributions are "cashed out" via the prize). Keep both entries in history; never silently wipe the transaction log.

`UserStatus` enum (per-plan status, not global):

```ts
type UserStatus =
  | 'ACTIVE'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'DRAW_ELIGIBLE'
  | 'WINNER'
  | 'INACTIVE'
  | 'PLAN_COMPLETED'
```

## Unselected users / plan completion

If a user pays every month for the full plan duration and never wins:

```
Plan duration reached
  → status → PLAN_COMPLETED
  → vault balance remains at full accumulated total (e.g. 24 × ₹2,000 = ₹48,000)
  → user may redeem vault balance in the product marketplace
```

## Product redemption

```
Browse products → View product → Check vault balance → Purchase → Deduct vault balance → Create vault transaction (product_purchase)
```

- Purchase is blocked client-side if `product.price > vault.balance`.
- A successful purchase is atomic within frontend state: balance deduction and transaction creation happen together (same store action / same service call), never as two separately-failable steps.

## Multi-tenant isolation

Every franchise-scoped read/write goes through a service function parameterized by `franchiseId`. There is no code path in the Franchise or User portals that can return another tenant's records. Super Admin has a distinct, explicitly cross-tenant set of service calls (see `ARCHITECTURE.md` and `FUTURE-BACKEND-INTEGRATION.md`).

## Edge cases the frontend must handle explicitly

| Case | Required behavior |
|---|---|
| Group at capacity (e.g. 500/500) | Block adding another user; show capacity reached state |
| Payment pending | User not draw-eligible until paid |
| Payment failed | User stays ineligible for that month's draw |
| User already won (this plan) | Never appears in future eligible pools |
| Draw already completed for group/month | Block re-running; show existing results |
| Fewer than 10 eligible users | Block draw; show "insufficient eligible participants" + count |
| Plan completed | No further payment cycles generated |
| Purchase exceeds vault balance | Block purchase, show reason |
| Product purchase | Deduct + log transaction atomically |

## Notifications (role-aware)

Examples: monthly payment successful, lucky draw completed, "You won Prize #3", payment due soon, plan milestone reached, plan completed, product purchase successful. Notifications are scoped to the role/tenant/user they belong to — a franchise never sees another franchise's notifications; a user never sees admin-level notifications.

## Audit / activity log

A simple, append-only activity feed capturing: franchise created, user registered, payment completed, draw started, winner selected, prize assigned, vault updated, product purchased, plan completed. This is the frontend stand-in for a future backend audit log — write it as if it will be replayed against a real audit table later (stable event names, structured payloads, timestamps).
