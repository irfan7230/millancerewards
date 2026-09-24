# Data Model

All types live under `src/types/`, one file per domain concept, re-exported from `src/types/index.ts`. Use discriminated unions where a field's shape depends on a `type`/`status` value (e.g. `VaultTransaction`, `NotificationEvent`). Avoid `any`; prefer `unknown` + narrowing for genuinely dynamic payloads (e.g. `meta` fields).

## Core types

```ts
type Role = 'super_admin' | 'franchise' | 'user';

interface AuthUser {
  id: string;
  role: Role;
  name: string;
  email: string;
  franchiseId?: string;   // present for 'franchise' and 'user' roles
}

interface Franchise {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

interface GroupType {
  id: string;              // 'group-a' | 'group-b' | future types
  name: string;             // "Group A"
  capacity: number;          // 500 | 1000
  description: string;
}

interface Group {
  id: string;
  franchiseId: string;
  groupTypeId: string;
  name: string;
  memberCount: number;       // derived, but cached for display
  createdAt: string;
}

interface Plan {
  id: string;
  franchiseId: string;
  groupId: string;
  name: string;
  groupType: string;         // GroupType.id
  durationMonths: number;
  monthlyAmount: number;
  totalAmount: number;
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate: string;
  endDate: string;
  currentMonth: number;        // derived from demo clock
}

type UserStatus =
  | 'ACTIVE'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'DRAW_ELIGIBLE'
  | 'WINNER'
  | 'INACTIVE'
  | 'PLAN_COMPLETED';

interface FranchiseUser {
  id: string;
  franchiseId: string;
  groupId: string;
  planId: string;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  joinedAt: string;
  hasWon: boolean;             // convenience flag; source of truth is Winner records
}

type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Skipped';

interface Payment {
  id: string;
  franchiseId: string;
  userId: string;
  planId: string;
  month: number;                // 1-indexed cycle month
  periodLabel: string;           // "October 2026"
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  dueDate: string;
}

type VaultTransactionType =
  | 'monthly_contribution'
  | 'lucky_draw_prize'
  | 'prize_deduction'
  | 'product_purchase'
  | 'refund'
  | 'adjustment';

interface VaultTransaction {
  id: string;
  userId: string;
  type: VaultTransactionType;
  amount: number;                // signed: positive = credit, negative = debit
  balanceAfter: number;
  createdAt: string;
  meta?: { drawId?: string; prizeId?: string; productId?: string; note?: string };
}

interface Vault {
  userId: string;
  balance: number;
  totalContributed: number;       // derived, cached
  totalUsed: number;               // derived, cached
  transactions: VaultTransaction[];
}

interface Prize {
  id: string;
  franchiseId: string;
  name: string;
  description: string;
  imageUrl?: string;
  value: number;
}

interface DrawWinner {
  userId: string;
  prizeId: string;
  rank: number;                    // 1..10, order of reveal
}

type DrawStatus = 'scheduled' | 'in_progress' | 'completed';

interface Draw {
  id: string;
  franchiseId: string;
  groupId: string;
  planId: string;
  month: number;
  periodLabel: string;
  status: DrawStatus;
  eligibleUserIds: string[];       // snapshot at time of execution
  winners: DrawWinner[];
  executedAt?: string;
}

interface Product {
  id: string;
  franchiseId?: string;             // undefined = global Millance catalog
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  category: string;
  inStock: boolean;
}

interface Purchase {
  id: string;
  userId: string;
  productId: string;
  price: number;
  createdAt: string;
  vaultTransactionId: string;
}

interface NotificationEvent {
  id: string;
  audienceRole: Role;
  franchiseId?: string;
  userId?: string;
  kind:
    | 'payment_success'
    | 'draw_completed'
    | 'prize_won'
    | 'payment_due'
    | 'plan_milestone'
    | 'plan_completed'
    | 'purchase_success';
  message: string;
  createdAt: string;
  read: boolean;
}

interface ActivityLogEntry {
  id: string;
  franchiseId?: string;
  actorRole: Role;
  action: string;                   // stable event name, e.g. 'draw.completed'
  targetType: string;                // 'user' | 'draw' | 'plan' | ...
  targetId: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}
```

## Relationships

- `Franchise 1—N Group`, `Group 1—N Plan` (a plan is scoped to one group), `Plan 1—N FranchiseUser`.
- `FranchiseUser 1—1 Vault`, `Vault 1—N VaultTransaction`.
- `Plan 1—N Payment` (one payment row per user per month), `FranchiseUser 1—N Payment`.
- `Group 1—N Draw` (one draw per group per month), `Draw 1—10 DrawWinner`, `DrawWinner N—1 Prize`.
- `FranchiseUser 1—N Purchase`, `Purchase 1—1 VaultTransaction` (the debit that funded it).

## Notes for the build agent

- Derived/cached fields (`memberCount`, `currentMonth`, `totalContributed`, `totalUsed`) must be recomputed by services/engine functions, not hand-edited by components — treat them as read models kept in sync by the mock persistence layer.
- Keep IDs as opaque strings (`crypto.randomUUID()` or a small deterministic ID generator for seed data — see `MOCK-DATA.md`).
