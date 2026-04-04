import api from "@/lib/axios";
import type {
  InventoryFormData,
  InventoryItem,
  InventoryItemMutationResponse,
  InventoryItemResponse,
  InventoryListResponse,
  InventoryStockFilter,
} from "@/pages/inventory/types";

type InventoryListParams = {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  stockFilter: InventoryStockFilter;
};

const publicBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
).replace(/\/+$/, "");

const publicAssetBaseUrl = publicBaseUrl.endsWith("/api/v1")
  ? publicBaseUrl.slice(0, -"/api/v1".length)
  : publicBaseUrl;

const resolveInventoryImageUrl = (
  imageUrl?: string | null,
  imagePath?: string | null,
) => {
  if (imageUrl) {
    return imageUrl;
  }

  if (!imagePath) {
    return null;
  }

  const normalizedPath = imagePath.replace(/\\/g, "/");

  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://")
  ) {
    return normalizedPath;
  }

  return `${publicAssetBaseUrl}/${normalizedPath.replace(/^\/+/, "")}`;
};

const normalizeInventoryItem = (item: InventoryItem): InventoryItem => ({
  ...item,
  imageUrl: resolveInventoryImageUrl(item.imageUrl, item.imagePath),
});

const buildInventoryPayload = (values: InventoryFormData) => {
  if (values.imageFile) {
    const formData = new FormData();
    formData.append("name", values.name.trim());
    formData.append("quantity", String(values.quantity));
    formData.append("image", values.imageFile);
    return formData;
  }

  return {
    name: values.name.trim(),
    quantity: values.quantity,
  };
};

export async function listInventoryItems(
  params: InventoryListParams,
): Promise<InventoryListResponse> {
  const response = await api.get<InventoryListResponse>("/inventory", {
    params: {
      page: params.currentPage,
      limit: params.itemsPerPage,
      search: params.searchQuery || undefined,
      inStock: params.stockFilter === "in-stock" ? true : undefined,
      outOfStock: params.stockFilter === "out-of-stock" ? true : undefined,
    },
  });

  return {
    ...response.data,
    data: response.data.data.map(normalizeInventoryItem),
  };
}

export async function getInventoryItem(
  id: string | number,
): Promise<InventoryItem> {
  const response = await api.get<InventoryItemResponse>(`/inventory/${id}`);
  return normalizeInventoryItem(response.data.data);
}

export async function createInventoryItem(
  values: InventoryFormData,
): Promise<InventoryItem> {
  const payload = buildInventoryPayload(values);
  const response = await api.post<InventoryItemMutationResponse>(
    "/inventory",
    payload,
    payload instanceof FormData
      ? {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      : undefined,
  );

  return normalizeInventoryItem(response.data.data);
}

export async function updateInventoryItem(
  id: string | number,
  values: InventoryFormData,
): Promise<InventoryItem> {
  const payload = buildInventoryPayload(values);
  const response = await api.put<InventoryItemMutationResponse>(
    `/inventory/${id}`,
    payload,
    payload instanceof FormData
      ? {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      : undefined,
  );

  return normalizeInventoryItem(response.data.data);
}

export async function deleteInventoryItem(id: string | number) {
  await api.delete(`/inventory/${id}`);
}
