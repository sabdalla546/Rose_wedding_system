import api from "@/lib/axios";
import type {
  ContractAmendment,
  ContractAmendmentApplyFormData,
  ContractAmendmentApproveFormData,
  ContractAmendmentCreateFormData,
  ContractAmendmentItem,
  ContractAmendmentItemCreateFormData,
  ContractAmendmentItemUpdateFormData,
  ContractAmendmentRejectFormData,
  ContractAmendmentsResponse,
  ContractAmendmentStatus,
} from "@/pages/contracts/amendments/types";

const MAX_CONTRACT_AMENDMENTS_PAGE_SIZE = 100;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const extractEnvelope = (payload: unknown) => {
  if (
    isRecord(payload) &&
    isRecord(payload.data) &&
    Array.isArray(payload.data.data)
  ) {
    return payload.data;
  }

  return isRecord(payload) ? payload : {};
};

const normalizeContractAmendmentsResponse = (
  payload: unknown,
  fallbackPage: number,
  fallbackLimit: number,
): ContractAmendmentsResponse => {
  const source = extractEnvelope(payload);
  const rows = Array.isArray(source.data)
    ? source.data
    : Array.isArray(source.rows)
      ? source.rows
      : [];
  const metaSource = isRecord(source.meta) ? source.meta : {};

  return {
    data: rows as ContractAmendment[],
    meta: {
      total:
        typeof metaSource.total === "number" ? metaSource.total : rows.length,
      page: typeof metaSource.page === "number" ? metaSource.page : fallbackPage,
      limit:
        typeof metaSource.limit === "number" ? metaSource.limit : fallbackLimit,
      pages:
        typeof metaSource.pages === "number"
          ? metaSource.pages
          : Math.max(1, Math.ceil(rows.length / fallbackLimit)),
    },
  };
};

const normalizeContractAmendment = (payload: unknown): ContractAmendment => {
  if (isRecord(payload) && isRecord(payload.data)) {
    return payload.data as unknown as ContractAmendment;
  }

  return payload as ContractAmendment;
};

const normalizeContractAmendmentItem = (payload: unknown): ContractAmendmentItem => {
  if (isRecord(payload) && isRecord(payload.data)) {
    return payload.data as unknown as ContractAmendmentItem;
  }

  return payload as ContractAmendmentItem;
};

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeNullableString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeOptionalNumber = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? Number(trimmed) : undefined;
};

const normalizeNullableNumber = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? Number(trimmed) : null;
};

const buildCreateAmendmentPayload = (values: ContractAmendmentCreateFormData) => ({
  contractId: values.contractId,
  reason: normalizeOptionalString(values.reason),
  notes: normalizeOptionalString(values.notes),
});

const buildCreateAmendmentItemPayload = (
  values: ContractAmendmentItemCreateFormData,
) => {
  if (values.changeType === "add_service") {
    return {
      changeType: values.changeType,
      serviceId: Number(values.serviceId),
      itemName: values.itemName.trim(),
      category: values.category.trim(),
      quantity: Number(values.quantity),
      unitPrice: Number(values.unitPrice),
      totalPrice: normalizeNullableNumber(values.totalPrice),
      notes: normalizeOptionalString(values.notes),
      sortOrder: normalizeOptionalNumber(values.sortOrder),
    };
  }

  return {
    changeType: values.changeType,
    targetContractItemId: Number(values.targetContractItemId),
    targetEventServiceId: normalizeNullableNumber(values.targetEventServiceId),
    targetExecutionServiceDetailId: normalizeNullableNumber(
      values.targetExecutionServiceDetailId,
    ),
    notes: normalizeOptionalString(values.notes),
    sortOrder: normalizeOptionalNumber(values.sortOrder),
  };
};

