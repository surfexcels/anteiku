import { z } from "zod";
import { PRODUCT_UNITS } from "@/src/modules/catalog/domain/catalog-product";

export const searchCatalogSchema = z.object({
  query: z.string().trim().max(100).default(""),
  countryCode: z.string().trim().length(2).toUpperCase().optional(),
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

export const addBusinessProductSchema = z.object({
  catalogSourceId: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(160),
  imageUrl: z.string().trim().max(2000).default(""),
  unit: z.enum(PRODUCT_UNITS),
  unitCost: z.coerce.number().finite().min(0).max(100000),
});

export function moneyToMinorUnits(value: number) {
  return Math.round((value + Number.EPSILON) * 100);
}
