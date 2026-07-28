import { apiClient } from "@/lib/api-client";

export type QueueOverview = {
  status?: string;
  redis?: string;
  waiting?: number;
  active?: number;
  completed?: number;
  failed?: number;
};

export function getQueueOverview() {
  return apiClient<QueueOverview>("/queues/overview");
}
