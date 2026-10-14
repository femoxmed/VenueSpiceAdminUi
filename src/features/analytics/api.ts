import { apiClient } from '@/lib/api-client';
export type ReportName = 'registrations' | 'event-creation' | 'organizer-adoption' | 'ticket-sales' | 'revenue';
export type ReportFilters = { start: string; end: string; groupBy: string; organizationId?: string; eventId?: string };
export type ReportRow = { bucket: string; currency: string; [key: string]: string | number };
export type AnalyticsReport = {
  report: ReportName; timezone: string; start: string; end: string; previousStart: string; previousEnd: string;
  definition: string; columns: { key: string; label: string }[];
  rows: ReportRow[]; totals: ReportRow[]; previousRows: ReportRow[]; previousTotals: ReportRow[];
};
export const analyticsApi = {
  report: (report: ReportName, filters: ReportFilters) => apiClient<AnalyticsReport>(`/analytics/reports/${report}`, { query: filters }),
  export: (report: ReportName, filters: ReportFilters) => apiClient<Blob>(`/analytics/reports/${report}/export`, { query: filters, responseType: 'blob' }),
};
