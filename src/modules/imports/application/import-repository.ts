import type { ImportProcessingResult } from "@/src/modules/imports/domain/import-result";
import type { SupplierImport } from "@/src/modules/imports/domain/supplier-import";

export interface CreateSupplierImportInput {
  businessId: string;
  userId: string;
  originalFilename: string;
  storagePath: string;
  processingResult?: ImportProcessingResult;
}

export interface SupplierImportRepository {
  list(businessId: string): Promise<SupplierImport[]>;
  create(input: CreateSupplierImportInput): Promise<SupplierImport>;
}
