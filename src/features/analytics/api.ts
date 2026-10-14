import { apiClient } from '@/lib/api-client';
export type ReportName = 'registrations' | 'event-creation' | 'organizer-adoption' | 'ticket-sales' | 'revenue' | 'website-traffic' | 'user-engagement' | 'checkout-conversion' | 'traffic-source' | 'event-status' | 'event-performance' | 'payment-refund' | 'promoter-referral' | 'geographic' | 'user-retention';
export type ReportFilters = { start: string; end: string; groupBy: string; organizationId?: string; eventId?: string };
export type ReportRow = { bucket: string; currency: string; [key: string]: string | number | null };
export type AnalyticsReport = {
  report: ReportName; timezone: string; start: string; end: string; previousStart: string; previousEnd: string;
  definition: string; generatedAt: string; coverage: { firstObservedAt: string | null; lastObservedAt: string | null; retentionDays: number; retentionCutoff: string } | null;
  columns: { key: string; label: string; unit?: 'percent' | 'seconds' | 'decimal'; nullable?: boolean }[];
  dimensions: {key:string;label:string}[]; breakdown: ReportRow[]; previousBreakdown: ReportRow[];
  rows: ReportRow[]; totals: ReportRow[]; previousRows: ReportRow[]; previousTotals: ReportRow[];
};
export const analyticsApi = {
  report: (report: ReportName, filters: ReportFilters) => apiClient<AnalyticsReport>(`/analytics/reports/${report}`, { query: filters }),
  export: (report: ReportName, filters: ReportFilters, format: 'csv' | 'xlsx' = 'csv') => apiClient<Blob>(`/analytics/reports/${report}/export`, { query: {...filters, format}, responseType: 'blob' }),
};
