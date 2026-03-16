import type { Venue, VenuesResponse } from "@/pages/venues/types";

export type TableVenue = Venue & {
  locationSummary: string;
};

export type TableVenuesResponse = {
  data: { venues: TableVenue[] };
  total: number;
  totalPages: number;
};

export function toTableVenues(res?: VenuesResponse): TableVenuesResponse {
  const venues = (res?.data ?? []).map<TableVenue>((venue) => ({
    ...venue,
    locationSummary: [venue.city, venue.area].filter(Boolean).join(" - ") || "-",
  }));

  return {
    data: { venues },
    total: res?.meta?.total ?? venues.length,
    totalPages: res?.meta?.pages ?? 1,
  };
}