const buildUpdateAmendmentItemPayload = (
  values: ContractAmendmentItemUpdateFormData,
) => ({
  itemName: values.itemName?.trim() || undefined,
  category: values.category?.trim() || undefined,
  quantity:
    typeof values.quantity !== "undefined"
      ? normalizeOptionalNumber(values.quantity)
      : undefined,
  unitPrice:
    typeof values.unitPrice !== "undefined"
      ? normalizeOptionalNumber(values.unitPrice)
      : undefined,
  totalPrice:
    typeof values.totalPrice !== "undefined"
      ? normalizeNullableNumber(values.totalPrice)
      : undefined,
  notes:
    typeof values.notes !== "undefined"
      ? normalizeNullableString(values.notes)
      : undefined,
  sortOrder:
    typeof values.sortOrder !== "undefined"
      ? normalizeOptionalNumber(values.sortOrder)
      : undefined,
  status: values.status,
});

export const contractAmendmentsApi = {
  async list(params: {
    currentPage?: number;
    itemsPerPage?: number;
    contractId?: string | number;
    eventId?: string | number;
    status?: "all" | ContractAmendmentStatus;
    searchQuery?: string;
  }) {
    const currentPage = Math.max(1, params.currentPage ?? 1);
    const itemsPerPage = Math.min(
      Math.max(1, params.itemsPerPage ?? 20),
      MAX_CONTRACT_AMENDMENTS_PAGE_SIZE,
    );

    const response = await api.get("/contract-amendments", {
      params: {
        page: currentPage,
        limit: itemsPerPage,
        contractId: params.contractId ? Number(params.contractId) : undefined,
        eventId: params.eventId ? Number(params.eventId) : undefined,
        status: params.status && params.status !== "all" ? params.status : undefined,
        search: params.searchQuery || undefined,
      },
    });

    return normalizeContractAmendmentsResponse(
      response.data,
      currentPage,
      itemsPerPage,
    );
  },

  async get(id: string | number) {
    const response = await api.get(`/contract-amendments/${id}`);
    return normalizeContractAmendment(response.data);
  },

  async create(values: ContractAmendmentCreateFormData) {
    const response = await api.post(
      "/contract-amendments",
      buildCreateAmendmentPayload(values),
    );
    return normalizeContractAmendment(response.data);
  },

  async addItem(
    amendmentId: string | number,
    values: ContractAmendmentItemCreateFormData,
  ) {
    const response = await api.post(
      `/contract-amendments/${amendmentId}/items`,
      buildCreateAmendmentItemPayload(values),
    );
    return normalizeContractAmendmentItem(response.data);
  },

  async updateItem(
    amendmentId: string | number,
    itemId: string | number,
    values: ContractAmendmentItemUpdateFormData,
  ) {
    const response = await api.patch(
      `/contract-amendments/${amendmentId}/items/${itemId}`,
      buildUpdateAmendmentItemPayload(values),
    );
    return normalizeContractAmendmentItem(response.data);
  },

  async deleteItem(itemId: string | number) {
    await api.delete(`/contract-amendments/items/${itemId}`);
    return itemId;
  },

  async approve(
    amendmentId: string | number,
    values?: ContractAmendmentApproveFormData,
  ) {
    const response = await api.post(`/contract-amendments/${amendmentId}/approve`, {
      notes: normalizeOptionalString(values?.notes),
    });
    return normalizeContractAmendment(response.data);
  },

  async reject(
    amendmentId: string | number,
    values: ContractAmendmentRejectFormData,
  ) {
    const response = await api.post(`/contract-amendments/${amendmentId}/reject`, {
      reason: values.reason.trim(),
      notes: normalizeOptionalString(values.notes),
    });
    return normalizeContractAmendment(response.data);
  },

  async apply(
    amendmentId: string | number,
    values?: ContractAmendmentApplyFormData,
  ) {
    const response = await api.post(`/contract-amendments/${amendmentId}/apply`, {
      notes: normalizeOptionalString(values?.notes),
    });
    return normalizeContractAmendment(response.data);
  },
};
