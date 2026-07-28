import { useQuery } from "@tanstack/react-query";
import { getQueueOverview } from "@/features/queues/api";

export function useQueueOverview() {
  return useQuery({
    queryKey: ["queue-overview"],
    queryFn: getQueueOverview,
    refetchInterval: 15000
  });
}
