export const PRODUCT_UNITS = [
  "item",
  "kg",
  "g",
  "l",
  "ml",
  "portion",
  "pack",
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  unit: ProductUnit;
  imageUrl: string;
  category: string | null;
  originCountryCodes: string[];
  rank: number;
}

export type Co2eSource = "benchmark" | "manual" | "supplier" | "verified";

export interface BusinessProduct {
  id: string;
  catalogProductId: string | null;
  catalogSourceId: string | null;
  name: string;
  imageUrl: string;
  unit: ProductUnit;
  unitCostMinor: number;
  currencyCode: string;
  isActive: boolean;
  unitCo2eG: number | null;
  co2eSource: Co2eSource;
  co2eMethodology: string | null;
}
