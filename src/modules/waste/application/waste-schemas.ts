import { z } from "zod";

export const createWasteLogSchema = z.object({
  businessProductId: z.string().uuid(),
  wasteReasonId: z.string().uuid().optional(),
  quantity: z.coerce.number().positive().max(100000),
  note: z.string().trim().max(500).optional(),
  occurredAt: z.string().datetime().optional(),
});

export const batchWasteLogSchema = z.object({
  wasteReasonId: z.string().uuid().optional(),
  note: z.string().trim().max(500).optional(),
  entries: z
    .array(
      z.object({
        businessProductId: z.string().uuid(),
        quantity: z.coerce.number().positive().max(100000),
      }),
    )
    .min(1)
    .max(50),
});
