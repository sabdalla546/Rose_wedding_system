import type {
  InventoryItem,
  InventoryListResponse,
  InventoryStockFilter,
} from "./types";

export type InventoryStockStatus = "in_stock" | "out_of_stock";

export type TableInventoryItem = InventoryItem & {
  stockStatus: InventoryStockStatus;
};

export type TableInventoryResponse = {
  data: { items: TableInventoryItem[] };
  total: number;
  totalPages: number;
};

export const getInventoryStockStatus = (
  quantity: number,
): InventoryStockStatus => (quantity > 0 ? "in_stock" : "out_of_stock");

export const formatInventoryQuantity = (quantity?: number | null) => {
  const safeQuantity = typeof quantity === "number" ? quantity : 0;

  return safeQuantity.toLocaleString();
};

export const getInventoryImageUrl = (
  item?: Pick<InventoryItem, "imageUrl"> | null,
) => item?.imageUrl ?? null;

export const INVENTORY_STOCK_FILTER_OPTIONS: Array<{
  value: InventoryStockFilter;
  label: string;
}> = [
  { value: "all", label: "All Items" },
  { value: "in-stock", label: "In Stock" },
  { value: "out-of-stock", label: "Out of Stock" },
];

export function toTableInventory(
  response?: InventoryListResponse,
): TableInventoryResponse {
  const items = (response?.data ?? []).map<TableInventoryItem>((item) => ({
    ...item,
    stockStatus: getInventoryStockStatus(item.quantity),
  }));

  return {
    data: { items },
    total: response?.meta?.total ?? items.length,
    totalPages: response?.meta?.pages ?? 1,
  };
}
