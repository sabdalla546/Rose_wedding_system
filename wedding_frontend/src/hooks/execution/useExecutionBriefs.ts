import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import type {
  ExecutionBrief,
  ExecutionBriefResponse,
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
    queryFn: async () => {
      const res = await api.get("/execution-briefs", {
        params: {
          eventId: typeof eventId === "number" ? eventId : undefined,
          status: status === "all" ? undefined : status,
          search: search.trim() || undefined,
        },
      });

      return res.data;
    },
  });
};

export const useExecutionBrief = (id?: number | string) => {
  return useQuery<ExecutionBrief>({
    queryKey: ["execution-brief", id],
    queryFn: async () => {
      const res = await api.get<ExecutionBriefResponse>(
        `/execution-briefs/${id}`,
      );
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useExecutionBriefByEvent = (eventId?: number | string) => {
  return useQuery<ExecutionBrief>({
    queryKey: ["execution-brief-by-event", eventId],
    queryFn: async () => {
      const res = await api.get<ExecutionBriefResponse>(
        `/execution-briefs/by-event/${eventId}`,
      );
      return res.data.data;
    },
    enabled: !!eventId,
  });
};
