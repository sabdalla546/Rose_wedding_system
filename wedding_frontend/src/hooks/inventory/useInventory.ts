import { useQuery } from "@tanstack/react-query";

import {
  getInventoryItem,
  listInventoryItems,
} from "@/lib/api/inventory";
import type {
  InventoryFilters,
  InventoryItem,
  InventoryListResponse,
} from "@/pages/inventory/types";

export const useInventory = ({
  currentPage,
  itemsPerPage,
  searchQuery,
  stockFilter,
}: InventoryFilters) =>
  useQuery<InventoryListResponse>({
    queryKey: [
      "inventory",
      currentPage,
      itemsPerPage,
      searchQuery,
      stockFilter,
    ],
    queryFn: () =>
      listInventoryItems({
        currentPage,
        itemsPerPage,
        searchQuery,
        stockFilter,
      }),
  });

export const useInventoryItem = (id?: string) =>
  useQuery<InventoryItem>({
    queryKey: ["inventory-item", id],
    queryFn: () => getInventoryItem(id!),
    enabled: Boolean(id),
  });
