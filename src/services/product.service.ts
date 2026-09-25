import type { Product, Purchase } from '@/types';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

function resolveFranchiseId(provided?: string): string {
  if (provided) return provided;
  const user = useAuthStore.getState().user;
  if (user?.franchiseId) return user.franchiseId;
  throw new Error('Franchise context unavailable: pass franchiseId explicitly or log in.');
}

export const productService = {
  async getProducts(franchiseId: string): Promise<Product[]> {
    return api.get<Product[]>(`/core/${resolveFranchiseId(franchiseId)}/products`);
  },

  async getAllProducts(): Promise<Product[]> {
    return api.get<Product[]>('/admin/products');
  },

  async getProduct(id: string, franchiseId: string): Promise<Product> {
    return api.get<Product>(`/core/${resolveFranchiseId(franchiseId)}/products/${id}`);
  },

  async createProduct(p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { franchiseId: string }): Promise<Product> {
    return api.post<Product>(`/core/${resolveFranchiseId(p.franchiseId)}/products`, p);
  },

  async updateProduct(id: string, franchiseId: string, patch: Partial<Product>): Promise<Product> {
    return api.patch<Product>(`/core/${resolveFranchiseId(franchiseId)}/products/${id}`, patch);
  },

  async deleteProduct(id: string, franchiseId: string): Promise<void> {
    await api.del<void>(`/core/${resolveFranchiseId(franchiseId)}/products/${id}`);
  },

  async purchase(userId: string, productId: string, franchiseId: string): Promise<Purchase> {
    return api.post<Purchase>(`/core/${resolveFranchiseId(franchiseId)}/users/${userId}/purchase/${productId}`);
  },
};
