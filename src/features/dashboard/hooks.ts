import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics } from "@/features/dashboard/api";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: getDashboardMetrics
  });
}
