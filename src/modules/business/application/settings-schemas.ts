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

export const inviteMemberSchema = z.object({
  email: z.string().trim().email().max(200),
  role: z.enum(["admin", "manager", "staff"]),
  fullName: z.string().trim().min(2).max(120).optional(),
});

export const updateMemberSchema = z.object({
  role: z.enum(["admin", "manager", "staff"]).optional(),
  isActive: z.boolean().optional(),
});
