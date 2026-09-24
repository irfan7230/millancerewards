# Lucky Draw Engine

Location: `src/lib/engine/luckyDraw.ts` (+ supporting functions in the same folder). Pure functions where possible, called from `drawService`/`drawStore`.

## Inputs

- `groupId`, `planId`, `month` (the cycle being drawn)
- The full user roster for that plan (from `userService`)
- Payment records for that month (from `paymentService`)
- Prior draws for that plan (from `drawService`) — to exclude previous winners
- The prize pool available to the franchise (`prizeService`)

## Algorithm

```ts
function simulateLuckyDraw(input: {
  groupId: string;
  planId: string;
  month: number;
}): DrawResult {
  // 1. Load all users on this plan
  // 2. Filter to eligible:
  //    - payment for `month` has status === 'Paid'
  //    - user.status !== 'INACTIVE' and !== 'WINNER' for this plan
  //    - user has not won in ANY prior draw for this plan
  // 3. If eligible.length < 10 → return an "insufficient participants" result
  //    (status: 'blocked', eligibleCount, requiredCount: 10) — do NOT proceed
  // 4. If a draw already exists for (groupId, planId, month) with status
  //    'completed' → return that existing result (idempotent), do NOT re-run
  // 5. Randomly select 10 unique users from eligible (see "Randomness" below)
  // 6. Randomly assign 10 unique prizes from the franchise prize pool to the
  //    10 winners (1:1, no repeats)
  // 7. For each winner, in order:
  //      a. Create vault transaction: type 'lucky_draw_prize', amount = 0 (informational) or prize value, per franchise convention
  //      b. Create vault transaction: type 'prize_deduction', amount = -currentBalance, bringing balance to 0
  //      c. Set user.status = 'WINNER', then 'INACTIVE'
  //      d. Exclude user from all future eligibility for this plan (enforced by
  //         step 2's "won in any prior draw" check on future runs)
  // 8. Persist the Draw record: status 'completed', eligibleUserIds snapshot,
  //    winners[] (userId, prizeId, rank 1..10), executedAt
  // 9. Emit notifications: one per winner ("You won {prize}"), one franchise-level
  //    summary ("Draw completed for {group}, {month}")
  // 10. Append activity log entries: 'draw.completed', one 'user.won' per winner
  // 11. Update cached dashboard stats (active/inactive counts, prizes distributed)
  return completedDrawResult;
}
```

## Randomness

- Use a seedable PRNG (e.g. a small mulberry32/xorshift implementation) wrapped as `pickRandomUnique(items, count, seed?)`.
- Default calls use a non-deterministic seed (`Date.now()`/`crypto`) so real draws feel genuinely random to the user.
- Seed data generation (`MOCK-DATA.md`) and any automated tests use a **fixed** seed through the same function, so historical/seed draws are reproducible.
- Never hardcode winner IDs anywhere in engine code — selection must run against whatever the current eligible pool is.

## Step-by-step UI (see `BUSINESS-LOGIC.md` §Lucky draw for the underlying rules)

1. **Draw preparation screen** — shows group, plan, period, eligible participant count, and a primary "Run Draw" action (disabled + explained if `eligible < 10` or draw already completed).
2. **Animated selection experience** — an engaging, on-brand animation (e.g. shuffling/rolling through eligible user cards) that visually resolves to the 10 selected winners. This is a presentation layer on top of a selection that has **already been computed** by `simulateLuckyDraw` — the animation dramatizes a real result, it does not pretend to compute it live.
3. **Winner reveal** — winners revealed one at a time (rank 1→10) with their assigned prize, building anticipation; supports skip/reduced-motion for accessibility.
4. **Final summary** — full winner list with prize mapping, eligible-pool size, timestamp, and a persistent link to this draw's detail page (`/franchise/draws/:id`).
5. **Draw completion state** — the draw is now locked (idempotent re-run returns the same completed result); subsequent visits to this period show the recorded outcome, not a re-runnable form.

## Guarantees the engine must uphold

- Exactly 10 unique winners, 10 unique prizes, when `eligible.length >= 10`.
- No user ever wins twice within the same plan.
- No draw ever executes twice for the same group/month.
- Every winner's vault reaches exactly ₹0 and every non-winner's vault is untouched by the draw.
- Every execution is fully explainable from the persisted `Draw` record (eligible snapshot + winners + prizes + timestamp) — no hidden state.
