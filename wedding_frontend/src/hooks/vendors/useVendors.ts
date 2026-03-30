import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import type {
  EventVendorLink,
  EventVendorLinkResponse,
  EventVendorLinksResponse,
  EventVendorProvidedBy,
  EventVendorStatus,
  Vendor,
  VendorResponse,
  VendorsResponse,
  VendorType,
} from "@/pages/vendors/types";

interface UseVendorsParams {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  type: "all" | VendorType;
  isActive: "all" | "true" | "false";
}

interface UseEventVendorLinksParams {
  currentPage: number;
  itemsPerPage: number;
  eventId?: number;
  vendorId?: number;
  vendorType: "all" | VendorType;
  providedBy: "all" | EventVendorProvidedBy;
  status: "all" | EventVendorStatus;
  enabled?: boolean;
}

export const useVendors = ({
  currentPage,
  itemsPerPage,
  searchQuery,
  type,
  isActive,
}: UseVendorsParams) => {
  return useQuery<VendorsResponse>({
    queryKey: [
      "vendors",
      currentPage,
      itemsPerPage,
      searchQuery,
      type,
      isActive,
    ],
    queryFn: async () => {
      const res = await api.get("/vendors", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          type: type === "all" ? undefined : type,
          isActive: isActive === "all" ? undefined : isActive,
        },
      });

      return res.data;
    },
  });
};

export const useVendor = (id?: string) => {
  return useQuery<Vendor>({
    queryKey: ["vendor", id],
    queryFn: async () => {
      const res = await api.get<VendorResponse>(`/vendors/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useEventVendorLinks = ({
  currentPage,
  itemsPerPage,
  eventId,
  vendorId,
  vendorType,
  providedBy,
  status,
  enabled,
}: UseEventVendorLinksParams) => {
  return useQuery<EventVendorLinksResponse>({
    queryKey: [
      "event-vendor-links",
      currentPage,
      itemsPerPage,
      eventId,
      vendorId,
      vendorType,
      providedBy,
      status,
    ],
    queryFn: async () => {
      const res = await api.get("/vendors/event-links/list", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          eventId: eventId || undefined,
          vendorId: vendorId || undefined,
          vendorType: vendorType === "all" ? undefined : vendorType,
          providedBy: providedBy === "all" ? undefined : providedBy,
          status: status === "all" ? undefined : status,
        },
      });

      return res.data;
    },
    enabled: typeof enabled === "boolean" ? enabled : Boolean(eventId || vendorId),
  });
};

export const useEventVendorLink = (id?: number | string) => {
  return useQuery<EventVendorLink>({
    queryKey: ["event-vendor-link", id],
    queryFn: async () => {
      const res = await api.get<EventVendorLinkResponse>(
        `/vendors/event-links/${id}`,
      );
      return res.data.data;
    },
    enabled: !!id,
  });
};
