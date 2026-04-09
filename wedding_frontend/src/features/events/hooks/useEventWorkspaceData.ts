import { useMemo } from "react";

import { useContracts } from "@/hooks/contracts/useContracts";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useEvent } from "@/hooks/events/useEvents";
import { useQuotations } from "@/hooks/quotations/useQuotations";
import { useEventServiceItems } from "@/hooks/services/useServices";
import { useEventVendorLinks } from "@/hooks/vendors/useVendors";
import { useVenues } from "@/hooks/venues/useVenues";
import type { EventVendorLink } from "@/pages/vendors/types";

type EventWorkspaceIdentifier = string | number | null | undefined;

export function useEventWorkspaceData(
  eventId: EventWorkspaceIdentifier,
  options?: {
    sortVendorLinks?: (left: EventVendorLink, right: EventVendorLink) => number;
  },
) {
  const resolvedEventId = eventId == null ? "" : String(eventId);
  const numericEventId = resolvedEventId ? Number(resolvedEventId) : 0;

  const { data: event, isLoading: eventLoading } = useEvent(resolvedEventId);
  const { data: customersResponse } = useCustomers({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    status: "all",
  });
  const { data: venuesResponse } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });
  const { data: eventServiceItemsResponse } = useEventServiceItems({
    currentPage: 1,
    itemsPerPage: 200,
    eventId: numericEventId,
    category: "all",
    status: "all",
  });
  const { data: eventVendorLinksResponse } = useEventVendorLinks({
    currentPage: 1,
    itemsPerPage: 200,
    eventId: numericEventId,
    vendorType: "all",
    providedBy: "all",
    status: "all",
  });
  const {
    data: eventQuotationsResponse,
    isLoading: quotationsLoading,
    isError: quotationsLoadFailed,
  } = useQuotations({
    currentPage: 1,
    itemsPerPage: 100,
    searchQuery: "",
    eventId: resolvedEventId,
    status: "all",
    issueDateFrom: "",
    issueDateTo: "",
  });
  const {
    data: eventContractsResponse,
    isLoading: contractsLoading,
    isError: contractsLoadFailed,
  } = useContracts({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    quotationId: "",
    eventId: resolvedEventId,
    status: "all",
    signedDateFrom: "",
    signedDateTo: "",
  });

  const customers = useMemo(
    () => customersResponse?.data ?? [],
    [customersResponse?.data],
  );
  const venues = useMemo(() => venuesResponse?.data ?? [], [venuesResponse?.data]);
  const serviceItems = useMemo(
    () =>
      [...(eventServiceItemsResponse?.data ?? [])].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.id - right.id;
      }),
    [eventServiceItemsResponse?.data],
  );
  const existingServiceIds = useMemo(
    () =>
      serviceItems
        .map((item) => item.serviceId)
        .filter((value): value is number => typeof value === "number"),
    [serviceItems],
  );
  const vendorLinks = useMemo(
    () =>
      [...(eventVendorLinksResponse?.data ?? [])].sort(
        options?.sortVendorLinks ??
          ((left, right) => {
            if (left.vendorType !== right.vendorType) {
              return left.vendorType.localeCompare(right.vendorType);
            }

            return left.id - right.id;
          }),
      ),
    [eventVendorLinksResponse?.data, options?.sortVendorLinks],
  );
  const quotations = useMemo(
    () =>
      [...(eventQuotationsResponse?.data ?? [])].sort((left, right) => {
        const leftTime = new Date(left.issueDate).getTime();
        const rightTime = new Date(right.issueDate).getTime();

        if (leftTime !== rightTime) {
          return rightTime - leftTime;
        }

        return right.id - left.id;
      }),
    [eventQuotationsResponse?.data],
  );
  const contracts = useMemo(
    () =>
      [...(eventContractsResponse?.data ?? [])].sort((left, right) => {
        const leftTime = new Date(left.signedDate).getTime();
        const rightTime = new Date(right.signedDate).getTime();

        if (leftTime !== rightTime) {
          return rightTime - leftTime;
        }

        return right.id - left.id;
      }),
    [eventContractsResponse?.data],
  );

  const latestQuotation = quotations[0] ?? null;
  const latestContract = contracts[0] ?? null;
  const readiness = useMemo(() => {
    const servicesReady = serviceItems.filter(
      (item) => item.status === "confirmed" || item.status === "completed",
    ).length;
    const vendorsReady = vendorLinks.filter(
      (link) => link.status === "approved" || link.status === "confirmed",
    ).length;
    const sections = event?.sections ?? [];
    const sectionsReady = sections.filter((section) => section.isCompleted).length;
    const total = serviceItems.length + vendorLinks.length + sections.length;
    const ready = servicesReady + vendorsReady + sectionsReady;

    return {
      ready,
      total,
      percent: total > 0 ? Math.round((ready / total) * 100) : null,
      servicesReady,
      servicesTotal: serviceItems.length,
      vendorsReady,
      vendorsTotal: vendorLinks.length,
      sectionsReady,
      sectionsTotal: sections.length,
    };
  }, [event?.sections, serviceItems, vendorLinks]);

  return {
    event,
    eventLoading,
    customers,
    venues,
    serviceItems,
    existingServiceIds,
    vendorLinks,
    quotations,
    quotationsLoading,
    quotationsLoadFailed,
    contracts,
    contractsLoading,
    contractsLoadFailed,
    latestQuotation,
    latestContract,
    readiness,
  };
}
