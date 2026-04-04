export interface InventoryUserSummary {
  id: number;
  fullName: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  imagePath?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdByUser?: InventoryUserSummary | null;
  updatedByUser?: InventoryUserSummary | null;
}

export interface InventoryListResponse {
  data: InventoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface InventoryItemResponse {
  data: InventoryItem;
}

export interface InventoryItemMutationResponse {
  message: string;
  data: InventoryItem;
}

export type InventoryStockFilter = "all" | "in-stock" | "out-of-stock";

export interface InventoryFilters {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  stockFilter: InventoryStockFilter;
}

export interface InventoryFormData {
  name: string;
  quantity: number;
  imageFile?: File | null;
}
