import api from "@/lib/axios";
import type {
  ExecutionBriefResponse,
  ExecutionBriefsResponse,
  ExecutionBriefStatus,
} from "@/pages/execution/types";

export const executionBriefsApi = {
  async list(params: {
    eventId?: number;
    status?: "all" | ExecutionBriefStatus;
    search?: string;
  }) {
    const response = await api.get<ExecutionBriefsResponse>("/execution-briefs", {
      params: {
        eventId: typeof params.eventId === "number" ? params.eventId : undefined,
        status: params.status === "all" ? undefined : params.status,
        search: params.search?.trim() || undefined,
      },
    });

    return response.data;
  },

  async get(id: string | number) {
    const response = await api.get<ExecutionBriefResponse>(`/execution-briefs/${id}`);
    return response.data.data;
  },

  async getByEvent(eventId: string | number) {
    const response = await api.get<ExecutionBriefResponse>(
      `/execution-briefs/by-event/${eventId}`,
    );
    return response.data.data;
  },

  updateWorkflowStatus(
    id: string | number,
    status: ExecutionBriefStatus,
    notes?: {
      generalNotes?: string | null;
      clientNotes?: string | null;
      designerNotes?: string | null;
    },
  ) {
    return api.patch(`/execution-briefs/${id}`, {
      status,
      ...notes,
    });
  },
};
