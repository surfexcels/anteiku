import { z } from "zod";

const lineSchema = z.object({
  businessProductId: z.string().uuid(),
  openingQuantity: z.coerce.number().min(0),
  closingQuantity: z.coerce.number().min(0).nullable().optional(),
  note: z.string().max(300).nullable().optional(),
});

export const openInventoryDaySchema = z.object({
  stockDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lines: z.array(lineSchema).min(1),
  note: z.string().max(500).nullable().optional(),
  carryForward: z.boolean().optional(),
});

export const closeInventoryDaySchema = z.object({
  lines: z.array(
    lineSchema.extend({
      closingQuantity: z.coerce.number().min(0),
    }),
  ).min(1),
  note: z.string().max(500).nullable().optional(),
});

export const updateOpeningSchema = z.object({
  lines: z.array(lineSchema).min(1),
  note: z.string().max(500).nullable().optional(),
});
