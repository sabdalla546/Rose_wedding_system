import { useQuery } from "@tanstack/react-query";

import { executionBriefsApi } from "@/lib/api/execution-briefs";
import type {
  ExecutionBrief,
  ExecutionBriefsResponse,
  ExecutionBriefStatus,
} from "@/pages/execution/types";

interface UseExecutionBriefsParams {
  eventId?: number;
  status?: "all" | ExecutionBriefStatus;
  search?: string;
}

export const useExecutionBriefs = ({
  eventId,
  status = "all",
  search = "",
}: UseExecutionBriefsParams = {}) => {
  return useQuery<ExecutionBriefsResponse>({
    queryKey: ["execution-briefs", eventId, status, search],
    queryFn: () => executionBriefsApi.list({ eventId, status, search }),
  });
};

export const useExecutionBrief = (id?: number | string) => {
  return useQuery<ExecutionBrief>({
    queryKey: ["execution-brief", id],
    queryFn: () => executionBriefsApi.get(id as string),
    enabled: !!id,
  });
};

export const useExecutionBriefByEvent = (eventId?: number | string) => {
  return useQuery<ExecutionBrief>({
    queryKey: ["execution-brief-by-event", eventId],
    queryFn: () => executionBriefsApi.getByEvent(eventId as string),
    enabled: !!eventId,
  });
};
