import type { ImportProcessingResult } from "@/src/modules/imports/domain/import-result";

export type ImportStatus = "pending" | "processing" | "completed" | "failed";

export interface SupplierImport {
  id: string;
  originalFilename: string;
  status: ImportStatus;
  errorMessage: string | null;
  result: ImportProcessingResult | null;
  createdAt: string;
  completedAt: string | null;
}
