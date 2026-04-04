import catalogData from "./vendorTypeCatalog.data.json";
import type { VendorType as LegacyVendorType } from "../models/vendor.model";

export type VendorTypeSeedDefinition = {
  slug: LegacyVendorType;
  name: string;
  nameAr: string;
  sortOrder: number;
};

export const vendorTypeCatalog =
  catalogData as unknown as VendorTypeSeedDefinition[];
