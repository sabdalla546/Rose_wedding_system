import { baseAr } from "./base";
import { executionAr } from "./execution";
import { inventoryAr } from "./inventory";
import { quotationsContractsAr } from "./quotations-contracts";

export const ar = {
  ...baseAr,
  sidebar: {
    ...baseAr.sidebar,
    nav: {
      ...baseAr.sidebar.nav,
      ...inventoryAr.sidebar.nav,
    },
  },
  inventory: {
    ...inventoryAr.inventory,
  },
  execution: {
    ...baseAr.execution,
    ...executionAr.execution,
  },
  quotations: {
    ...baseAr.quotations,
    ...quotationsContractsAr.quotations,
  },
  contracts: {
    ...baseAr.contracts,
    ...quotationsContractsAr.contracts,
  },
} as const;
