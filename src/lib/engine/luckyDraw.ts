// =============================================================================
// Lucky Draw Engine — pure functions
// Source of truth: LUCKY-DRAW-ENGINE.md
//
// Called by drawService only. Components never import from here directly.
// =============================================================================

import type { Draw, DrawWinner, FranchiseUser, Payment, Prize, DrawResult } from '@/types';
import { createPRNG, pickUnique } from '@/data/generators/utils';

// ---------------------------------------------------------------------------
// Seedable PRNG wrapper (re-exported for use in draw animation)
// ---------------------------------------------------------------------------

/**
 * Pick `count` unique items from `arr` using a non-deterministic seed
 * (Date.now XOR crypto random 32-bit) so live draws are genuinely random.
 */
export function pickRandomUnique<T>(arr: T[], count: number, seed?: number): T[] {
  const s =
    seed ??
    (Date.now() ^
      (typeof crypto !== 'undefined'
        ? (crypto.getRandomValues(new Uint32Array(1))[0])
        : Math.floor(Math.random() * 0xffffffff)));
  const rng = createPRNG(s);
  return pickUnique(arr, count, rng);
}

// ---------------------------------------------------------------------------
// Core algorithm
// ---------------------------------------------------------------------------

export interface DrawInput {
  groupId: string;
  planId: string;
  month: number;
  franchiseId: string;
  allPlanUsers: FranchiseUser[];
  monthPayments: Payment[];
  priorDraws: Draw[];
  prizePool: Prize[];
}

/**
 * simulateLuckyDraw — the heart of the lucky draw engine.
 *
 * Pure function: takes snapshot data, returns a DrawResult.
 * Side effects (persisting Draw record, updating vaults, emitting
 * notifications) are handled by drawService AFTER calling this.
 */
export function simulateLuckyDraw(input: DrawInput): DrawResult {
  const {
    groupId,
    planId,
    month,
    franchiseId,
    allPlanUsers,
    monthPayments,
    priorDraws,
    prizePool,
  } = input;

  // Step 4: Idempotency — if a completed draw already exists, return it
  const existing = priorDraws.find(
    d => d.groupId === groupId && d.planId === planId && d.month === month && d.status === 'completed',
  );
  if (existing) {
    return { status: 'completed', draw: existing };
  }

  // Step 2: Build eligible set
  // — payment for `month` has status === 'Paid'
  const paidUserIds = new Set(
    monthPayments.filter(p => p.status === 'Paid').map(p => p.userId),
  );
  // — never won in any prior draw for this plan
  const priorWinnerIds = new Set(
    priorDraws
      .filter(d => d.planId === planId && d.status === 'completed')
      .flatMap(d => d.winners.map(w => w.userId)),
  );
  // — not INACTIVE or WINNER status
  const eligible = allPlanUsers.filter(
    u =>
      paidUserIds.has(u.id) &&
      !priorWinnerIds.has(u.id) &&
      u.status !== 'INACTIVE' &&
      u.status !== 'WINNER',
  );

  // Step 3: Insufficient participants guard
  if (eligible.length < 10) {
    return {
      status: 'blocked',
      reason: 'insufficient_participants',
      eligibleCount: eligible.length,
      requiredCount: 10,
    };
  }

  // Prize pool guard
  if (prizePool.length < 10) {
    return {
      status: 'blocked',
      reason: 'insufficient_prizes',
      eligibleCount: eligible.length,
      requiredCount: 10,
    };
  }

  // Steps 5–6: Random selection — computed first, animation dramatises the result
  const selectedUsers = pickRandomUnique(eligible, 10);
  const selectedPrizes = pickRandomUnique(prizePool, 10);

  const winners: DrawWinner[] = selectedUsers.map((user, i) => ({
    userId: user.id,
    prizeId: selectedPrizes[i].id,
    rank: i + 1,
  }));

  const now = new Date().toISOString();

  const draw: Draw = {
    id: `drw-live-${now}`,
    franchiseId,
    groupId,
    planId,
    month,
    periodLabel: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
    status: 'completed',
    eligibleUserIds: eligible.map(u => u.id),
    winners,
    executedAt: now,
  };

  return { status: 'completed', draw };
}

/**
 * Check eligibility without running the draw.
 * Used by the draw preparation screen.
 */
export function checkDrawEligibility(input: Omit<DrawInput, 'prizePool'>): {
  eligibleCount: number;
  priorWinnerIds: string[];
  alreadyCompleted: boolean;
} {
  const { groupId, planId, month, allPlanUsers, monthPayments, priorDraws } = input;

  const alreadyCompleted = priorDraws.some(
    d => d.groupId === groupId && d.planId === planId && d.month === month && d.status === 'completed',
  );

  const paidUserIds = new Set(
    monthPayments.filter(p => p.status === 'Paid').map(p => p.userId),
  );
  const priorWinnerIds = priorDraws
    .filter(d => d.planId === planId && d.status === 'completed')
    .flatMap(d => d.winners.map(w => w.userId));
  const priorWinnerSet = new Set(priorWinnerIds);

  const eligibleCount = allPlanUsers.filter(
    u =>
      paidUserIds.has(u.id) &&
      !priorWinnerSet.has(u.id) &&
      u.status !== 'INACTIVE' &&
      u.status !== 'WINNER',
  ).length;

  return { eligibleCount, priorWinnerIds, alreadyCompleted };
}
