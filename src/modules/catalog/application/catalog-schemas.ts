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

export const addCustomBusinessProductSchema = z.object({
  name: z.string().trim().min(1).max(160),
  unit: z.enum(PRODUCT_UNITS),
  unitCost: z.coerce.number().finite().min(0).max(100000),
});

export const updateBusinessProductSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  unit: z.enum(PRODUCT_UNITS).optional(),
  unitCost: z.coerce.number().finite().min(0).max(100000).optional(),
  isActive: z.boolean().optional(),
  unitCo2eG: z.coerce.number().finite().min(0).max(1_000_000).optional(),
  co2eSource: z.enum(["benchmark", "manual", "supplier", "verified"]).optional(),
  co2eMethodology: z.string().trim().max(2000).optional().nullable(),
});

export function moneyToMinorUnits(value: number) {
  return Math.round((value + Number.EPSILON) * 100);
}
