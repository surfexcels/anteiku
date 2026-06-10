import { z } from "zod";

export const createReportSchema = z
  .object({
    periodStart: z.string().date(),
    periodEnd: z.string().date(),
  })
  .refine((value) => value.periodEnd >= value.periodStart, {
    message: "End date must be on or after start date",
    path: ["periodEnd"],
  });
