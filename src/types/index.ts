// =============================================================================
// Millance Lucky Draw — Domain Types
// Source of truth: DATA-MODEL.md
// All types are exported from this barrel file.
// =============================================================================

// ---------------------------------------------------------------------------
// Roles & Auth
// ---------------------------------------------------------------------------

export type Role = 'super_admin' | 'franchise' | 'user';

export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  email: string;
  /** Present for 'franchise' and 'user' roles */
  franchiseId?: string;
  planId?: string;
  groupId?: string;
  groupName?: string;
  hasWon?: boolean;
  status?: UserStatus;
  joinedAt?: string;
  phone?: string;
}

// ---------------------------------------------------------------------------
// Franchise (Tenant)
// ---------------------------------------------------------------------------

export interface Franchise {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Group Types (data-driven config — not hardcoded in UI logic)
// ---------------------------------------------------------------------------

export interface GroupType {
  id: string; // 'group-a' | 'group-b' | future
  name: string; // "Group A"
  capacity: number; // 500 | 1000
  description: string;
}

export interface Group {
  id: string;
  franchiseId: string;
  groupTypeId: string;
  name: string;
  /** Derived/cached; kept in sync by services */
  memberCount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export interface Plan {
  id: string;
  franchiseId: string;
  groupId: string;
  name: string;
  groupType: string; // GroupType.id
  durationMonths: number;
  monthlyAmount: number;
  totalAmount: number; // monthlyAmount * durationMonths
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate: string;
  endDate: string;
  /** Derived from demo clock relative to startDate */
  currentMonth: number;
}

// ---------------------------------------------------------------------------
// Users (per-plan status, not global)
// ---------------------------------------------------------------------------

export type UserStatus =
  | 'ACTIVE'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'DRAW_ELIGIBLE'
  | 'WINNER'
  | 'INACTIVE'
  | 'PLAN_COMPLETED';

export interface FranchiseUser {
  id: string;
  franchiseId: string;
  groupId: string;
  planId: string;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  joinedAt: string;
  /** Convenience flag; source of truth is Winner records in Draw */
  hasWon: boolean;

