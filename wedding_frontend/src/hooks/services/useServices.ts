import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import type {
  EventServiceItem,
  EventServiceItemResponse,
  EventServiceItemsResponse,
  EventServiceStatus,
  Service,
  ServiceCategory,
  ServiceResponse,
  ServicesResponse,
} from "@/pages/services/types";

interface UseServicesParams {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  category: "all" | ServiceCategory;
  isActive: "all" | "true" | "false";
}

interface UseEventServiceItemsParams {
  currentPage: number;
  itemsPerPage: number;
  eventId?: number;
  category: "all" | ServiceCategory;
  status: "all" | EventServiceStatus;
}

export const useServices = ({
  currentPage,
  itemsPerPage,
  searchQuery,
  category,
  isActive,
}: UseServicesParams) => {
  return useQuery<ServicesResponse>({
    queryKey: [
      "services",
      currentPage,
      itemsPerPage,
      searchQuery,
      category,
      isActive,
    ],
    queryFn: async () => {
      const res = await api.get("/services", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          category: category === "all" ? undefined : category,
          isActive: isActive === "all" ? undefined : isActive,
        },
      });

      return res.data;
    },
  });
};

export const useService = (id?: string) => {
  return useQuery<Service>({
    queryKey: ["service", id],
    queryFn: async () => {
      const res = await api.get<ServiceResponse>(`/services/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useEventServiceItems = ({
  currentPage,
  itemsPerPage,
  eventId,
  category,
  status,
}: UseEventServiceItemsParams) => {
  return useQuery<EventServiceItemsResponse>({
    queryKey: [
      "event-service-items",
      currentPage,
      itemsPerPage,
      eventId,
      category,
      status,
    ],
    queryFn: async () => {
      const res = await api.get("/services/event-items/list", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          eventId: eventId || undefined,
          category: category === "all" ? undefined : category,
          status: status === "all" ? undefined : status,
        },
      });

      return res.data;
    },
    enabled: Boolean(eventId),
  });
};

export const useEventServiceItem = (id?: number | string) => {
  return useQuery<EventServiceItem>({
    queryKey: ["event-service-item", id],
    queryFn: async () => {
      const res = await api.get<EventServiceItemResponse>(
        `/services/event-items/${id}`,
      );
      return res.data.data;
    },
    enabled: !!id,
  });
};
