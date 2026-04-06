export type SideCoveringPolicy = "allowed" | "not_allowed";

export interface VenueSpecifications {
  hall?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
    sideCoveringPolicy?: SideCoveringPolicy | null;
  } | null;
  kosha?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
    pieceCount?: number | null;
    frameCount?: number | null;
    stairsCount?: number | null;
    stairLength?: number | null;
    hasStage?: boolean;
    stage?: {
      length?: number | null;
      width?: number | null;
      height?: number | null;
    } | null;
  } | null;
  gate?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
    pieceCount?: number | null;
  } | null;
  door?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  } | null;
  entrances?: Array<{
    name?: string | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    pieceCount?: number | null;
  }> | null;
  buffet?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  } | null;
  sides?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
    pieceCount?: number | null;
  } | null;
  lighting?: {
    hasHangingSupport?: boolean;
    hangingLength?: number | null;
    hangingWidth?: number | null;
  } | null;
  hotelBleachers?: {
    available?: boolean;
  } | null;
}

export interface Venue {
  id: number;
  name: string;
  city?: string | null;
  area?: string | null;
  address?: string | null;
  phone?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  isActive: boolean;
  specificationsJson?: VenueSpecifications | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface VenuesResponse {
  data: Venue[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface VenueResponse {
  data: Venue;
}

export interface VenueSpecificationFormData {
  hall: {
    length: string;
    width: string;
    height: string;
    sideCoveringPolicy: "" | SideCoveringPolicy;
  };
  kosha: {
    length: string;
    width: string;
    height: string;
    pieceCount: string;
    frameCount: string;
    stairsCount: string;
    stairLength: string;
    hasStage: boolean;
    stage: {
      length: string;
      width: string;
      height: string;
    };
  };
  gate: {
    length: string;
    width: string;
    height: string;
    pieceCount: string;
  };
  door: {
    length: string;
    width: string;
    height: string;
  };
  entrances: [
    {
      name: string;
      length: string;
      width: string;
      height: string;
      pieceCount: string;
    },
    {
      name: string;
      length: string;
      width: string;
      height: string;
      pieceCount: string;
    },
    {
      name: string;
      length: string;
      width: string;
      height: string;
      pieceCount: string;
    },
  ];
  buffet: {
    length: string;
    width: string;
    height: string;
  };
  sides: {
    length: string;
    width: string;
    height: string;
    pieceCount: string;
  };
  lighting: {
    hasHangingSupport: boolean;
    hangingLength: string;
    hangingWidth: string;
  };
  hotelBleachers: {
    available: boolean;
  };
}

export interface VenueFormData {
  id?: number;
  name: string;
  city?: string;
  area?: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
  specificationsJson: VenueSpecificationFormData;
}
