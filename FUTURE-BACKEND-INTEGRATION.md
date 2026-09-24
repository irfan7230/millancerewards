# Future Backend Integration

## Principle

Every service is defined as an **interface** first; the current implementation is a mock backed by the persistence adapter (`MOCK-DATA.md`). A later real implementation swaps the internals only — call sites in stores/components do not change.

```ts
interface UserService {
  getFranchiseUsers(franchiseId: string): Promise<FranchiseUser[]>;
  getUser(id: string): Promise<FranchiseUser>;
  updateUserStatus(id: string, status: UserStatus): Promise<FranchiseUser>;
}

interface DrawService {
  getFranchiseDraws(franchiseId: string): Promise<Draw[]>;
  getDraw(id: string): Promise<Draw>;
  executeDraw(groupId: string, planId: string, month: number): Promise<Draw>;
}

interface VaultService {
  getVault(userId: string): Promise<Vault>;
  getTransactions(userId: string): Promise<VaultTransaction[]>;
  applyTransaction(userId: string, tx: Omit<VaultTransaction, 'id' | 'balanceAfter'>): Promise<Vault>;
}

interface PaymentService {
  getFranchisePayments(franchiseId: string): Promise<Payment[]>;
  simulatePayment(paymentId: string, outcome: PaymentStatus): Promise<Payment>;
}

interface FranchiseService {
  getFranchises(): Promise<Franchise[]>;               // Super Admin only
  getFranchise(id: string): Promise<Franchise>;
  createFranchise(input: NewFranchiseInput): Promise<Franchise>;
  updateFranchise(id: string, input: Partial<Franchise>): Promise<Franchise>;
  suspendFranchise(id: string): Promise<Franchise>;
}

interface GroupService {
  getFranchiseGroups(franchiseId: string): Promise<Group[]>;
  createGroup(input: NewGroupInput): Promise<Group>;
}

interface PlanService {
  getFranchisePlans(franchiseId: string): Promise<Plan[]>;
  createPlan(input: NewPlanInput): Promise<Plan>;
  updatePlan(id: string, input: Partial<Plan>): Promise<Plan>;
}

interface ProductService {
  getProducts(franchiseId?: string): Promise<Product[]>;
  purchase(userId: string, productId: string): Promise<Purchase>;
}

interface AuthService {
  login(role: Role, credentials: { email: string; password?: string }): Promise<AuthUser>;
  logout(): Promise<void>;
  getSession(): Promise<AuthUser | null>;
}
```

Every implementation of these interfaces lives in `src/services/*.service.ts` today as a **mock implementation**: reads/writes go through the persistence adapter, business rules run through `src/lib/engine`, and tenant filtering (`franchiseId` params) is enforced inside the function body, not left to the caller.

## Anticipated REST surface (not called yet — shape only)

```
/api/auth
/api/franchises
/api/users
/api/groups
/api/plans
/api/payments
/api/draws
/api/prizes
/api/vaults
/api/products
/api/reports
```

Design service function signatures to map cleanly onto this surface later (one function ≈ one endpoint, `franchiseId`/`id` params ≈ path params, filters ≈ query params) so the eventual swap is a mechanical implementation change, not a redesign.

## What changes later vs. what doesn't

**Changes when a real backend arrives:**
- Internals of each `*.service.ts` (fetch calls instead of persistence-adapter reads/writes).
- `authService` swaps mock session handling for real token-based auth.
- The lucky draw's *execution* may move server-side for integrity, but `drawService.executeDraw`'s signature and return shape stay the same so the UI is unaffected.

**Does not change:**
- Store shapes, component props, route structure.
- Domain types in `DATA-MODEL.md` (extend, don't redesign).
- The engine's business rules (`BUSINESS-LOGIC.md`, `LUCKY-DRAW-ENGINE.md`) — they become the server's rules too.

## Explicit non-goals right now

- No real payment gateway integration.
- No real authentication/authorization server.
- No real money movement of any kind.
- No claims in UI copy of guaranteed security, guaranteed winning odds, or regulatory compliance — those require real legal/financial review before any production launch and are out of scope for this frontend prototype.
