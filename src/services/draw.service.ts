// =============================================================================
// Draw Service — orchestrates the lucky draw engine
// LUCKY-DRAW-ENGINE.md: calls simulateLuckyDraw, then persists results,
// updates user statuses, zeroes vaults, emits notifications + activity log.
// =============================================================================
import type { Draw, DrawResult, Prize } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';
import { simulateLuckyDraw, checkDrawEligibility } from '@/lib/engine/luckyDraw';
import { userService } from './user.service';
import { paymentService } from './payment.service';
import { vaultService } from './vault.service';
import { notificationService } from './notification.service';
import { activityService } from './activity.service';
import { settingsService } from './settings.service';

function delay(ms = 300): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
function getAll(): Draw[] { return persistence.get<Draw[]>(KEYS.DRAWS) ?? []; }
function saveAll(d: Draw[]): void { persistence.set(KEYS.DRAWS, d); }
function getAllPrizes(): Prize[] { return persistence.get<Prize[]>(KEYS.PRIZES) ?? []; }

export const drawService = {
  async getFranchiseDraws(franchiseId: string): Promise<Draw[]> {
    await delay();
    return getAll().filter(d => d.franchiseId === franchiseId);
  },

  async getAllDraws(): Promise<Draw[]> {
    await delay();
    return getAll();
  },

  async getDraw(id: string): Promise<Draw> {
    await delay(150);
    const found = getAll().find(d => d.id === id);
    if (!found) throw new Error(`Draw ${id} not found`);
    return found;
  },

  async getPlanDraws(planId: string): Promise<Draw[]> {
    await delay(200);
    return getAll().filter(d => d.planId === planId);
  },

  async checkEligibility(franchiseId: string, groupId: string, planId: string, month: number) {
    const allUsers = await userService.getUsersByPlan(planId);
    const allPayments = await paymentService.getPlanPayments(planId);
    const monthPayments = allPayments.filter(p => p.month === month);
    const priorDraws = getAll().filter(d => d.planId === planId);
    return checkDrawEligibility({ franchiseId, groupId, planId, month, allPlanUsers: allUsers, monthPayments, priorDraws });
  },

  /**
   * Execute a lucky draw.
   * Steps 5–11 of LUCKY-DRAW-ENGINE.md:
   * - Calls simulateLuckyDraw (pure, no side effects)
   * - Persists the Draw record
   * - Updates user statuses (WINNER → INACTIVE)
   * - Zeroes out winner vaults (two tx: lucky_draw_prize + prize_deduction)
   * - Emits notifications
   * - Appends activity log
   */
  async executeDraw(groupId: string, planId: string, month: number, franchiseId: string): Promise<DrawResult> {
    const lockKey = `draw-lock-${groupId}-${planId}-${month}`;
    if (sessionStorage.getItem(lockKey)) {
      throw new Error('A draw is already in progress for this period.');
    }
    sessionStorage.setItem(lockKey, 'true');

    try {
      await delay(800);

      const allUsers = await userService.getUsersByPlan(planId);
      const allPayments = await paymentService.getPlanPayments(planId);
      const monthPayments = allPayments.filter(p => p.month === month);
      const priorDraws = getAll().filter(d => d.planId === planId);
      const prizePool = getAllPrizes().filter(p => p.franchiseId === franchiseId);

      const settings = await settingsService.getSettings();
      const currentDate = new Date().toISOString();

      const result = simulateLuckyDraw({
        groupId,
        planId,
        month,
        franchiseId,
        allPlanUsers: allUsers,
        monthPayments,
        priorDraws,
        prizePool,
        winnersPerDraw: settings.winnersPerDraw,
        currentDate,
      });

      if (result.status === 'blocked') return result;
      if (result.status === 'completed') {
        const { draw } = result;

        // Idempotent: if already persisted, return existing
        const existing = getAll().find(d => d.id === draw.id);
        if (existing) return { status: 'completed', draw: existing };

        // Persist draw
        saveAll([...getAll(), draw]);

        try {
          // Update each winner: status → WINNER → INACTIVE, vault → 0
          for (const winner of draw.winners) {
            const prize = getAllPrizes().find(p => p.id === winner.prizeId);
            await userService.updateUserStatus(winner.userId, 'INACTIVE');
            if (prize) {
              await vaultService.zeroOutVault(winner.userId, prize.value, {
                drawId: draw.id,
                prizeId: prize.id,
              });
            }
          }

          // Notifications
          await notificationService.emit({
            audienceRole: 'franchise',
            franchiseId,
            kind: 'draw_completed',
            message: `Lucky draw for ${draw.periodLabel} completed. ${draw.winners.length} winners selected.`,
          });
          for (const winner of draw.winners) {
            const prize = getAllPrizes().find(p => p.id === winner.prizeId);
            await notificationService.emit({
              audienceRole: 'user',
              franchiseId,
              userId: winner.userId,
              kind: 'prize_won',
              message: `🎉 You won "${prize?.name ?? 'a prize'}" in the ${draw.periodLabel} lucky draw!`,
            });
          }

          // Activity log
          await activityService.log({
            franchiseId,
            actorRole: 'franchise',
            action: 'draw.completed',
            targetType: 'draw',
            targetId: draw.id,
            meta: { month, winnerCount: draw.winners.length },
          });
          for (const winner of draw.winners) {
            await activityService.log({
              franchiseId,
              actorRole: 'franchise',
              action: 'user.won',
              targetType: 'user',
              targetId: winner.userId,
              meta: { drawId: draw.id, prizeId: winner.prizeId, rank: winner.rank },
            });
          }
        } catch (e) {
          // Log partial failure for recovery
          await activityService.log({
            franchiseId,
            actorRole: 'super_admin',
            action: 'draw.error',
            targetType: 'draw',
            targetId: draw.id,
            meta: { error: e instanceof Error ? e.message : 'Unknown error during side-effects' },
          });
          throw e;
        }
      }

      return result;
    } finally {
      sessionStorage.removeItem(lockKey);
    }
  },
};