  // ── Extended profile (collected at member onboarding) ──────────────────
  // Optional on the type so existing seed data stays valid, but the creation
  // form collects them as mandatory (KYC + prize delivery + nominee).
  /** Date of birth — ISO date (YYYY-MM-DD). Used for 18+ eligibility. */
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  /** WhatsApp / alternate contact number */
  altPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  /** 6-digit postal code (prize delivery) */
  pincode?: string;
  /** KYC: PAN (income-tax id) — required for reward payouts in India */
  pan?: string;
  /** KYC: last 4 digits of Aadhaar / national ID (never store a full id in mock) */
  idLast4?: string;
  /** Nominee for the savings scheme */
  nomineeName?: string;
  nomineeRelation?: string;
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Skipped';

export interface Payment {
  id: string;
  franchiseId: string;
  userId: string;
  planId: string;
  /** 1-indexed cycle month */
  month: number;
  periodLabel: string; // "October 2026"
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  dueDate: string;
}

// ---------------------------------------------------------------------------
// Vault
// ---------------------------------------------------------------------------

export type VaultTransactionType =
  | 'monthly_contribution'
  | 'lucky_draw_prize'
  | 'prize_deduction'
  | 'product_purchase'
  | 'refund'
  | 'adjustment';

export interface VaultTransaction {
  id: string;
  userId: string;
  type: VaultTransactionType;
  /** Signed: positive = credit, negative = debit */
  amount: number;
  balanceAfter: number;
  createdAt: string;
  meta?: {
    drawId?: string;
    prizeId?: string;
    productId?: string;
    note?: string;
  };
}

export interface Vault {
  userId: string;
  balance: number;
  /** Derived/cached */
  totalContributed: number;
  /** Derived/cached */
  totalUsed: number;
  transactions: VaultTransaction[];
}

// ---------------------------------------------------------------------------
// Prizes
// ---------------------------------------------------------------------------

export interface Prize {
  id: string;
  franchiseId: string;
  name: string;
  description: string;
  imageUrl?: string;
  value: number;
  /** False once the prize has been awarded in a draw */
  isAvailable: boolean;
}

// ---------------------------------------------------------------------------
// Lucky Draw
// ---------------------------------------------------------------------------

export interface DrawWinner {
  userId: string;
  prizeId: string;
  /** 1..10, order of reveal */
  rank: number;
}

export type DrawStatus = 'scheduled' | 'in_progress' | 'completed';

export interface Draw {
  id: string;
  franchiseId: string;
  groupId: string;
  planId: string;
  month: number;
  periodLabel: string;
  status: DrawStatus;
  /** Snapshot of eligible user IDs at time of execution */
  eligibleUserIds: string[];
  winners: DrawWinner[];
  executedAt?: string;
}

/** Returned when a draw cannot proceed */
export interface DrawBlockedResult {
  status: 'blocked';
  reason: 'insufficient_participants' | 'already_completed' | 'insufficient_prizes';
  eligibleCount: number;
  requiredCount: number;
}

/** Returned when a draw completes successfully */
export interface DrawCompletedResult {
  status: 'completed';
  draw: Draw;
}

export type DrawResult = DrawBlockedResult | DrawCompletedResult;

// ---------------------------------------------------------------------------
// Products & Purchases
// ---------------------------------------------------------------------------

export interface Product {
  id: string;
  /** undefined = global Millance catalog */
  franchiseId?: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  category: string;
  inStock: boolean;
}

export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  price: number;
  createdAt: string;
  vaultTransactionId: string;
}

// ---------------------------------------------------------------------------
// Store Vouchers — a member generates a QR voucher from their vault balance
// and redeems it at a physical Millance store. The franchise validates it and
// bills against it. `value` is the max redeemable amount the voucher authorizes.
// ---------------------------------------------------------------------------

export type VoucherStatus = 'active' | 'redeemed' | 'expired';

export interface Voucher {
  id: string;
  /** Human-readable code shown on the voucher (e.g. MLN-8F3A-52K9) */
  code: string;
  userId: string;
  franchiseId: string;
  /** Authorized max amount */
  value: number;
  status: VoucherStatus;
  issuedAt: string;
  expiresAt: string;
  /** Set when redeemed at a store */
  redeemedAt?: string;
  /** Actual amount billed at the store (≤ value) */
  redeemedAmount?: number;
  /** Vault transaction that recorded the deduction */
  vaultTransactionId?: string;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationKind =
  | 'payment_success'
  | 'draw_completed'
  | 'prize_won'
  | 'payment_due'
  | 'plan_milestone'
  | 'plan_completed'
  | 'purchase_success';

export interface NotificationEvent {
  id: string;
  audienceRole: Role;
  franchiseId?: string;
  userId?: string;
  kind: NotificationKind;
  message: string;
  createdAt: string;
  read: boolean;
}

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------

export interface ActivityLogEntry {
  id: string;
  franchiseId?: string;
  actorRole: Role;
  /** Stable event name, e.g. 'draw.completed' */
  action: string;
  targetType: string; // 'user' | 'draw' | 'plan' | ...
  targetId: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------
// Platform Settings — admin-configurable, persisted platform configuration.
// Backend-ready: mirrors what a real /api/settings endpoint would return.
// ---------------------------------------------------------------------------

export interface PlatformSettings {
  // General
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  currency: 'INR' | 'USD';
  timezone: string;
  maintenanceMode: boolean;
  /** When true, new members cannot be onboarded platform-wide */
  registrationOpen: boolean;

  // Draw configuration (platform defaults / rules)
  winnersPerDraw: number;
  drawDayOfMonth: number; // 1..28
  paymentDueDayOfMonth: number; // 1..28
  voucherValidHours: number;

  // Notification channels (platform-level toggles)
  notifyEmail: boolean;
  notifySms: boolean;
  notifyPush: boolean;

  // Security / compliance display toggles
  requireKyc: boolean;

  /** ISO timestamp of the last save */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Service Input Types (mirrors FUTURE-BACKEND-INTEGRATION.md)
// ---------------------------------------------------------------------------

export interface NewFranchiseInput {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
}

export interface NewGroupInput {
  franchiseId: string;
  groupTypeId: string;
  name: string;
}

export interface NewPlanInput {
  franchiseId: string;
  groupId: string;
  name: string;
  groupType: string;
  durationMonths: number;
  monthlyAmount: number;
  startDate: string;
}

export interface NewUserInput {
  franchiseId: string;
  groupId: string;
  planId: string;
  name: string;
  email: string;
  phone: string;
  // Mandatory onboarding data (KYC + delivery + nominee)
  dob: string;
  gender: 'male' | 'female' | 'other';
  altPhone?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  pan: string;
  idLast4: string;
  nomineeName: string;
  nomineeRelation: string;
}
