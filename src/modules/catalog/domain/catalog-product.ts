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
}
