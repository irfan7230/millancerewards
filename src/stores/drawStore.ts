// =============================================================================
// Draw Store — orchestrates draw execution, state, and UI flow
// =============================================================================
import { create } from 'zustand';
import type { Draw, DrawResult } from '@/types';
import { drawService } from '@/services/draw.service';

interface DrawState {
  draws: Draw[];
  activeDraw: Draw | null;
  drawResult: DrawResult | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
  /** UI state for the animated draw sequence */
  drawPhase: 'idle' | 'preparing' | 'animating' | 'revealing' | 'completed';
  revealedCount: number;
}

interface DrawActions {
  loadDraws: (franchiseId: string) => Promise<void>;
  loadAllDraws: () => Promise<void>;
  executeDraw: (groupId: string, planId: string, month: number, franchiseId: string) => Promise<DrawResult>;
  setDrawPhase: (phase: DrawState['drawPhase']) => void;
  revealNext: () => void;
  clearActiveDraw: () => void;
}

export const useDrawStore = create<DrawState & DrawActions>()((set, get) => ({
  draws: [],
  activeDraw: null,
  drawResult: null,
  status: 'idle',
  drawPhase: 'idle',
  revealedCount: 0,

  loadDraws: async (franchiseId) => {
    set({ status: 'loading' });
    try {
      const draws = await drawService.getFranchiseDraws(franchiseId);
      set({ draws, status: 'success' });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : 'Failed to load draws' });
    }
  },

  loadAllDraws: async () => {
    set({ status: 'loading' });
    try {
      const draws = await drawService.getAllDraws();
      set({ draws, status: 'success' });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : 'Failed to load draws' });
    }
  },

  executeDraw: async (groupId, planId, month, franchiseId) => {
    set({ status: 'loading', drawPhase: 'preparing', drawResult: null });
    try {
      const result = await drawService.executeDraw(groupId, planId, month, franchiseId);
      if (result.status === 'completed') {
        const { draws } = get();
        set({
          drawResult: result,
          activeDraw: result.draw,
          draws: [...draws.filter(d => d.id !== result.draw.id), result.draw],
          status: 'success',
          drawPhase: 'animating',
          revealedCount: 0,
        });
      } else {
        set({ drawResult: result, status: 'success', drawPhase: 'idle' });
      }
      return result;
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : 'Draw execution failed', drawPhase: 'idle' });
      throw e;
    }
  },

  setDrawPhase: (phase) => set({ drawPhase: phase }),

  revealNext: () => {
    const { revealedCount, activeDraw } = get();
    const total = activeDraw?.winners.length ?? 0;
    if (revealedCount < total) {
      const next = revealedCount + 1;
      set({ revealedCount: next, drawPhase: next === total ? 'completed' : 'revealing' });
    }
  },

  clearActiveDraw: () => set({ activeDraw: null, drawResult: null, drawPhase: 'idle', revealedCount: 0 }),
}));
