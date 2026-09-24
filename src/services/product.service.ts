// =============================================================================
// Product & Purchase Service
// =============================================================================
import type { Product, Purchase, Vault } from '@/types';
import { persistence, KEYS } from '@/lib/persistence';
import { vaultService } from './vault.service';
import { notificationService } from './notification.service';
import { activityService } from './activity.service';

function delay(ms = 300): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
function getProducts(): Product[] { return persistence.get<Product[]>(KEYS.PRODUCTS) ?? []; }
function getPurchases(): Purchase[] { return persistence.get<Purchase[]>(KEYS.PURCHASES) ?? []; }
function savePurchases(d: Purchase[]): void { persistence.set(KEYS.PURCHASES, d); }

export const productService = {
  async getProducts(franchiseId?: string): Promise<Product[]> {
    await delay();
    const all = getProducts();
    if (!franchiseId) return all;
    // Return global catalog + franchise-specific
    return all.filter(p => !p.franchiseId || p.franchiseId === franchiseId);
  },

  async getProduct(id: string): Promise<Product> {
    const found = getProducts().find(p => p.id === id);
    if (!found) throw new Error(`Product ${id} not found`);
    return found;
  },

  /**
   * Purchase a product — atomic: vault deduction + purchase record created
   * in the same service call. Blocks if vault balance < product price.
   */
  async purchase(
    userId: string,
    productId: string,
    franchiseId: string,
  ): Promise<{ purchase: Purchase; vault: Vault }> {
    await delay(500);

    const product = await productService.getProduct(productId);
    const vault = await vaultService.getVault(userId);

    if (!product.inStock) throw new Error('Product is out of stock');
    if (product.price > vault.balance) {
      throw new Error(
        `Insufficient vault balance. Need ₹${product.price.toLocaleString('en-IN')}, have ₹${vault.balance.toLocaleString('en-IN')}`,
      );
    }

    // Apply vault transaction FIRST
    const updatedVault = await vaultService.applyTransaction(userId, {
      userId,
      type: 'product_purchase',
      amount: -product.price,
      createdAt: new Date().toISOString(),
      meta: { productId, note: `Purchased: ${product.name}` },
    });

    // Get the tx ID just created (last transaction)
    const vaultTransactionId =
      updatedVault.transactions[updatedVault.transactions.length - 1].id;

    // Create purchase record
    const purchase: Purchase = {
      id: `purch-${Date.now()}`,
      userId,
      productId,
      price: product.price,
      createdAt: new Date().toISOString(),
      vaultTransactionId,
    };
    savePurchases([...getPurchases(), purchase]);

    // Notifications + activity log
    await notificationService.emit({
      audienceRole: 'user',
      franchiseId,
      userId,
      kind: 'purchase_success',
      message: `You purchased "${product.name}" for ₹${product.price.toLocaleString('en-IN')} from your vault.`,
    });
    await activityService.log({
      franchiseId,
      actorRole: 'user',
      action: 'product.purchased',
      targetType: 'product',
      targetId: productId,
      meta: { userId, price: product.price, vaultTransactionId },
    });

    return { purchase, vault: updatedVault };
  },

  async getUserPurchases(userId: string): Promise<Purchase[]> {
    await delay(200);
    return getPurchases().filter(p => p.userId === userId);
  },

  async getAllPurchases(): Promise<Purchase[]> {
    await delay();
    return getPurchases();
  },
};
