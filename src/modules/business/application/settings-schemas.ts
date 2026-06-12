import { z } from "zod";

export const createLocationSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export const updateLocationSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  isActive: z.boolean().optional(),
});

export const updateBusinessProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
});
