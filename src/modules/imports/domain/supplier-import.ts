export type ImportStatus = "pending" | "processing" | "completed" | "failed";

export interface SupplierImport {
  id: string;
  originalFilename: string;
  status: ImportStatus;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}
