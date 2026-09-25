import { api } from '@/lib/api/client';

export interface DashboardStats {
  totalFranchises: number;
  totalUsers: number;
  totalRevenue: number;
  totalDraws: number;
  completedDraws: number;
  activeMembers: number;
  totalWinners: number;
  suspendedFranchises: number;
  totalVaultBalance: number;
  [k: string]: unknown;
}

export interface FranchisePerfRow {
  franchiseId: string;
  franchiseName: string;
  totalMembers: number;
  totalPlans: number;
  totalRevenue: number;
}

export interface FranchiseDashboardStats {
  totalMembers: number;
  activePlans: number;
  totalRevenue: number;
  completedDraws: number;
  totalWinners: number;
  pendingPayments: number;
  totalVault?: number;
  [k: string]: unknown;
}

export interface PaymentSummaryRow {
  periodLabel: string;
  totalPayments: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  totalCollected: number;
}

export interface RecentDraw {
  id: string;
  periodLabel: string;
  franchiseName: string;
  winnersCount: number;
}

export const reportsService = {
  getDashboard(): Promise<DashboardStats> {
    return api.get<DashboardStats>('/reports/dashboard');
  },
  getFranchisePerformance(): Promise<FranchisePerfRow[]> {
    return api.get<FranchisePerfRow[]>('/reports/franchise-performance');
  },
  getFranchiseDashboard(franchiseId: string): Promise<FranchiseDashboardStats> {
    return api.get<FranchiseDashboardStats>(`/reports/${franchiseId}/dashboard`);
  },
  getPaymentSummary(franchiseId: string): Promise<PaymentSummaryRow[]> {
    return api.get<PaymentSummaryRow[]>(`/reports/${franchiseId}/payment-summary`);
  },
  getRecentDraws(limit: number = 5): Promise<RecentDraw[]> {
    return api.get<RecentDraw[]>(`/reports/recent-draws?limit=${limit}`);
  },
};
