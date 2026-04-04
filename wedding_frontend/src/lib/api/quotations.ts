import api from "@/lib/axios";
import type {
  QuotationResponse,
  QuotationsResponse,
  QuotationStatus,
} from "@/pages/quotations/types";

const normalizeQuotationsResponse = (
  payload: unknown,
  fallbackPage: number,
  fallbackLimit: number,
): QuotationsResponse => {
  const source =
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>) &&
    (payload as Record<string, unknown>).data &&
    typeof (payload as Record<string, unknown>).data === "object" &&
    Array.isArray(
      ((payload as Record<string, unknown>).data as Record<string, unknown>).data,
    )
      ? ((payload as Record<string, unknown>).data as Record<string, unknown>)
      : (payload as Record<string, unknown>);

  const rows = Array.isArray(source?.data)
    ? source.data
    : Array.isArray(source?.rows)
      ? source.rows
      : [];
  const metaSource =
    source?.meta && typeof source.meta === "object"
      ? (source.meta as Record<string, unknown>)
      : {};

  return {
    data: rows as QuotationsResponse["data"],
    meta: {
      total:
        typeof metaSource.total === "number"
          ? metaSource.total
          : rows.length,
      page:
        typeof metaSource.page === "number"
          ? metaSource.page
          : fallbackPage,
      limit:
        typeof metaSource.limit === "number"
          ? metaSource.limit
          : fallbackLimit,
      pages:
        typeof metaSource.pages === "number"
          ? metaSource.pages
          : Math.max(1, Math.ceil(rows.length / fallbackLimit)),
    },
  };
};

export const quotationsApi = {
  async list(params: {
    currentPage: number;
    itemsPerPage: number;
    searchQuery: string;
    eventId: string;
    status: "all" | QuotationStatus;
    issueDateFrom: string;
    issueDateTo: string;
  }) {
    const response = await api.get<QuotationsResponse>("/quotations", {
      params: {
        page: params.currentPage,
        limit: params.itemsPerPage,
        search: params.searchQuery || undefined,
        eventId: params.eventId ? Number(params.eventId) : undefined,
        status: params.status === "all" ? undefined : params.status,
        issueDateFrom: params.issueDateFrom || undefined,
        issueDateTo: params.issueDateTo || undefined,
      },
    });

    return normalizeQuotationsResponse(
      response.data,
      params.currentPage,
      params.itemsPerPage,
    );
  },

  async get(id: string | number) {
    const response = await api.get<QuotationResponse>(`/quotations/${id}`);
    return response.data.data;
  },

  updateWorkflowStatus(
    id: string | number,
    status: QuotationStatus,
    notes?: string,
  ) {
    return api.put(`/quotations/${id}`, {
      status,
      notes: notes?.trim() ? notes.trim() : undefined,
    });
  },
};
