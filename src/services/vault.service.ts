// =============================================================================
// Vault Service
// =============================================================================
import type { Vault, VaultTransaction } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';

function delay(ms = 200): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
function getAll(): Vault[] { return persistence.get<Vault[]>(KEYS.VAULTS) ?? []; }
function saveAll(d: Vault[]): void { persistence.set(KEYS.VAULTS, d); }

export const vaultService = {
  async getVault(userId: string): Promise<Vault> {
    await delay();
    const found = getAll().find(v => v.userId === userId);
    if (!found) {
      // Create an empty vault on demand
      const empty: Vault = { userId, balance: 0, totalContributed: 0, totalUsed: 0, transactions: [] };
      saveAll([...getAll(), empty]);
      return empty;
    }
    return found;
  },

  async getAllVaults(): Promise<Vault[]> {
    await delay();
    return getAll();
  },

  async getFranchiseVaults(_franchiseId: string, userIds: string[]): Promise<Vault[]> {
    await delay();
    const set = new Set(userIds);
    return getAll().filter(v => set.has(v.userId));
  },

  async getTransactions(userId: string): Promise<VaultTransaction[]> {
    await delay(150);
    const vault = await vaultService.getVault(userId);
    return vault.transactions;
  },

  /**
   * Apply a transaction to a user's vault.
   * Returns the updated Vault.
   * This is atomic within the frontend state — balance and tx created together.
   */
  async applyTransaction(
    userId: string,
    tx: Omit<VaultTransaction, 'id' | 'balanceAfter'>,
  ): Promise<Vault> {
    await delay(150);
    const all = getAll();
    const idx = all.findIndex(v => v.userId === userId);
    let vault: Vault;
    if (idx === -1) {
      vault = { userId, balance: 0, totalContributed: 0, totalUsed: 0, transactions: [] };
    } else {
      vault = { ...all[idx], transactions: [...all[idx].transactions] };
    }

    const newBalance = vault.balance + tx.amount;
    const fullTx: VaultTransaction = {
      ...tx,
      id: `vtx-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      balanceAfter: newBalance,
    };

    vault.balance = newBalance;
    vault.transactions = [...vault.transactions, fullTx];

    // Update cached aggregates
    if (tx.amount > 0) {
      vault.totalContributed += tx.amount;
    } else {
      vault.totalUsed += Math.abs(tx.amount);
    }

    if (idx === -1) {
      saveAll([...all, vault]);
    } else {
      all[idx] = vault;
      saveAll(all);
    }

    return vault;
  },

  /** Zero out a vault (for draw winners) — two transactions for auditability */
  async zeroOutVault(userId: string, prizeValue: number, meta: { drawId: string; prizeId: string }): Promise<Vault> {
    await delay(200);
    const all = getAll();
    const idx = all.findIndex(v => v.userId === userId);
    let vault: Vault = idx === -1 
      ? { userId, balance: 0, totalContributed: 0, totalUsed: 0, transactions: [] }
      : { ...all[idx], transactions: [...all[idx].transactions] };

    const tx1: VaultTransaction = {
      id: `vtx-${crypto.randomUUID()}`,
      userId,
      type: 'lucky_draw_prize',
      amount: prizeValue,
      createdAt: new Date().toISOString(),
      balanceAfter: vault.balance + prizeValue,
      meta,
    };
    
    vault.balance += prizeValue;
    vault.totalContributed += prizeValue;
    vault.transactions.push(tx1);

    const deduction = -(vault.balance);
    const tx2: VaultTransaction = {
      id: `vtx-${crypto.randomUUID()}`,
      userId,
      type: 'prize_deduction',
      amount: deduction,
      createdAt: new Date().toISOString(),
      balanceAfter: 0,
      meta: { ...meta, note: 'Prize received — vault balance zeroed per plan rules' },
    };

    vault.balance = 0;
    vault.totalUsed += Math.abs(deduction);
    vault.transactions.push(tx2);

    if (idx === -1) {
      saveAll([...all, vault]);
    } else {
      all[idx] = vault;
      saveAll(all);
    }
    return vault;
  },
};
