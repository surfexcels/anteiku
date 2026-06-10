import { z } from "zod";

export const createSupplierImportSchema = z.object({
  originalFilename: z.string().trim().min(1).max(255),
});
