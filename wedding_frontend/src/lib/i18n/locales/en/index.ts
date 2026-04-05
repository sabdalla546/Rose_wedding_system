import { baseEn } from "./base";
import { executionEn } from "./execution";
import { inventoryEn } from "./inventory";
import { quotationsContractsEn } from "./quotations-contracts";

export const en = {
  ...baseEn,
  sidebar: {
    ...baseEn.sidebar,
    nav: {
      ...baseEn.sidebar.nav,
      ...inventoryEn.sidebar.nav,
    },
  },
  inventory: {
    ...inventoryEn.inventory,
  },
  execution: {
    ...baseEn.execution,
    ...executionEn.execution,
  },
  quotations: {
    ...baseEn.quotations,
    ...quotationsContractsEn.quotations,
  },
  contracts: {
    ...baseEn.contracts,
    ...quotationsContractsEn.contracts,
  },
} as const;
