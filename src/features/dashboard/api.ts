import { apiClient } from '@/lib/api-client';

export type DashboardMetrics = {
  customerCount: number;
  activeCustomerCount?: number;
  orderCount: number;
  pendingServiceCount: number;
  upcomingFilterChanges?: number;
  upcomingFilterChanges30Days?: number;
  overdueServices?: number;
  monthlyRevenue: number;
  openSupportTickets?: number;
  invoiceCount?: number;
  technicianCount?: number;
  recurringRevenueForecast?: number;
  monthlyRevenueData?: Array<{ month: string; revenue: number }>;
  orderServiceData?: Array<{ month: string; orders: number; services: number }>;
  invoiceStatusData?: Array<{ name: string; value: number; color: string }>;
  serviceTypeData?: Array<{ name: string; count: number }>;
  topSellingProducts?: Array<{
    productId: string;
    name: string;
    unitsSold: number;
    revenue: number;
  }>;
  technicianPerformance?: Array<{
    technicianId: string;
    technicianName: string;
    assignedJobs: number;
    completedJobs: number;
    overdueJobs: number;
    completionRate: number;
  }>;
};

export function getDashboardMetrics() {
  return apiClient<DashboardMetrics>('/admin/metrics');
}
